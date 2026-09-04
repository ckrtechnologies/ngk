import supabase from '../../config/supabase.js';

class UserService {
  async getUserById(id) {
    if (!id) {
      throw new Error('User ID is required');
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, address, phone, created_at, updated_at')
      .eq('id', id);

    if (error || !data || data.length === 0) {
      throw new Error('User not found');
    }

    const user = data[0];

    // Fetch vehicles from normalized garage_vehicles table
    const { data: garageRows } = await supabase
      .from('garage_vehicles')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    const garageList = (garageRows && garageRows.length > 0)
      ? garageRows.map(v => ({
          id: v.id,
          make: v.make,
          model: v.model,
          year: v.year,
          engine: v.engine_code,
          engine_code: v.engine_code,
          licensePlate: v.license_plate || v.raw_specs?.licensePlate || v.raw_specs?.license_plate || '',
          license_plate: v.license_plate || v.raw_specs?.licensePlate || v.raw_specs?.license_plate || '',
          vin: v.vin,
          linkageTargetId: v.linkage_target_id,
          created_at: v.created_at,
        }))
      : [];

    // Fetch watchlist items
    const { data: watchlistRows } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    // Fetch notifications
    const { data: notificationRows } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    user.garage = garageList;
    user.cars = garageList;
    user.vehicleId = garageList;
    user.watchList = watchlistRows || [];
    user.watchlist = watchlistRows || [];
    user.searchHistory = [];
    user.notifications = notificationRows || [];

    return user;
  }

  async getAllUsers(role = null) {
    let query = supabase
      .from('users')
      .select('id, name, email, role, address, phone, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (role && role.toUpperCase() !== 'ALL') {
      query = query.eq('role', role.toLowerCase());
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Failed to fetch users');
    return data || [];
  }

  async updateUser(id, updateFields) {
    if (!id) {
      throw new Error('User ID is required');
    }
    if (!updateFields || typeof updateFields !== 'object') {
      throw new Error('Invalid update payload');
    }

    const payload = { updated_at: new Date().toISOString() };

    // 1. Name validation (string, trimmed, min 2 chars)
    if (updateFields.name !== undefined) {
      if (typeof updateFields.name !== 'string' || updateFields.name.trim().length < 2) {
        throw new Error('Name must be a valid text of at least 2 characters');
      }
      payload.name = updateFields.name.trim();
    }

    // 2. Email validation (string, valid regex, unique check)
    if (updateFields.email !== undefined) {
      if (typeof updateFields.email !== 'string') {
        throw new Error('Email must be a valid text');
      }
      const cleanEmail = updateFields.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw new Error('Please provide a valid email address');
      }
      // Check if another user is already registered with this email
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .neq('id', id);
      if (existingUser && existingUser.length > 0) {
        throw new Error('This email address is already registered to another account');
      }
      payload.email = cleanEmail;
    }

    // 3. Role validation (string, one of allowed roles)
    if (updateFields.role !== undefined) {
      const cleanRole = String(updateFields.role).trim().toLowerCase();
      const validRoles = ['owner', 'reseller', 'distributor', 'admin'];
      if (!validRoles.includes(cleanRole)) {
        throw new Error(`Invalid role '${cleanRole}'. Must be one of: ${validRoles.join(', ')}`);
      }
      payload.role = cleanRole;
    }

    // 4. Phone validation (string, trimmed or null)
    if (updateFields.phone !== undefined) {
      if (updateFields.phone === null || updateFields.phone === '') {
        payload.phone = null;
      } else {
        payload.phone = String(updateFields.phone).trim();
      }
    }

    // 5. Address validation (string, trimmed or null)
    if (updateFields.address !== undefined) {
      if (updateFields.address === null || updateFields.address === '') {
        payload.address = null;
      } else {
        payload.address = String(updateFields.address).trim();
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', id)
      .select('id, name, email, role, address, phone, created_at, updated_at');

    if (error) throw new Error(error.message || 'Failed to update user');
    if (!data || data.length === 0) throw new Error('User not found');

    // Return full hydrated user object with garage, watchlist, notifications
    const fullUser = await this.getUserById(id);
    return fullUser;
  }

  async deleteUser(id) {
    // Delete user's relations first to maintain FK integrity
    await supabase.from('enquiry').delete().eq('user_id', id);
    await supabase.from('garage_vehicles').delete().eq('user_id', id);
    await supabase.from('watchlist_items').delete().eq('user_id', id);
    await supabase.from('notifications').delete().eq('user_id', id);
    await supabase.from('dealers').delete().eq('user_id', id);
    const { data, error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message || 'Failed to delete user');
    return true;
  }

  async readNotifications(id) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', id)
      .select();

    if (error) throw new Error('Failed to update notifications');
    return data || [];
  }
}

export const userService = new UserService();
export default userService;
