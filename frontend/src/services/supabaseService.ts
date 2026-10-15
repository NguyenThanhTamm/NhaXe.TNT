// src/services/supabaseService.ts
// Tầng tương tác trực tiếp với Supabase Cloud Database
// Đảm bảo dữ liệu được đồng bộ tập trung, an toàn giữa Mobile App, Web Khách & Admin Portal

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { TripDetail, Booking, BusItem, DriverItem, UserAccount } from './bookingStore';

// =============================================================================
// HELPER MAPPER: Chuyển đổi giữa định dạng TypeScript Store và Supabase Table
// =============================================================================

function mapTripToDb(trip: TripDetail) {
  return {
    id: trip.id,
    trip_code: trip.tripCode,
    route: trip.route,
    from_city: trip.fromCity,
    from_station: trip.fromStation,
    to_city: trip.toCity,
    to_station: trip.toStation,
    departure_date: trip.departureDate,
    departure_time: trip.departureTime,
    arrival_time: trip.arrivalTime,
    duration: trip.duration,
    price: trip.price,
    bus_type: trip.busType,
    bus_type_name: trip.busTypeName,
    bus_id: trip.busId,
    plate_number: trip.plateNumber,
    driver_id: trip.driverId,
    driver_name: trip.driverName,
    driver_phone: trip.driverPhone,
    assistant_id: trip.assistantId,
    assistant_name: trip.assistantName,
    assistant_phone: trip.assistantPhone,
    status: trip.status,
    shift: trip.shift,
    pickup_points: trip.pickupPoints,
    dropoff_points: trip.dropoffPoints,
    seats: trip.seats,
    updated_at: new Date().toISOString(),
  };
}

function mapDbToTrip(row: any): TripDetail {
  return {
    id: row.id,
    tripCode: row.trip_code || row.tripCode,
    route: row.route,
    fromCity: row.from_city || row.fromCity,
    fromStation: row.from_station || row.fromStation,
    toCity: row.to_city || row.toCity,
    toStation: row.to_station || row.toStation,
    departureDate: row.departure_date || row.departureDate,
    departureTime: row.departure_time || row.departureTime,
    arrivalTime: row.arrival_time || row.arrivalTime,
    duration: row.duration,
    price: Number(row.price),
    busType: row.bus_type || row.busType,
    busTypeName: row.bus_type_name || row.busTypeName,
    busId: row.bus_id || row.busId,
    plateNumber: row.plate_number || row.plateNumber,
    driverId: row.driver_id || row.driverId,
    driverName: row.driver_name || row.driverName,
    driverPhone: row.driver_phone || row.driverPhone,
    assistantId: row.assistant_id || row.assistantId,
    assistantName: row.assistant_name || row.assistantName,
    assistantPhone: row.assistant_phone || row.assistantPhone,
    status: row.status,
    shift: row.shift,
    pickupPoints: Array.isArray(row.pickup_points) ? row.pickup_points : [],
    dropoffPoints: Array.isArray(row.dropoff_points) ? row.dropoff_points : [],
    seats: Array.isArray(row.seats) ? row.seats : [],
  };
}

