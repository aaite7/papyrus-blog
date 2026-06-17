import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 环境变量未配置。请确保 .env 文件中包含 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
