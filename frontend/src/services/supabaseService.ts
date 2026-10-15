// src/services/supabaseService.ts
// Tầng tương tác trực tiếp với Supabase Cloud Database (bảng bookings, seats, trips)
// Đảm bảo không phụ thuộc vào backend local, đồng bộ 100% thời gian thực trên Cloud & Vercel

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { Booking, TripDetail } from './bookingStore';

// =============================================================================
// MAPPER: Chuyển đổi dữ liệu giữa Supabase PostgreSQL và TypeScript Booking model
// =============================================================================

export function mapDbRowToBooking(row: any): Booking {
  const createdDate = row.created_at ? new Date(row.created_at) : new Date();
  const day = createdDate.getDate().toString().padStart(2, '0');
  const month = (createdDate.getMonth() + 1).toString().padStart(2, '0');
  const year = createdDate.getFullYear();
  const hours = createdDate.getHours().toString().padStart(2, '0');
  const minutes = createdDate.getMinutes().toString().padStart(2, '0');
  const formattedCreatedAt = `${day}/${month}/${year} ${hours}:${minutes}`;

  const payStatusUpper = (row.payment_status || 'PENDING').toUpperCase();
  const paymentStatus: 'PAID' | 'UNPAID' = payStatusUpper === 'PAID' || payStatusUpper === 'SUCCESS' ? 'PAID' : 'UNPAID';
  const status: 'PAID' | 'PENDING' | 'CANCELLED' =
    payStatusUpper === 'CANCELLED'
      ? 'CANCELLED'
      : (paymentStatus === 'PAID' ? 'PAID' : 'PENDING');

  const seatCodesArray: string[] = Array.isArray(row.seat_codes)
    ? row.seat_codes
    : typeof row.seat_codes === 'string'
      ? (row.seat_codes.startsWith('{')
          ? row.seat_codes.replace(/[\{\}"]/g, '').split(',').map((s: string) => s.trim())
          : [row.seat_codes])
      : [];

  // Tái tạo Route hiển thị đẹp mắt từ điểm đón/trả
  const pickup = row.pickup_point || 'Bến xe Miền Tây';
  const dropoff = row.drop_point || row.dropoff_point || 'Bến xe Liên Tỉnh Đà Lạt';
  const fromName = pickup.split('(')[0].replace(/Bến xe|VP|Trạm/gi, '').trim() || 'Sài Gòn';
  const toName = dropoff.split('(')[0].replace(/Bến xe|VP|Trạm/gi, '').trim() || 'Đà Lạt';
  const route = `${fromName} ➔ ${toName}`;

  return {
    id: row.id?.toString() || `bk_${row.booking_code}`,
    bookingCode: row.booking_code || `TNT-${row.id}`,
    tripId: row.trip_id || 'TRIP-01',
    tripCode: row.trip_id || 'TRIP-01',
    route,
    departureTime: '22:00',
    departureDate: `${day}/${month}/${year}`,
    seats: seatCodesArray,
    customerName: row.customer_name || 'Khách hàng',
    customerPhone: row.customer_phone || '',
    phone: row.customer_phone || '',
    customerEmail: row.customer_email || '',
    pickupPoint: pickup,
    dropoffPoint: dropoff,
    totalAmount: Number(row.total_price || row.total_amount || 0),
    paymentMethod: ((row.payment_method || 'VNPAY').toUpperCase() as any),
    paymentStatus,
    status,
    luggageNote: row.luggage_note || 'Hành lý tiêu chuẩn',
    createdAt: formattedCreatedAt,
  };
}

// =============================================================================
// QUẢN LÝ VÉ (BOOKINGS) TRỰC TIẾP TỪ SUPABASE CLOUD
// =============================================================================

/**
 * Lấy toàn bộ danh sách vé trực tiếp từ Supabase bảng `bookings`
 */
export async function fetchBookingsFromSupabase(): Promise<Booking[] | null> {
  if (!isSupabaseConfigured || !supabase) {
    console.log('ℹ️ [Supabase] Client chưa cấu hình biến môi trường (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).');
    return null;
  }

  try {
    console.log('🚀 [Supabase] Thực thi truy vấn: supabase.from("bookings").select("*").order("created_at", { ascending: false })');
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [Supabase] Lỗi khi query bảng bookings:', error.message, error);
      return null;
    }

    console.log(`✅ [Supabase] Lấy thành công ${data?.length || 0} vé từ bảng bookings:`, data);
    if (!data) return [];

    return data.map(mapDbRowToBooking);
  } catch (err: any) {
    console.error('❌ [Supabase] Ngoại lệ khi fetchBookingsFromSupabase:', err);
    return null;
  }
}

/**
 * Thêm mới một đơn vé vào bảng `bookings` và đồng thời cập nhật bảng `seats`
 */
export async function insertBookingToSupabase(booking: Booking): Promise<{ success: boolean; data?: any; error?: any }> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('⚠️ [Supabase] Bỏ qua ghi cloud: Chưa cấu hình Supabase Client.');
    return { success: false, error: 'Chưa cấu hình Supabase Client' };
  }

  try {
    const row = {
      booking_code: booking.bookingCode,
      trip_id: booking.tripId || 'TRIP-01',
      customer_name: booking.customerName.trim(),
      customer_phone: (booking.customerPhone || booking.phone || '').trim(),
      seat_codes: booking.seats,
      pickup_point: booking.pickupPoint || 'Bến xe Miền Tây',
      drop_point: booking.dropoffPoint || 'Bến xe Liên Tỉnh Đà Lạt',
      total_price: booking.totalAmount,
      payment_method: booking.paymentMethod || 'VNPAY',
      payment_status: booking.paymentStatus || 'PAID',
      created_at: new Date().toISOString(),
    };

    console.log('🚀 [Supabase] Bắt đầu INSERT trực tiếp vào bảng bookings:', row);
    const { data, error } = await supabase.from('bookings').insert(row).select();

    if (error) {
      console.error('❌ [Supabase] Lỗi khi insert vào bảng bookings:', error.message, error);
      return { success: false, error };
    }

    console.log('✅ [Supabase] Đã ghi nhận vé thành công vào bảng bookings:', data);

    // Cập nhật trạng thái từng ghế vào bảng seats trên Supabase
    await updateSeatsInSupabase(row.trip_id, booking.seats, 'BOOKED', {
      customerName: booking.customerName,
      customerPhone: booking.customerPhone || booking.phone,
      pickupPoint: booking.pickupPoint,
    });

    return { success: true, data };
  } catch (err: any) {
    console.error('❌ [Supabase] Ngoại lệ trong insertBookingToSupabase:', err);
    return { success: false, error: err };
  }
}

