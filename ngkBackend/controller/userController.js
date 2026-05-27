import supabase from "../utils/supabase.js"
import bcrypt from 'bcrypt';
import dotenv from "dotenv";

dotenv.config();

const otpStore = new Map();

export const registerUser = async (req, res) => {
    const { role, name, email, password, address } = req.body;

    console.log(role, name, email, password)


    try {

        const { alreadyExistUser, err1 } = await supabase.from('users').select('*').eq('email', email);
        if (alreadyExistUser && alreadyExistUser.length > 0) {
            return res.status(400).json({ success: false, message: "User already exists" })

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase.from('users').insert({
            role,
            name,
            email,
            address,
            password: hashedPassword,
        }).select()

        if (error) {
            return res.status(400).json({ success: false, message: "Something went wrong" })
        }

        return res.status(201).json({ success: true, message: "User registered successfully", user: data })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Something went wrong" })
    }
}

export const loginUser = async (req, res) => {
    const { email, password, role } = req.body;

    console.log(email, password, role)
    try {

        const { data, error } = await supabase.from('users').select('*').eq('email', email);
        if (error) {
            console.log(error, "rerror")
            return res.status(400).json({ success: false, message: "Something went wrong" })
        }
        if (data && data.length > 0) {
            const isPasswordValid = await bcrypt.compare(password, data[0].password);
            if (!isPasswordValid) {
                return res.status(400).json({ success: false, message: "Invalid password" })
            }
            if (data[0].role !== role) {
                return res.status(400).json({ success: false, message: "Invalid role" })
            }



            return res.status(200).json({ success: true, message: "User logged in successfully", user: data })
        }
        return res.status(400).json({ success: false, message: "User not found! Please Register" })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Something went wrong" })
    }
}

export const updatePassword = async (req, res) => {
    const { email, password } = req.body;

    console.log(email, password)

    try {
        const user = await supabase.from('users').select('*').eq('email', email)
        if (user.error || user.data.length === 0) {
            return res.status(400).json({ success: false, message: "User Not Found! Please Register" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: updateData, error: updateError } = await supabase.from('users').update({
            password: hashedPassword
        }).eq('id', user.data[0].id).select()

        if (updateError) {
            return res.status(400).json({ success: false, message: "Failed to update password" })
        }
        return res.status(200).json({ success: true, message: "Password updated successfully", user: updateData })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Something went wrong" })
    }
}

export const sendOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const { data, error } = await supabase.from('users').select('*').eq('email', email);
        if (error || !data || data.length === 0) {
            return res.status(400).json({ success: false, message: "User Not Found! Please Register" });
        }

        // Generate a 6-digit random OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

        otpStore.set(email, { otp, expires });

        console.log(`[OTP Verification] Generated OTP for ${email}: ${otp}`);

        return res.status(200).json({ 
            success: true, 
            message: "OTP sent successfully to email", 
            otp: otp
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
}

export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const entry = otpStore.get(email);
        if (!entry) {
            return res.status(400).json({ success: false, message: "No OTP request found for this email" });
        }

        if (Date.now() > entry.expires) {
            otpStore.delete(email);
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one" });
        }

        if (entry.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP. Please try again" });
        }

        otpStore.delete(email);
        return res.status(200).json({ success: true, message: "OTP verified successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
}

export const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await supabase.from('users').select('*').eq('id', id)

        if (user.error) {
            return res.status(400).json({ success: false, message: "Something went wrong" })
        }
        if (user.data && user.data.length > 0) {
            return res.status(200).json({ success: true, message: "User found", user: user.data })
        }
        return res.status(400).json({ success: false, message: "User not found" })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Something went wrong" })
    }
}

export const getUsers = async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('*')
        console.log(data)
        if (error) {
            return res.status(400).json({ success: false, message: "Something went wrong" })
        }
        return res.status(200).json({ success: true, message: "Users found", users: data })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Something went wrong" })
    }
}


export const addVehicleToGarage = async (req, res) => {
    const { id } = req.params
    const { modal } = req.body

    try {
        const { data, error } = await supabase.from('users').select('*').eq('id', id)

        if (error || data.length === 0) {
            return res.status(400).json({ success: false, message: "User Not Found" })
        }
        if (data && data.length > 0) {
            if (data[0].role !== 'owner') {
                return res.status(400).json({ success: false, message: "User is not owner" })
            }



            const vehicle = data[0].vehicleId?.length > 0 ? [...data[0].vehicleId, modal] : [modal]

            const { updateData, updateError } = await supabase.from('users').update({
                vehicleId: vehicle
            }).eq('id', id).select()

            if (updateError) {
                return res.status(400).json({ success: false, message: "Failed to add vehicle" })
            }
            return res.status(200).json({ success: true, message: "Vehicle added successfully", user: data })
        }
    } catch (err) {
        console.log(err.message)
        return res.status(500).json({ success: false, message: `Error: ${err.message}` })
    }
}


export const addSearchHistory = async (req, res) => {
    const { id } = req.params
    const { dat } = req.body

    console.log(id, dat)

    try {
        const { data, error } = await supabase.from('users').select('*').eq('id', id)

        if (error || data.length === 0) {
            return res.status(400).json({ success: false, message: "User Not Found" })
        }
        if (data && data.length > 0) {



            const searchHistory = data[0].searchHistory?.length > 0 ? [...data[0].searchHistory, dat] : [dat]

            const { updateData, updateError } = await supabase.from('users').update({
                searchHistory: searchHistory
            }).eq('id', id).select()

            if (updateError) {
                return res.status(400).json({ success: false, message: "Failed to add search history" })
            }
            return res.status(200).json({ success: true, message: "Search history added successfully", user: data })
        }
    } catch (err) {
        console.log(err.message)
        return res.status(500).json({ success: false, message: `Error: ${err.message}` })
    }
}

export const addVehicleToWatchlist = async (req, res) => {
    const { id } = req.params
    const { vehicle } = req.body

    try {
        const { data, error } = await supabase.from('users').select('*').eq('id', id)

        if (error || data.length === 0) {
            return res.status(400).json({ success: false, message: "User Not Found" })
        }
        if (data && data.length > 0) {


            const watchList = data[0].watchList?.length > 0 ? [...data[0].watchList, vehicle] : [vehicle]

            const { updateData, updateError } = await supabase.from('users').update({
                watchList: watchList
            }).eq('id', id).select()

            if (updateError) {
                return res.status(400).json({ success: false, message: "Failed to add vehicle to watchlist" })
            }
            return res.status(200).json({ success: true, message: "Vehicle added to watchlist successfully", user: data })
        }
    } catch (err) {
        console.log(err.message)
        return res.status(500).json({ success: false, message: `Error: ${err.message}` })
    }
}

export const removeFromWatchlist = async (req, res) => {
    const { id, partId } = req.params;

    try {
        const { data, error } = await supabase.from('users').select('*').eq('id', id);

        if (error || !data || data.length === 0) {
            return res.status(400).json({ success: false, message: "User Not Found" });
        }

        const currentWatchList = data[0].watchList || [];
        const updatedWatchList = currentWatchList.filter(item => item.id !== partId);

        const { error: updateError } = await supabase.from('users').update({
            watchList: updatedWatchList
        }).eq('id', id);

        if (updateError) {
            return res.status(400).json({ success: false, message: "Failed to remove part from watchlist" });
        }

        return res.status(200).json({ success: true, message: "Part removed from watchlist successfully", user: [{ ...data[0], watchList: updatedWatchList }] });
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ success: false, message: `Error: ${err.message}` });
    }
}

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, role, address } = req.body;

    try {
        const { data, error } = await supabase.from('users').update({
            name,
            email,
            role,
            address
        }).eq('id', id).select();

        if (error) {
            return res.status(400).json({ success: false, message: "Failed to update user", error: error.message });
        }

        return res.status(200).json({ success: true, message: "User updated successfully", user: data });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    console.log(id)

    try {

        const { data: enquire, error: enquiryError } = await supabase.from('enquiry').delete().eq('user_id', id);

        if (enquiryError) {
            return res.status(400).json({ success: false, message: "Failed to delete user", error: enquiryError.message });
        }

        const { data, error } = await supabase.from('users').delete().eq('id', id);


        if (error) {
            return res.status(400).json({ success: false, message: "Failed to delete user", error: error.message });
        }

        return res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};

export const readNotifications = async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase.from('users').select('*').eq('id', id);

        if (error || !data || data.length === 0) {
            return res.status(400).json({ success: false, message: "User Not Found" });
        }

        const updatedNotifications = data[0].notifications.map(notification => {
            return {
                ...notification,
                isRead: true
            };
        });

        const { error: updateError } = await supabase.from('users').update({
            notifications: updatedNotifications
        }).eq('id', id).select();

        if (updateError) {
            return res.status(400).json({ success: false, message: "Failed to update notifications" });
        }

        return res.status(200).json({ success: true, message: "Notifications updated successfully", user: [{ ...data[0], notifications: updatedNotifications }] });
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ success: false, message: `Error: ${err.message}` });
    }
}