import { createClient } from "@supabase/supabase-js";
// import dotenv from "dotenv";

// dotenv.config();

const supabase = createClient(
    "https://bdnpzwsqonzyjoesfaki.supabase.co",
    "sb_publishable_oYEFcQKL6TMQ83hMyZTLmQ_Rv_wDlYs"
);

export default supabase;