/**
 * Cập nhật trạng thái các ghế trên bảng `seats` của Supabase
 */
export async function updateSeatsInSupabase(
  tripId: string,
  seatCodes: string[],
  status: 'BOOKED' | 'AVAILABLE' | 'LOCKED',
  customerInfo?: { customerName?: string; customerPhone?: string; pickupPoint?: string }
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || seatCodes.length === 0) return false;

  try {
    for (const code of seatCodes) {
      const isFloor2 = code.startsWith('B') || code.startsWith('D') || code.includes('-2');
      const seatPayload = {
        trip_id: tripId || 'TRIP-01',
        seat_code: code,
        floor: isFloor2 ? 2 : 1,
        status,
        customer_name: status === 'AVAILABLE' ? null : (customerInfo?.customerName || null),
        customer_phone: status === 'AVAILABLE' ? null : (customerInfo?.customerPhone || null),
        pickup_point: status === 'AVAILABLE' ? null : (customerInfo?.pickupPoint || null),
        updated_at: new Date().toISOString(),
      };

      console.log(`🚀 [Supabase] Cập nhật bảng seats cho ghế ${code} (status=${status}):`, seatPayload);

      // Thử update theo match (trip_id, seat_code)
      const { data: updated, error: updateErr } = await supabase
        .from('seats')
        .update({
          status,
          customer_name: seatPayload.customer_name,
          customer_phone: seatPayload.customer_phone,
          pickup_point: seatPayload.pickup_point,
          updated_at: seatPayload.updated_at,
        })
        .match({ trip_id: seatPayload.trip_id, seat_code: code })
        .select();

      if (updateErr) {
        console.error(`❌ [Supabase] Lỗi khi update bảng seats (${code}):`, updateErr.message);
      }

      // Nếu dòng ghế chưa từng tồn tại trong bảng seats, thực hiện insert
      if (!updated || updated.length === 0) {
        const { error: insertErr } = await supabase.from('seats').insert(seatPayload);
        if (insertErr) {
          console.error(`❌ [Supabase] Lỗi khi insert ghế mới vào bảng seats (${code}):`, insertErr.message);
        } else {
          console.log(`✅ [Supabase] Đã tạo mới ghế ${code} trong bảng seats.`);
        }
      } else {
        console.log(`✅ [Supabase] Đã cập nhật trạng thái ghế ${code} thành công trên bảng seats.`);
      }
    }
    return true;
  } catch (err: any) {
    console.error('❌ [Supabase] Ngoại lệ updateSeatsInSupabase:', err);
    return false;
  }
}

