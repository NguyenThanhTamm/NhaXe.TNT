import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Đọc biến môi trường Supabase Cloud
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lodikilazpvdlqtwhlfd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Cờ kiểm tra tính sẵn sàng của kết nối Supabase Cloud
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('placeholder')
);

// Khởi tạo Supabase Client Singleton
// Sử dụng dummy key khi build hoặc chưa có key để không crash ứng dụng
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey || 'dummy-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Helper lấy Supabase Client
 */
export function getSupabase(): SupabaseClient {
  return supabase;
}

export default supabase;
