import supabase from "./utils/supabase.js";
import bcrypt from "bcrypt";

async function createAdmin() {
    const email = "admin@ngk.com";
    const password = "admin"; // Default password
    const name = "System Admin";
    const role = "admin";

    console.log("Checking if admin already exists...");
    const { data: existingUser } = await supabase.from('users').select('*').eq('email', email);

    if (existingUser && existingUser.length > 0) {
        console.log("Admin user already exists. Updating password to default...");
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data, error } = await supabase.from('users').update({
            password: hashedPassword,
            role: role
        }).eq('email', email).select();

        if (error) {
            console.error("Error updating admin:", error);
        } else {
            console.log("Successfully updated admin user password to 'admin'");
        }
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase.from('users').insert({
            name,
            email,
            password: hashedPassword,
            role
        }).select();

        if (error) {
            console.error("Error creating admin:", error);
        } else {
            console.log("Successfully created admin user:", data);
        }
    } catch (err) {
        console.error(err);
    }
}

createAdmin();