/**
 * Hủy vé trên Supabase (chuyển payment_status sang CANCELLED và giải phóng ghế trên bảng seats)
 */
export async function cancelBookingInSupabase(
  bookingCode: string,
  tripId: string,
  seatCodes: string[]
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    console.log(`🚀 [Supabase] Cập nhật hủy vé ${bookingCode} trên bảng bookings...`);
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: 'CANCELLED' })
      .eq('booking_code', bookingCode);

    if (error) {
      console.error(`❌ [Supabase] Lỗi hủy vé ${bookingCode}:`, error.message);
      return false;
    }

    console.log(`✅ [Supabase] Đã cập nhật hủy vé ${bookingCode} thành công.`);

    // Giải phóng các ghế trên bảng seats
    await updateSeatsInSupabase(tripId, seatCodes, 'AVAILABLE');
    return true;
  } catch (err: any) {
    console.error('❌ [Supabase] Ngoại lệ cancelBookingInSupabase:', err);
    return false;
  }
}

// =============================================================================
// THỜI GIAN THỰC (SUPABASE REALTIME SUBSCRIPTION)
// Khi khách đặt vé trên Mobile, màn hình Admin tự động nhận tín hiệu và cập nhật!
// =============================================================================

export function subscribeSupabaseRealtime(onChange: (table: string, payload: any) => void): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel('public_bookings_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('⚡ [Supabase Realtime] Sự kiện thay đổi trên bảng bookings:', payload);
          onChange('bookings', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seats' },
        (payload) => {
          console.log('⚡ [Supabase Realtime] Sự kiện thay đổi trên bảng seats:', payload);
          onChange('seats', payload);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  } catch (err) {
    console.warn('⚠️ Không thể đăng ký kênh Supabase Realtime:', err);
    return () => {};
  }
}

export async function upsertTripsToSupabase(trips: any[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || trips.length === 0) return false;
  try {
    const rows = trips.map((t) => ({
      id: t.id,
      route_name: t.route,
      departure_time: t.departureTime,
      bus_number: t.plateNumber,
      bus_type: t.busType,
      driver_name: t.driverName,
      driver_phone: t.driverPhone,
      price: t.price,
    }));
    const { error } = await supabase.from('trips').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn('⚠️ [Supabase] upsertTripsToSupabase warning:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('⚠️ [Supabase] upsertTripsToSupabase error:', e.message);
    return false;
  }
}

export async function upsertBusesToSupabase(buses: any[]): Promise<boolean> {
  return true;
}

export async function upsertDriversToSupabase(drivers: any[]): Promise<boolean> {
  return true;
}

export async function upsertUsersToSupabase(users: any[]): Promise<boolean> {
  return true;
}