function mapBookingToDb(b: Booking) {
  return {
    id: b.id,
    booking_code: b.bookingCode,
    trip_id: b.tripId,
    trip_code: b.tripCode,
    route: b.route,
    departure_time: b.departureTime,
    departure_date: b.departureDate,
    seats: b.seats,
    customer_name: b.customerName,
    customer_phone: b.customerPhone || b.phone,
    customer_email: b.customerEmail || '',
    pickup_point: b.pickupPoint,
    dropoff_point: b.dropoffPoint,
    total_amount: b.totalAmount,
    payment_method: b.paymentMethod,
    payment_status: b.paymentStatus,
    status: b.status,
    luggage_note: b.luggageNote || '',
    created_at: b.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function mapDbToBooking(row: any): Booking {
  return {
    id: row.id,
    bookingCode: row.booking_code || row.bookingCode,
    tripId: row.trip_id || row.tripId,
    tripCode: row.trip_code || row.tripCode,
    route: row.route,
    departureTime: row.departure_time || row.departureTime,
    departureDate: row.departure_date || row.departureDate,
    seats: Array.isArray(row.seats) ? row.seats : [],
    customerName: row.customer_name || row.customerName,
    customerPhone: row.customer_phone || row.phone,
    phone: row.customer_phone || row.phone,
    customerEmail: row.customer_email || row.customerEmail,
    pickupPoint: row.pickup_point || row.pickupPoint,
    dropoffPoint: row.dropoff_point || row.dropoffPoint,
    totalAmount: Number(row.total_amount || row.totalAmount),
    paymentMethod: row.payment_method || row.paymentMethod,
    paymentStatus: row.payment_status || row.paymentStatus,
    status: row.status,
    luggageNote: row.luggage_note || row.luggageNote,
    createdAt: row.created_at || row.createdAt,
  };
}

// =============================================================================
// CHUYẾN XE (TRIPS) SUPABASE API
// =============================================================================

export async function fetchTripsFromSupabase(): Promise<TripDetail[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('tnt_trips')
      .select('*')
      .order('departure_time', { ascending: true });

    if (error) {
      console.warn('⚠️ Lỗi truy vấn tnt_trips từ Supabase:', error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map(mapDbToTrip);
  } catch (err: any) {
    console.warn('⚠️ Ngoại lệ fetchTripsFromSupabase:', err.message);
    return null;
  }
}

export async function upsertTripsToSupabase(trips: TripDetail[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || trips.length === 0) return false;
  try {
    const rows = trips.map(mapTripToDb);
    const { error } = await supabase.from('tnt_trips').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn('⚠️ Lỗi upsertTripsToSupabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('⚠️ Ngoại lệ upsertTripsToSupabase:', err.message);
    return false;
  }
}

export async function upsertSingleTripToSupabase(trip: TripDetail): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const row = mapTripToDb(trip);
    const { error } = await supabase.from('tnt_trips').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('⚠️ Lỗi upsertSingleTripToSupabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('⚠️ Ngoại lệ upsertSingleTripToSupabase:', err.message);
    return false;
  }
}

// =============================================================================
// ĐƠN ĐẶT VÉ (BOOKINGS) SUPABASE API
// =============================================================================

export async function fetchBookingsFromSupabase(): Promise<Booking[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('tnt_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('⚠️ Lỗi truy vấn tnt_bookings từ Supabase:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map(mapDbToBooking);
  } catch (err: any) {
    console.warn('⚠️ Ngoại lệ fetchBookingsFromSupabase:', err.message);
    return null;
  }
}

export async function insertBookingToSupabase(booking: Booking): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const row = mapBookingToDb(booking);
    const { error } = await supabase.from('tnt_bookings').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('⚠️ Lỗi insertBookingToSupabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('⚠️ Ngoại lệ insertBookingToSupabase:', err.message);
    return false;
  }
}

export async function updateBookingInSupabase(
  bookingId: string,
  updates: Partial<Booking>
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.status) payload.status = updates.status;
    if (updates.paymentStatus) payload.payment_status = updates.paymentStatus;
    if (updates.paymentMethod) payload.payment_method = updates.paymentMethod;

    const { error } = await supabase
      .from('tnt_bookings')
      .update(payload)
      .eq('id', bookingId);

    if (error) {
      console.warn('⚠️ Lỗi updateBookingInSupabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('⚠️ Ngoại lệ updateBookingInSupabase:', err.message);
    return false;
  }
}

// =============================================================================
// XE & ĐỘI TÀI XẾ (FLEET & CREW) SUPABASE API
// =============================================================================

export async function fetchBusesFromSupabase(): Promise<BusItem[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('tnt_buses').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map((b: any) => ({
      id: b.id,
      plateNumber: b.plate_number,
      model: b.model,
      busType: b.bus_type,
      year: b.year,
      inspectionExpiry: b.inspection_expiry,
      status: b.status,
      lastMaintenance: b.last_maintenance,
      totalTrips: b.total_trips,
    }));
  } catch {
    return null;
  }
}

export async function upsertBusesToSupabase(buses: BusItem[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || buses.length === 0) return false;
  try {
    const rows = buses.map((b) => ({
      id: b.id,
      plate_number: b.plateNumber,
      model: b.model,
      bus_type: b.busType,
      year: b.year,
      inspection_expiry: b.inspectionExpiry,
      status: b.status,
      last_maintenance: b.lastMaintenance,
      total_trips: b.totalTrips,
      updated_at: new Date().toISOString(),
    }));
    await supabase.from('tnt_buses').upsert(rows, { onConflict: 'id' });
    return true;
  } catch {
    return false;
  }
}

export async function fetchDriversFromSupabase(): Promise<DriverItem[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('tnt_drivers').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      licenseClass: d.license_class,
      licenseNumber: d.license_number,
      experienceYears: d.experience_years,
      mainRoute: d.main_route,
      role: d.role,
      status: d.status,
      totalTrips: d.total_trips,
    }));
  } catch {
    return null;
  }
}

export async function upsertDriversToSupabase(drivers: DriverItem[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || drivers.length === 0) return false;
  try {
    const rows = drivers.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      license_class: d.licenseClass,
      license_number: d.licenseNumber,
      experience_years: d.experienceYears,
      main_route: d.mainRoute,
      role: d.role,
      status: d.status,
      total_trips: d.totalTrips,
      updated_at: new Date().toISOString(),
    }));
    await supabase.from('tnt_drivers').upsert(rows, { onConflict: 'id' });
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// TÀI KHOẢN NGƯỜI DÙNG (USERS) SUPABASE API
// =============================================================================

export async function fetchUsersFromSupabase(): Promise<UserAccount[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('tnt_users').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map((u: any) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      password: u.password,
      role: u.role,
      status: u.status,
      lastLogin: u.last_login,
      createdAt: u.created_at,
    }));
  } catch {
    return null;
  }
}

export async function upsertUsersToSupabase(users: UserAccount[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || users.length === 0) return false;
  try {
    const rows = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      password: u.password,
      role: u.role,
      status: u.status,
      last_login: u.lastLogin,
      created_at: u.createdAt,
      updated_at: new Date().toISOString(),
    }));
    await supabase.from('tnt_users').upsert(rows, { onConflict: 'id' });
    return true;
  } catch {
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

  const channel = supabase
    .channel('tnt_database_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tnt_bookings' },
      (payload) => {
        onChange('tnt_bookings', payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tnt_trips' },
      (payload) => {
        onChange('tnt_trips', payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tnt_buses' },
      (payload) => {
        onChange('tnt_buses', payload);
      }
    )
    .subscribe();

  return () => {
    if (supabase) {
      supabase.removeChannel(channel);
    }
  };
}
