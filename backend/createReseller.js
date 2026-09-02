import supabase from "./utils/supabase.js";
import bcrypt from "bcrypt";

async function createReseller() {
    const email = "reseller@ngk.com";
    const password = "password";
    const name = "Demo Reseller";
    const role = "reseller";
    const address = "123 Reseller St, Test City";

    const { data: existingUser } = await supabase.from('users').select('*').eq('email', email);

    if (existingUser && existingUser.length > 0) {
        console.log("Reseller already exists!");
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase.from('users').insert({
            name,
            email,
            password: hashedPassword,
            role,
            address
        }).select();

        if (error) {
            console.error("Error creating reseller:", error);
        } else {
            console.log("Successfully created demo reseller user:", data);
        }
    } catch (err) {
        console.error(err);
    }
}

createReseller();
