import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bmtbohuzvkdifffdwayv.supabase.co";
export const imagePath = `${supabaseUrl}/storage/v1/object/public/images/}`;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
