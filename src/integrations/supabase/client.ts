import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dmrlkxwpbwmzpdecsgnw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GrVvRKNeoFyX-QlBoBr8xw_Dura2nUZ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
