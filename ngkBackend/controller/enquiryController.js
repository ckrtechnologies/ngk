import supabase from "../utils/supabase.js";

export const addEnquiry = async (req, res) => {
    const { userId, enquiryDate, vehicle, dealer, imageurl } = req.body;

    try {
        const { data, error } = await supabase.from('enquiry').insert({
            user_id: userId,
            dealer: dealer || null,
            enquiryDate: enquiryDate || new Date().toISOString(),
            vehicle: vehicle || {
                status: "Pending",
                quantity: 1,
                enquiryDetails: "Enquiry with Photo Reference",
                title: "Enquiry with Photo Reference",
                description: "Uploaded part image for verification",
                imageurl: imageurl || null,
                messages: [
                    {
                        sender: "owner",
                        senderName: "Owner",
                        text: "Enquiry with Photo Reference",
                        timestamp: new Date().toISOString(),
                        isSystem: false
                    }
                ]
            }
        }).select();

        if (error) {
            console.log("Error inserting enquiry:", error);
            return res.status(400).json({ success: false, message: "Failed to add enquiry", error: error.message });
        }

        return res.status(201).json({ success: true, message: "Enquiry added successfully", enquiry: data });
    } catch (error) {
        console.log("Server error addEnquiry:", error);
        return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};

export const getEnquiry = async (req, res) => {
    const { userId } = req.params;

    try {
        // First get the user's role
        const userRes = await supabase.from('users').select('*').eq('id', userId);
        if (userRes.error || !userRes.data || userRes.data.length === 0) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const user = userRes.data[0];
        let query = supabase.from('enquiry').select('*, users!enquiry_user_id_fkey(name, email, role), dealer:users!enquiry_dealer_fkey(name, email, role)').order('created_at', { ascending: false });

        // If user is owner, filter by user_id
        if (user.role === 'owner') {
            query = query.eq('user_id', userId);
        }
        // Resellers and distributors see all enquiries

        if(user.role === 'reseller') {
            query = query.eq('dealer', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.log("Error fetching enquiry:", error);
            return res.status(400).json({ success: false, message: "Failed to fetch enquiries", error: error.message });
        }

        // Map data to unpack vehicle jsonb fields for easy frontend access
        const formattedEnquiries = data.map(item => {
            const v = item.vehicle || {};
            const userObj = item['users!enquiry_user_id_fkey'] || item.users || {};
            const dealerObj = item.dealer || {};
            return {
                ...item,
                status: v.status || 'Pending',
                title: v.title || (v.vehicle?.typeName || v.vehicle?.modelName || v.part?.title || 'Technical Enquiry'),
                description: v.description || (v.part?.subtitle || v.vehicle?.manuName || 'No details available'),
                quantity: v.quantity || 1,
                enquiryDetails: v.enquiryDetails || '',
                messages: v.messages || [],
                part: v.part || null,
                vehicleData: v.vehicle || null,
                imageurl: v.imageurl || item.imageurl || null,
                userName: userObj.name || 'Customer',
                userEmail: userObj.email || '',
                dealerName: dealerObj.name || 'Reseller'
            };
        });

        return res.status(200).json({ success: true, message: "Enquiries fetched successfully", enquiry: formattedEnquiries });
    } catch (error) {
        console.log("Server error getEnquiry:", error);
        return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};

export const updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status, responderName, role } = req.body;

    try {
        // First fetch current enquiry
        const { data: currentData, error: fetchError } = await supabase.from('enquiry').select('*').eq('id', id);
        if (fetchError || !currentData || currentData.length === 0) {
            return res.status(404).json({ success: false, message: "Enquiry not found" });
        }

        const enquiry = currentData[0];
        const v = enquiry.vehicle || {};
        const messages = v.messages || [];

        // Add a system status update message
        const statusMsg = {
            sender: role || 'system',
            senderName: responderName || (role === 'distributor' ? 'Distributor' : 'Reseller'),
            text: `Enquiry status updated to ${status.toUpperCase()}`,
            timestamp: new Date().toISOString(),
            isSystem: true
        };

        const updatedVehicle = {
            ...v,
            status: status,
            messages: [...messages, statusMsg]
        };

        const { data, error } = await supabase.from('enquiry').update({
            vehicle: updatedVehicle
        }).eq('id', id).select();

        if (error) {
            console.log("Error updating status:", error);
            return res.status(400).json({ success: false, message: "Failed to update status", error: error.message });
        }

        return res.status(200).json({ success: true, message: "Status updated successfully", enquiry: data });
    } catch (error) {
        console.log("Server error updateStatus:", error);
        return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};

export const addMessage = async (req, res) => {
    const { id } = req.params;
    const { sender, senderName, text } = req.body;

    try {
        const { data: currentData, error: fetchError } = await supabase.from('enquiry').select('*').eq('id', id);
        if (fetchError || !currentData || currentData.length === 0) {
            return res.status(404).json({ success: false, message: "Enquiry not found" });
        }

        const enquiry = currentData[0];
        const v = enquiry.vehicle || {};
        const messages = v.messages || [];

        const newMsg = {
            sender: sender || 'user',
            senderName: senderName || 'User',
            text: text,
            timestamp: new Date().toISOString(),
            isSystem: false
        };

        const updatedVehicle = {
            ...v,
            messages: [...messages, newMsg]
        };

        const { data, error } = await supabase.from('enquiry').update({
            vehicle: updatedVehicle
        }).eq('id', id).select();

        if (error) {
            console.log("Error adding message:", error);
            return res.status(400).json({ success: false, message: "Failed to add message", error: error.message });
        }

        return res.status(200).json({ success: true, message: "Message added successfully", enquiry: data });
    } catch (error) {
        console.log("Server error addMessage:", error);
        return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};
