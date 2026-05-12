import supabase from "../utils/supabase.js"
import bcrypt from 'bcrypt';
import dotenv from "dotenv";

dotenv.config();

export const registerUser = async (req, res) => {
    const { role, name, email, password } = req.body;

    console.log("Data", req.body);

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

    console.log("Data", req.body);

    try {

        const { data, error } = await supabase.from('users').select('*').eq('email', email);
        if (error) {
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
        return res.status(400).json({ success: false, message: "User not found" })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Something went wrong" })
    }
}