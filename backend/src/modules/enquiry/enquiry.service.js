import supabase from '../../config/supabase.js';

class EnquiryService {
  /**
   * 1. Add Technical Enquiry
   */
  async addEnquiry(payload) {
    const userId = payload.userId || payload.user_id;
    if (!userId) {
      throw new Error('User ID is required to create an enquiry');
    }

    const dealer = payload.dealerId || payload.dealer_id || payload.dealer || null;
    const title =
      payload.title ||
      (payload.partName ? `${payload.partName}${payload.partNumber ? ` (${payload.partNumber})` : ''}`.trim() : null) ||
      payload.vehicle?.title ||
      payload.vehicle?.vehicle?.typeName ||
      payload.vehicle?.part?.title ||
      'Technical Enquiry';
    const description =
      payload.enquiryDetails ||
      payload.description ||
      payload.vehicle?.description ||
      payload.vehicle?.enquiryDetails ||
      payload.vehicle?.part?.subtitle ||
      'Technical enquiry regarding automotive parts';
    const quantity = Number(payload.quantity || payload.vehicle?.quantity || 1);
    const finalImageUrl =
      payload.imageUrl ||
      payload.imageurl ||
      payload.image_url ||
      payload.vehicle?.imageurl ||
      null;

    // 1. Insert into normalized enquiries table
    const { data: newEnquiry, error: enquiryError } = await supabase
      .from('enquiries')
      .insert({
        user_id: userId,
        dealer_id: dealer || null,
        title: title,
        description: description,
        quantity: quantity,
        image_url: finalImageUrl,
        part_reference: payload.vehicle || payload,
        status: 'Pending',
      })
      .select()
      .single();

    if (enquiryError) {
      console.error('Error inserting into enquiries table:', enquiryError.message);
      throw new Error(enquiryError.message || 'Failed to create enquiry');
    }

    const enquiryId = newEnquiry.id;

    // 2. Insert initial system message into enquiry_messages
    await supabase.from('enquiry_messages').insert({
      enquiry_id: enquiryId,
      sender_id: userId,
      sender_name: 'Customer',
      sender_role: 'owner',
      message_text: vehicle?.enquiryDetails || 'Technical Enquiry Submitted',
      is_system: false,
    });

    // 3. Fetch customer details for notifications
    const { data: customer } = await supabase.from('users').select('id, name').eq('id', userId);
    const customerName = customer?.[0]?.name || 'Customer';

    // 4. Notify assigned dealer if present
    if (dealer) {
      await supabase.from('notifications').insert({
        user_id: dealer,
        message: `New technical enquiry submitted by ${customerName}`,
        event_type: 'new_enquiry',
        metadata: { enquiryId },
      });
    }

    // 5. Notify administrators
    const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          message: `New technical enquiry submitted by ${customerName}`,
          event_type: 'new_enquiry',
          metadata: { enquiryId },
        });
      }
    }

    return [newEnquiry];
  }

  /**
   * 2. Get Enquiries by User ID & Role
   */
  async getEnquiries(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data: userRes, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId);

    if (userError || !userRes || userRes.length === 0) {
      throw new Error('User not found');
    }

    const user = userRes[0];
    let query = supabase
      .from('enquiries')
      .select('*, customer:users!enquiries_user_id_fkey(name, email, role), dealer:users!enquiries_dealer_id_fkey(name, email, role), messages:enquiry_messages(*)')
      .order('created_at', { ascending: false });

    // Filter by role
    if (user.role === 'owner') {
      query = query.eq('user_id', userId);
    } else if (user.role === 'reseller') {
      query = query.eq('dealer_id', userId);
    }
    // Admin and distributor see all

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching enquiries:', error.message);
      throw new Error(error.message || 'Failed to fetch enquiries');
    }

    return (data || []).map((item) => {
      const customerObj = item.customer || {};
      const dealerObj = item.dealer || {};
      const partRef = item.part_reference || {};
      const messagesList = (item.messages || []).sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );

      return {
        ...item,
        status: item.status || 'Pending',
        title: item.title,
        description: item.description,
        quantity: item.quantity || 1,
        enquiryDetails: item.description || '',
        messages: messagesList.map((m) => ({
          id: m.id,
          sender: m.sender_role || 'user',
          senderName: m.sender_name || 'User',
          text: m.message_text,
          timestamp: m.created_at,
          isSystem: m.is_system,
        })),
        part: partRef.part || null,
        vehicleData: partRef.vehicle || null,
        imageurl: item.image_url || null,
        userName: customerObj.name || 'Customer',
        userEmail: customerObj.email || '',
        dealerName: dealerObj.name || 'Reseller',
      };
    });
  }

  /**
   * 3. Update Enquiry Status
   */
  async updateStatus(id, { status, responderName, role }) {
    const { data: enquiry, error: fetchError } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !enquiry) {
      throw new Error('Enquiry not found');
    }

    // Update status in enquiries table
    const { data: updated, error: updateError } = await supabase
      .from('enquiries')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (updateError) throw new Error(updateError.message || 'Failed to update status');

    // Add status update audit message in enquiry_messages
    await supabase.from('enquiry_messages').insert({
      enquiry_id: id,
      sender_name: responderName || (role === 'distributor' ? 'Distributor' : 'Reseller'),
      sender_role: role || 'system',
      message_text: `Enquiry status updated to ${status.toUpperCase()}`,
      is_system: true,
    });

    // Notify customer
    if (enquiry.user_id) {
      await supabase.from('notifications').insert({
        user_id: enquiry.user_id,
        message: `Your enquiry status changed to ${status.toUpperCase()}`,
        event_type: 'enquiry_status',
        metadata: { enquiryId: id, status },
      });
    }

    return updated;
  }

  /**
   * 4. Add Message to Enquiry Thread
   */
  async addMessage(id, { sender, senderName, text, senderId }) {
    if (!text || !text.trim()) {
      throw new Error('Message text cannot be empty');
    }

    const { data: enquiry, error: fetchError } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !enquiry) {
      throw new Error('Enquiry not found');
    }

    // Insert message into normalized enquiry_messages
    const { data: newMsg, error: insertError } = await supabase
      .from('enquiry_messages')
      .insert({
        enquiry_id: id,
        sender_id: senderId || (sender === 'owner' ? enquiry.user_id : enquiry.dealer_id),
        sender_name: senderName || 'User',
        sender_role: sender || 'user',
        message_text: text.trim(),
        is_system: false,
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message || 'Failed to add message');

    // Update enquiry updated_at timestamp
    await supabase.from('enquiries').update({ updated_at: new Date().toISOString() }).eq('id', id);

    // Notify other party
    const targetUserId = sender === 'owner' ? enquiry.dealer_id : enquiry.user_id;
    if (targetUserId) {
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        message: `New message on enquiry from ${senderName || 'support'}`,
        event_type: 'new_message',
        metadata: { enquiryId: id },
      });
    }

    return [enquiry];
  }
}

export const enquiryService = new EnquiryService();
export default enquiryService;
