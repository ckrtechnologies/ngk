import supabase from '../../config/supabase.js';

class UserService {
  async getUserById(id) {
    const { data, error } = await supabase.from('users').select('id, name, email, role, address, created_at').eq('id', id);
    if (error || !data || data.length === 0) {
      throw new Error('User not found');
    }
    return data[0];
  }

  async getAllUsers(role = null) {
    let query = supabase.from('users').select('id, name, email, role, address, created_at').order('created_at', { ascending: false });
    if (role && role !== 'ALL') {
      query = query.eq('role', role.toLowerCase());
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Failed to fetch users');
    return data || [];
  }

  async updateUser(id, updateFields) {
    const allowed = ['name', 'email', 'role', 'address'];
    const payload = {};
    for (const key of allowed) {
      if (updateFields[key] !== undefined) {
        payload[key] = updateFields[key];
      }
    }

    const { data, error } = await supabase.from('users').update(payload).eq('id', id).select('id, name, email, role, address');
    if (error) throw new Error(error.message || 'Failed to update user');
    return data;
  }

  async deleteUser(id) {
    // Delete user's enquiries first to maintain FK integrity
    await supabase.from('enquiry').delete().eq('user_id', id);
    const { data, error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message || 'Failed to delete user');
    return true;
  }

  async readNotifications(id) {
    const { data, error } = await supabase.from('users').select('notifications').eq('id', id);
    if (error || !data || data.length === 0) throw new Error('User not found');

    const updated = (data[0].notifications || []).map(n => ({ ...n, isRead: true }));
    const { error: updateError } = await supabase.from('users').update({ notifications: updated }).eq('id', id);
    if (updateError) throw new Error('Failed to update notifications');
    return updated;
  }
}

export const userService = new UserService();
export default userService;
