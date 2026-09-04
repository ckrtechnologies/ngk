-- ==============================================================================
-- NGK2 MIGRATION 002: POSTGIS GEOSPATIAL EXTENSION & SIMPLE ENQUIRY SYSTEM
-- ==============================================================================

-- 1. Enable PostGIS Extension (Native Geospatial indexing & Haversine distance)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add Approval & Verification Fields to Users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending_approval' 
    CHECK (approval_status IN ('pending_approval', 'approved', 'rejected', 'suspended')),
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Auto-approve vehicle owners (only resellers & distributors require admin vetting)
UPDATE public.users 
SET is_approved = TRUE, approval_status = 'approved' 
WHERE role = 'owner';

-- 3. Add Spatial Geography Point and GiST Index to Dealers Table
ALTER TABLE public.dealers
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;

-- Ensure dealers is_live matches user is_approved
UPDATE public.dealers d
SET is_live = u.is_approved
FROM public.users u
WHERE d.user_id = u.id;

-- Add a PostGIS geography point column (WGS84 SRID 4326: Lon, Lat)
-- If generated column is supported, compute from latitude & longitude
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealers' AND column_name = 'location'
    ) THEN
        ALTER TABLE public.dealers ADD COLUMN location geography(Point, 4326);
    END IF;
END $$;

-- Populate geography point from existing lat/lon coordinates
UPDATE public.dealers
SET location = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4. High-Performance GiST Spatial Index
CREATE INDEX IF NOT EXISTS idx_dealers_spatial_location 
ON public.dealers USING GIST (location);

-- Index for filtering live & approved dealers
CREATE INDEX IF NOT EXISTS idx_dealers_is_live 
ON public.dealers(is_live);

-- 5. FAST SUPABASE RPC: Get Nearby Approved Dealers via PostGIS
-- Computes great-circle Haversine distance natively in microseconds
CREATE OR REPLACE FUNCTION get_nearby_approved_dealers(
    user_lat DOUBLE PRECISION,
    user_lon DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 50.0,
    target_role VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    company_name VARCHAR,
    street_address TEXT,
    city VARCHAR,
    postal_code VARCHAR,
    phone VARCHAR,
    contact_email VARCHAR,
    role VARCHAR,
    latitude DECIMAL,
    longitude DECIMAL,
    distance_km NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        d.id,
        d.user_id,
        d.company_name,
        d.street_address,
        d.city,
        d.postal_code,
        d.phone,
        d.contact_email,
        u.role,
        d.latitude,
        d.longitude,
        -- PostGIS ST_Distance on geography uses great-circle Haversine formula (returns meters)
        ROUND((ST_Distance(d.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography) / 1000.0)::numeric, 1) AS distance_km
    FROM public.dealers d
    JOIN public.users u ON u.id = d.user_id
    WHERE 
        u.is_approved = TRUE
        AND d.is_live = TRUE
        AND (target_role IS NULL OR u.role = target_role)
        -- ST_DWithin leverages the GiST spatial index for blazing-fast bounding-box + radius search
        AND ST_DWithin(d.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography, radius_km * 1000.0)
    ORDER BY distance_km ASC;
$$;
