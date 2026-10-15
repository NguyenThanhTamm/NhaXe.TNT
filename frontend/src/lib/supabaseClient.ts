import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Đọc biến môi trường Supabase Cloud
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Cờ kiểm tra tính sẵn sàng của kết nối Supabase Cloud
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('placeholder')
);

// Khởi tạo Supabase Client Singleton an toàn
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Helper lấy Supabase Client an toàn, trả về null nếu chưa cấu hình
 */
export function getSupabase(): SupabaseClient | null {
  return supabase;
}
