import supabase from '../../config/supabase.js';

class DealerService {
  /**
   * Get all registered dealers from normalized dealers table
   */
  async getDealers({ role = null, searchQuery = null, userLat = null, userLon = null }) {
    const { data: dealers, error } = await supabase
      .from('dealers')
      .select('*, user:users(id, name, email, role, phone)')
      .order('company_name', { ascending: true });

    if (error) {
      console.warn('Could not fetch from dealers table, falling back to users:', error.message);
      let query = supabase.from('users').select('*').in('role', ['reseller', 'distributor']);
      const { data: usersData } = await query;
      return usersData || [];
    }

    let list = (dealers || []).map((d) => {
      const u = d.user || {};
      let distance = 'N/A';

      if (userLat && userLon && d.latitude && d.longitude) {
        const dist = this.calculateDistance(
          parseFloat(userLat),
          parseFloat(userLon),
          parseFloat(d.latitude),
          parseFloat(d.longitude)
        );
        distance = `${dist} km`;
      }

      return {
        id: d.id,
        dealerId: d.id,
        userId: d.user_id,
        name: d.company_name || u.name,
        companyName: d.company_name,
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
      };
    });

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

    // Sort by distance if user coordinates are provided
    if (userLat && userLon) {
      list.sort((a, b) => {
        const distA = parseFloat(a.distance) || 999999;
        const distB = parseFloat(b.distance) || 999999;
        return distA - distB;
      });
    }

    return list;
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
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  }
}

export const dealerService = new DealerService();
export default dealerService;
