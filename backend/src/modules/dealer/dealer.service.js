import supabase from '../../config/supabase.js';

class DealerService {
  /**
   * Get all registered dealers from normalized dealers table
   * Supports PostGIS stored procedure with native Haversine calculation,
   * falling back to in-memory Haversine formula.
   */
  async getDealers({
    role = null,
    searchQuery = null,
    userLat = null,
    userLon = null,
    radius = null,
    includeUnapproved = false,
  }) {
    const hasCoords =
      userLat !== null &&
      userLon !== null &&
      !isNaN(parseFloat(userLat)) &&
      !isNaN(parseFloat(userLon));

    // 1. If user coordinates provided, attempt PostGIS RPC in Supabase first
    if (hasCoords) {
      try {
        const { data: rpcDealers, error: rpcError } = await supabase.rpc(
          'get_nearby_approved_dealers',
          {
            user_lat: parseFloat(userLat),
            user_lon: parseFloat(userLon),
            radius_km:
              radius !== null &&
              radius !== undefined &&
              parseFloat(radius) !== 1500
                ? parseFloat(radius)
                : 20000,
            target_role: role || null,
          }
        );

        if (!rpcError && Array.isArray(rpcDealers) && rpcDealers.length > 0) {
          let list = rpcDealers.map((d) => ({
            id: d.id,
            dealerId: d.id,
            userId: d.user_id,
            name: d.company_name,
            companyName: d.company_name,
            address: d.street_address,
            streetAddress: d.street_address,
            city: d.city,
            postalCode: d.postal_code,
            phone: d.phone,
            email: d.contact_email,
            role: d.role || 'reseller',
            latitude: d.latitude,
            longitude: d.longitude,
            distance: `${d.distance_km} km`,
            distanceKm: parseFloat(d.distance_km),
            isApproved: true,
            isLive: true,
          }));

          if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
              (d) =>
                (d.name && d.name.toLowerCase().includes(q)) ||
                (d.city && d.city.toLowerCase().includes(q)) ||
                (d.address && d.address.toLowerCase().includes(q)) ||
                (d.email && d.email.toLowerCase().includes(q))
            );
          }

          return list;
        }
      } catch (rpcErr) {
        console.warn('PostGIS RPC failed or not installed, falling back to Haversine:', rpcErr.message);
      }
    }

    // 2. Fallback: Query dealers table with user info and compute Haversine
    let query = supabase
      .from('dealers')
      .select('*, user:users(id, name, email, role, phone)')
      .order('company_name', { ascending: true });

    const { data: dealers, error } = await query;

    if (error) {
      console.warn('Could not fetch from dealers table, falling back to users:', error.message);
      let userQuery = supabase.from('users').select('*').in('role', ['reseller', 'distributor']);
      const { data: usersData } = await userQuery;
      return (usersData || []).map((u) => ({
        id: u.id,
        dealerId: u.id,
        userId: u.id,
        name: u.name,
        companyName: u.name,
        address: u.address || 'Address on file',
        streetAddress: u.address || 'Address on file',
        city: 'Johannesburg',
        phone: u.phone,
        email: u.email,
        role: u.role || 'reseller',
        distance: 'N/A',
        isApproved: u.is_approved ?? false,
        approvalStatus: u.approval_status || 'pending_approval',
      }));
    }

    let list = (dealers || []).map((d) => {
      const u = d.user || {};
      let distance = 'N/A';
      let distanceKm = 999999;

      if (hasCoords && d.latitude && d.longitude) {
        const dist = this.calculateDistance(
          parseFloat(userLat),
          parseFloat(userLon),
          parseFloat(d.latitude),
          parseFloat(d.longitude)
        );
        distance = `${dist} km`;
        distanceKm = dist;
      }

      // Check approval: default to true for backwards compatibility if null, otherwise respect boolean
      const isApproved =
        u.is_approved !== undefined ? Boolean(u.is_approved) : d.is_live !== undefined ? Boolean(d.is_live) : true;
      const isLive = d.is_live !== undefined ? Boolean(d.is_live) : isApproved;

      return {
        id: d.id,
        dealerId: d.id,
        userId: d.user_id,
        name: d.company_name || u.name,
        companyName: d.company_name || u.name,
        address: d.street_address,
        streetAddress: d.street_address,
        city: d.city,
        postalCode: d.postal_code,
        country: d.country,
        latitude: d.latitude,
        longitude: d.longitude,
        phone: d.phone || u.phone,
        email: d.contact_email || u.email,
        role: u.role || 'reseller',
        distance,
        distanceKm,
        isApproved,
        isLive,
        approvalStatus: u.approval_status || (isApproved ? 'approved' : 'pending_approval'),
      };
    });

    // Unless explicitly requested (e.g. by Admin panel), only return approved & live dealers
    if (!includeUnapproved) {
      list = list.filter((d) => d.isApproved && d.isLive);
    }

    // Role filter
    if (role && role.toLowerCase() !== 'all') {
      list = list.filter((d) => d.role.toLowerCase() === role.toLowerCase());
    }

    // Text search filter
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          (d.name && d.name.toLowerCase().includes(q)) ||
          (d.city && d.city.toLowerCase().includes(q)) ||
          (d.address && d.address.toLowerCase().includes(q)) ||
          (d.email && d.email.toLowerCase().includes(q))
      );
    }

    // Distance radius filter if user coordinates and explicit radius were provided
    if (hasCoords && radius !== null && radius !== undefined && !isNaN(parseFloat(radius))) {
      const maxRadius = parseFloat(radius);
      if (maxRadius !== 1500) {
        list = list.filter((d) => d.distanceKm <= maxRadius);
      }
    }

    // Sort by distance if user coordinates were provided
    if (hasCoords) {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return list;
  }

  /**
   * Update dealer approval & live status
   */
  async updateApproval(id, { is_approved, is_live, approval_status, rejection_reason }) {
    if (!id) {
      throw new Error('Dealer ID is required');
    }

    // Determine target dealer record
    const { data: dealer, error: fetchError } = await supabase
      .from('dealers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !dealer) {
      throw new Error('Dealer record not found');
    }

    const liveState = is_live !== undefined ? Boolean(is_live) : Boolean(is_approved);

    // Update dealers table
    await supabase.from('dealers').update({ is_live: liveState }).eq('id', id);

    // Also update users table if user_id linked
    if (dealer.user_id) {
      const userPayload = {
        is_approved: liveState,
        approval_status: approval_status || (liveState ? 'approved' : 'rejected'),
        updated_at: new Date().toISOString(),
      };
      if (liveState) userPayload.approved_at = new Date().toISOString();
      if (rejection_reason) userPayload.rejection_reason = rejection_reason;

      await supabase.from('users').update(userPayload).eq('id', dealer.user_id);
    }

    return { id, is_live: liveState, is_approved: liveState };
  }

  /**
   * Calculate distance using Haversine formula (km)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  }
}

export const dealerService = new DealerService();
export default dealerService;
