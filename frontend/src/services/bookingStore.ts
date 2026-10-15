// src/services/bookingStore.ts
// Tầng dữ liệu & Quản lý trạng thái dùng chung (Single Source of Truth) cho toàn bộ hệ thống
// Hỗ trợ Fleet (Xe), Crew (Tài xế), Trips (Chuyến xe & Vòng đời), Bookings (Đơn vé)
// Đồng bộ thời gian thực qua LocalStorage + CustomEvent & Storage Event reactivity
// Hỗ trợ kết nối Supabase Cloud Database & Realtime broadcast đa thiết bị

import { isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  fetchBookingsFromSupabase,
  insertBookingToSupabase,
  updateSeatsInSupabase,
  cancelBookingInSupabase,
  subscribeSupabaseRealtime,
  upsertTripsToSupabase,
  upsertBusesToSupabase,
  upsertDriversToSupabase,
  upsertUsersToSupabase,
} from './supabaseService';

export { isSupabaseConfigured, fetchBookingsFromSupabase };

export type SeatStatus = 'AVAILABLE' | 'BOOKED' | 'HOLDING' | 'LOCKED';
export type TripStatus = 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT';
export type BusStatus = 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'ON_LEAVE';
export type BusType = 'GIUONG_NAM_36' | 'LIMOUSINE_22';
export type UserRole = 'SUPER_ADMIN' | 'DISPATCHER' | 'TICKET_CLERK';
export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface UserAccount {
  id: string;
  name: string;
  username: string; // Tên đăng nhập hoặc email
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: string;
  createdAt: string;
}

export interface SeatInfo {
  id: string; // e.g. "bed_A01"
  seatCode: string; // "A01"
  floor: 1 | 2;
  row: number; // 1 -> 6
  col: number; // 1 -> 3
  status: SeatStatus;
  price: number;
  customerName?: string;
  customerPhone?: string;
  pickupPoint?: string;
  dropoffPoint?: string;
  bookingCode?: string;
  paymentMethod?: 'VNPAY' | 'CASH' | 'TRANSFER';
  paymentStatus?: 'PAID' | 'UNPAID';
  luggageNote?: string;
  bookingTime?: string;
}

export interface PickupDropPoint {
  id: string;
  name: string;
  timeOffset: string;
  address: string;
}

export interface BusItem {
  id: string;
  plateNumber: string; // "51B-888.99"
  model: string; // "Hyundai Universe Express Premium"
  busType: BusType;
  year: number;
  inspectionExpiry: string; // "15/12/2026"
  status: BusStatus;
  lastMaintenance: string;
  totalTrips: number;
}

export interface DriverItem {
  id: string;
  name: string;
  phone: string;
  licenseClass: string; // "Hạng E"
  licenseNumber: string;
  experienceYears: number;
  mainRoute: string; // "Sài Gòn - Đà Lạt"
  role: 'MAIN_DRIVER' | 'ASSISTANT';
  status: DriverStatus;
  totalTrips: number;
}

export interface TripDetail {
  id: string;
  tripCode: string;
  route: string;
  fromCity: string;
  fromStation: string;
  toCity: string;
  toStation: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  busType: BusType;
  busTypeName: string;
  busId: string;
  plateNumber: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  assistantId: string;
  assistantName: string;
  assistantPhone: string;
  status: TripStatus;
  shift: ShiftType;
  pickupPoints: PickupDropPoint[];
  dropoffPoints: PickupDropPoint[];
  seats: SeatInfo[];
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. "TNT-889102"
  tripId: string;
  tripCode: string;
  route: string;
  departureTime: string;
  departureDate: string;
  seats: string[]; // ["A01", "A02"]
  customerName: string;
  customerPhone: string;
  phone?: string;
  customerEmail?: string;
  pickupPoint: string;
  dropoffPoint: string;
  totalAmount: number;
  paymentMethod: 'VNPAY' | 'CASH' | 'TRANSFER';
  paymentStatus: 'PAID' | 'UNPAID';
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  luggageNote?: string;
  createdAt: string;
}

// STORAGE KEYS
const STORAGE_KEY_BUSES = 'TNT_BUSES_STORE_V4';
const STORAGE_KEY_DRIVERS = 'TNT_DRIVERS_STORE_V4';
export const STORAGE_KEY_TRIPS = 'TNT_TRIPS_STORE_V8';
export const STORAGE_KEY_BOOKINGS = 'TNT_BOOKINGS_STORE_V8';
export const STORAGE_KEY_USERS = 'TNT_USERS_STORE_V3';
export const STORAGE_KEY_CURRENT_USER = 'TNT_CURRENT_USER_SESSION_V3';
export const STORE_UPDATE_EVENT = 'TNT_BOOKING_STORE_UPDATED';
export const STORAGE_SYNC_EVENT = 'storage-sync';

// CẤU HÌNH PHÂN QUYỀN VAI TRÒ (RBAC METADATA)
export const ROLE_LABELS: Record<
  UserRole,
  {
    name: string;
    shortName: string;
    badgeClass: string;
    borderClass: string;
    bgClass: string;
    textClass: string;
    description: string;
  }
> = {
  SUPER_ADMIN: {
    name: 'Tổng Giám Đốc / Super Admin',
    shortName: 'Super Admin',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
    borderClass: 'border-purple-500',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-700',
    description: 'Toàn quyền quản trị hệ thống: Báo cáo tài chính, Quản lý tài khoản nhân sự, Đội xe, Chuyến xe.',
  },
  DISPATCHER: {
    name: 'Điều Hành Bến / Trưởng Ca',
    shortName: 'Điều Hành',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    borderClass: 'border-blue-500',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    description: 'Điều phối xe, gán tài xế, mở/khóa chuyến, in phôi lệnh A4, xác nhận hoàn thành chuyến.',
  },
  TICKET_CLERK: {
    name: 'Nhân Viên Bán Vé / Quầy POS',
    shortName: 'Bán Vé',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    borderClass: 'border-emerald-500',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    description: 'Bán vé tại quầy, tra cứu vé, kiểm tra chỗ trống, hỗ trợ đổi trả vé theo quy định.',
  },
};

// DỮ LIỆU TÀI KHOẢN MẪU KHỞI TẠO (USERS SEED)
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr_super_admin_01',
    name: 'Nguyễn Thanh Tâm',
    username: 'admin@tamnguyenthanh.vn',
    email: 'admin@tamnguyenthanh.vn',
    phone: '0903.123.456',
    password: 'admin123',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastLogin: 'Hôm nay, 08:30',
    createdAt: '01/01/2026',
  },
  {
    id: 'usr_dispatcher_01',
    name: 'Trần Anh Tuấn',
    username: 'dieuhanh@tamnguyenthanh.vn',
    email: 'dieuhanh@tamnguyenthanh.vn',
    phone: '0908.765.432',
    password: 'dieuhanh123',
    role: 'DISPATCHER',
    status: 'ACTIVE',
    lastLogin: 'Hôm nay, 07:15',
    createdAt: '15/01/2026',
  },
  {
    id: 'usr_clerk_01',
    name: 'Lê Thị Bích Ngọc',
    username: 'banve@tamnguyenthanh.vn',
    email: 'banve@tamnguyenthanh.vn',
    phone: '0912.345.678',
    password: 'banve123',
    role: 'TICKET_CLERK',
    status: 'ACTIVE',
    lastLogin: 'Hôm nay, 08:00',
    createdAt: '01/02/2026',
  },
];

// Helper xác định ca chạy theo giờ khởi hành
export function determineShift(timeStr: string): ShiftType {
  if (!timeStr) return 'NIGHT';
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  if (isNaN(h)) return 'NIGHT';
  if (h >= 5 && h < 12) return 'MORNING'; // 05:00 - 11:59
  if (h >= 12 && h < 18) return 'AFTERNOON'; // 12:00 - 17:59
  return 'NIGHT'; // 18:00 - 04:59
}

// Helper lấy ca hiện tại của hệ thống theo giờ thực tế máy tính
export function getCurrentShift(): ShiftType {
  if (typeof window === 'undefined') return 'MORNING';
  const now = new Date();
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'MORNING';
  if (h >= 12 && h < 18) return 'AFTERNOON';
  return 'NIGHT';
}

// Helper đối soát linh hoạt tên thành phố (Hồ Chí Minh, Sài Gòn, Đà Lạt, Nha Trang, Cần Thơ)
export function matchCity(c1: string, c2: string): boolean {
  if (!c1 || !c2) return false;
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/tp\.?\s*/g, '')
      .replace(/thành phố\s*/g, '')
      .replace(/tỉnh\s*/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const s1 = clean(c1);
  const s2 = clean(c2);
  if (s1 === s2) return true;
  if (
    (s1.includes('sai gon') || s1.includes('ho chi minh') || s1.includes('tphcm')) &&
    (s2.includes('sai gon') || s2.includes('ho chi minh') || s2.includes('tphcm'))
  ) {
    return true;
  }
  return s1.includes(s2) || s2.includes(s1);
}

// Helper sinh 36 ghế giường nằm tiêu chuẩn
export function generate36Seats(unitPrice: number): SeatInfo[] {
  const seats: SeatInfo[] = [];
  // Tầng 1: A01 -> A18
  for (let r = 1; r <= 6; r++) {
    for (let c = 1; c <= 3; c++) {
      const num = (r - 1) * 3 + c;
      const code = `A${num < 10 ? '0' + num : num}`;
      seats.push({
        id: `bed_${code}`,
        seatCode: code,
        floor: 1,
        row: r,
        col: c,
        status: 'AVAILABLE',
        price: unitPrice,
      });
    }
  }
  // Tầng 2: B01 -> B18
  for (let r = 1; r <= 6; r++) {
    for (let c = 1; c <= 3; c++) {
      const num = (r - 1) * 3 + c;
      const code = `B${num < 10 ? '0' + num : num}`;
      seats.push({
        id: `bed_${code}`,
        seatCode: code,
        floor: 2,
        row: r,
        col: c,
        status: 'AVAILABLE',
        price: unitPrice,
      });
    }
  }
  return seats;
}

// Helper sinh 22 cabin VIP Limousine
export function generate22Seats(unitPrice: number): SeatInfo[] {
  const seats: SeatInfo[] = [];
  // Tầng 1: C01 -> C11
  for (let i = 1; i <= 11; i++) {
    const code = `C${i < 10 ? '0' + i : i}`;
    seats.push({
      id: `cabin_${code}`,
      seatCode: code,
      floor: 1,
      row: Math.ceil(i / 2),
      col: i % 2 === 1 ? 1 : 3,
      status: 'AVAILABLE',
      price: unitPrice,
    });
  }
  // Tầng 2: D01 -> D11
  for (let i = 1; i <= 11; i++) {
    const code = `D${i < 10 ? '0' + i : i}`;
    seats.push({
      id: `cabin_${code}`,
      seatCode: code,
      floor: 2,
      row: Math.ceil(i / 2),
      col: i % 2 === 1 ? 1 : 3,
      status: 'AVAILABLE',
      price: unitPrice,
    });
  }
  return seats;
}

// DỮ LIỆU KHỞI TẠO ĐẦU XE (BUSES)
const INITIAL_BUSES: BusItem[] = [
  {
    id: 'bus_01',
    plateNumber: '51B-888.99',
    model: 'Hyundai Universe Express Premium (2024)',
    busType: 'GIUONG_NAM_36',
    year: 2024,
    inspectionExpiry: '15/12/2026',
    status: 'AVAILABLE',
    lastMaintenance: '01/10/2026',
    totalTrips: 184,
  },
  {
    id: 'bus_02',
    plateNumber: '51B-777.66',
    model: 'Thaco Mobihome VIP Palace (2025)',
    busType: 'LIMOUSINE_22',
    year: 2025,
    inspectionExpiry: '28/02/2027',
    status: 'AVAILABLE',
    lastMaintenance: '05/10/2026',
    totalTrips: 142,
  },
  {
    id: 'bus_03',
    plateNumber: '51B-999.11',
    model: 'Hyundai Tracomeco Noble VIP',
    busType: 'GIUONG_NAM_36',
    year: 2024,
    inspectionExpiry: '10/11/2026',
    status: 'AVAILABLE',
    lastMaintenance: '25/09/2026',
    totalTrips: 210,
  },
  {
    id: 'bus_04',
    plateNumber: '51B-555.22',
    model: 'Samco Primas Universe VIP',
    busType: 'GIUONG_NAM_36',
    year: 2023,
    inspectionExpiry: '20/01/2027',
    status: 'AVAILABLE',
    lastMaintenance: '12/10/2026',
    totalTrips: 165,
  },
  {
    id: 'bus_05',
    plateNumber: '51B-666.33',
    model: 'Tracomeco Global VIP King',
    busType: 'GIUONG_NAM_36',
    year: 2024,
    inspectionExpiry: '08/03/2027',
    status: 'AVAILABLE',
    lastMaintenance: '02/10/2026',
    totalTrips: 98,
  },
  {
    id: 'bus_06',
    plateNumber: '51B-444.88',
    model: 'Thaco Mobihome Standard (Bảo dưỡng định kỳ)',
    busType: 'GIUONG_NAM_36',
    year: 2022,
    inspectionExpiry: '05/10/2026',
    status: 'MAINTENANCE',
    lastMaintenance: '10/10/2026',
    totalTrips: 320,
  },
];

// DỮ LIỆU KHỞI TẠO TÀI XẾ & PHỤ XE (DRIVERS & CREW)
const INITIAL_DRIVERS: DriverItem[] = [
  {
    id: 'drv_01',
    name: 'Nguyễn Văn An',
    phone: '0908.123.456',
    licenseClass: 'Hạng E',
    licenseNumber: '790123847592',
    experienceYears: 12,
    mainRoute: 'Chuyên tuyến Sài Gòn ⇄ Đà Lạt',
    role: 'MAIN_DRIVER',
    status: 'AVAILABLE',
    totalTrips: 420,
  },
  {
    id: 'drv_02',
    name: 'Trần Văn Bình',
    phone: '0912.456.789',
    licenseClass: 'Hạng E',
    licenseNumber: '790483726154',
    experienceYears: 6,
    mainRoute: 'Chuyên tuyến Sài Gòn ⇄ Đà Lạt',
    role: 'ASSISTANT',
    status: 'AVAILABLE',
    totalTrips: 310,
  },
  {
    id: 'drv_03',
    name: 'Lê Hoàng Nam',
    phone: '0933.222.111',
    licenseClass: 'Hạng E',
    licenseNumber: '790592837461',
    experienceYears: 15,
    mainRoute: 'Chuyên tuyến Sài Gòn ⇄ Nha Trang',
    role: 'MAIN_DRIVER',
    status: 'AVAILABLE',
    totalTrips: 580,
  },
  {
    id: 'drv_04',
    name: 'Phạm Quốc Hùng',
    phone: '0978.555.444',
    licenseClass: 'Hạng E',
    licenseNumber: '790382910472',
    experienceYears: 8,
    mainRoute: 'Chuyên tuyến Sài Gòn ⇄ Đà Lạt',
    role: 'MAIN_DRIVER',
    status: 'AVAILABLE',
    totalTrips: 275,
  },
  {
    id: 'drv_05',
    name: 'Vũ Minh Tuấn',
    phone: '0903.888.777',
    licenseClass: 'Hạng E',
    licenseNumber: '790673829104',
    experienceYears: 5,
    mainRoute: 'Chuyên tuyến Sài Gòn ⇄ Nha Trang',
    role: 'ASSISTANT',
    status: 'AVAILABLE',
    totalTrips: 190,
  },
  {
    id: 'drv_06',
    name: 'Đỗ Gia Bảo',
    phone: '0944.666.888',
    licenseClass: 'Hạng E',
    licenseNumber: '790182746352',
    experienceYears: 10,
    mainRoute: 'Chuyên tuyến Sài Gòn ⇄ Cần Thơ',
    role: 'MAIN_DRIVER',
    status: 'AVAILABLE',
    totalTrips: 340,
  },
  {
    id: 'drv_07',
    name: 'Hoàng Văn Đức (Nghỉ phép)',
    phone: '0918.999.000',
    licenseClass: 'Hạng E',
    licenseNumber: '790928374615',
    experienceYears: 9,
    mainRoute: 'Chuyên tuyến Sài Gòn ⇄ Đà Lạt',
    role: 'MAIN_DRIVER',
    status: 'ON_LEAVE',
    totalTrips: 295,
  },
];

// DỮ LIỆU ĐIỂM ĐÓN / TRẢ
const STANDARD_PICKUP_POINTS_SG: PickupDropPoint[] = [
  { id: 'pk1', name: 'Bến xe Miền Đông Mới (Quầy vé Tam Nguyen Thanh)', timeOffset: '+0 phút', address: '501 Hoàng Hữu Nam, TP. Thủ Đức' },
  { id: 'pk2', name: 'VP 286 Lê Hồng Phong (Quận 5)', timeOffset: '+30 phút', address: '286 Lê Hồng Phong, P.4, Quận 5' },
  { id: 'pk3', name: 'Ngã tư Hàng Xanh (Cây xăng Comeco)', timeOffset: '+50 phút', address: '178 Điện Biên Phủ, Bình Thạnh' },
  { id: 'pk4', name: 'Ngã tư Thủ Đức / Suối Tiên', timeOffset: '+80 phút', address: 'Xa lộ Hà Nội, TP. Thủ Đức' },
];

const STANDARD_DROPOFF_POINTS_DL: PickupDropPoint[] = [
  { id: 'dp1', name: 'Bến xe Liên Tỉnh Đà Lạt (Số 01 Tô Hiến Thành)', timeOffset: '+6h30', address: '01 Tô Hiến Thành, P.3, TP. Đà Lạt' },
  { id: 'dp2', name: 'Bưu điện Trung tâm TP Đà Lạt', timeOffset: '+6h50', address: 'Khu Hoà Bình, TP. Đà Lạt' },
  { id: 'dp3', name: 'Trung chuyển tận nơi nội thành Đà Lạt (Bán kính 7km)', timeOffset: '+7h15', address: 'Giao khách tận khách sạn/homestay' },
];

const STANDARD_DROPOFF_POINTS_NT: PickupDropPoint[] = [
  { id: 'dp_nt1', name: 'Bến xe Phía Nam Nha Trang', timeOffset: '+8h00', address: 'Đường 23/10, TP. Nha Trang' },
  { id: 'dp_nt2', name: 'VP 120 Hoàng Hoa Thám, Nha Trang', timeOffset: '+8h30', address: '120 Hoàng Hoa Thám, P. Lộc Thọ, TP. Nha Trang' },
];

const STANDARD_DROPOFF_POINTS_CT: PickupDropPoint[] = [
  { id: 'dp_ct1', name: 'Cầu Cần Thơ (Đầu Ninh Kiều)', timeOffset: '+3h15', address: 'Đại lộ Hòa Bình, Ninh Kiều, Cần Thơ' },
  { id: 'dp_ct2', name: 'Bến xe Trung tâm Cần Thơ', timeOffset: '+3h30', address: 'Khu đô thị Nam Cần Thơ, Cái Răng, Cần Thơ' },
];

// TẠO DANH SÁCH CHUYẾN XE MẪU HOÀN CHỈNH CHO TOÀN BỘ CÁC TUYẾN
function createSeedTrips(): TripDetail[] {
  const t1Seats = generate36Seats(310000);
  t1Seats[0] = { ...t1Seats[0], status: 'BOOKED', customerName: 'Trần Văn Cường', customerPhone: '0912.888.999', pickupPoint: 'VP 286 Lê Hồng Phong (Quận 5)', dropoffPoint: 'Trung chuyển tận nơi nội thành Đà Lạt', bookingCode: 'TNT-781920', paymentStatus: 'PAID', paymentMethod: 'VNPAY', bookingTime: '15/10 07:15' };
  t1Seats[1] = { ...t1Seats[1], status: 'BOOKED', customerName: 'Trần Văn Cường', customerPhone: '0912.888.999', pickupPoint: 'VP 286 Lê Hồng Phong (Quận 5)', dropoffPoint: 'Trung chuyển tận nơi nội thành Đà Lạt', bookingCode: 'TNT-781920', paymentStatus: 'PAID', paymentMethod: 'VNPAY', bookingTime: '15/10 07:15' };
  t1Seats[4] = { ...t1Seats[4], status: 'BOOKED', customerName: 'Nguyễn Thị Bích Mai', customerPhone: '0988.333.222', pickupPoint: 'Ngã tư Hàng Xanh', dropoffPoint: 'Bến xe Liên Tỉnh Đà Lạt', bookingCode: 'TNT-654321', paymentStatus: 'UNPAID', paymentMethod: 'CASH', bookingTime: '15/10 07:30' };

  const t2Seats = generate22Seats(390000);
  t2Seats[0] = { ...t2Seats[0], status: 'BOOKED', customerName: 'Hoàng Minh Quân', customerPhone: '0903.111.444', pickupPoint: 'VP 286 Lê Hồng Phong (Quận 5)', dropoffPoint: 'Bưu điện Trung tâm TP Đà Lạt', bookingCode: 'TNT-991234', paymentStatus: 'PAID', paymentMethod: 'VNPAY', bookingTime: '15/10 08:00' };

  const t3Seats = generate36Seats(310000);
  t3Seats[2] = { ...t3Seats[2], status: 'BOOKED', customerName: 'Lê Thuỳ Dung', customerPhone: '0937.666.999', pickupPoint: 'Bến xe Miền Đông Mới', dropoffPoint: 'Bến xe Liên Tỉnh Đà Lạt', bookingCode: 'TNT-443322', paymentStatus: 'PAID', paymentMethod: 'TRANSFER', bookingTime: '15/10 08:30' };

  const t4Seats = generate36Seats(310000);
  const t5Seats = generate36Seats(350000);
  t5Seats[0] = { ...t5Seats[0], status: 'BOOKED', customerName: 'Vũ Hải Đăng', customerPhone: '0977.123.987', pickupPoint: 'VP 286 Lê Hồng Phong (Quận 5)', dropoffPoint: 'Bến xe Phía Nam Nha Trang', bookingCode: 'TNT-112233', paymentStatus: 'PAID', paymentMethod: 'VNPAY', bookingTime: '15/10 08:45' };

  const t6Seats = generate22Seats(420000);
  const t7Seats = generate36Seats(180000);
  const t8Seats = generate22Seats(240000);
  const t9Seats = generate22Seats(240000);

  const tPastSeats = generate36Seats(310000);
  tPastSeats[0] = { ...tPastSeats[0], status: 'BOOKED', customerName: 'Bùi Đức Anh', customerPhone: '0909.111.222', pickupPoint: 'Bến xe Miền Đông Mới', dropoffPoint: 'Bến xe Đà Lạt', bookingCode: 'TNT-001122', paymentStatus: 'PAID' };

  return [
    // 1. Tuyến Sài Gòn -> Đà Lạt
    {
      id: 'trip_01',
      tripCode: 'TNT-SG-DL-0700',
      route: 'Sài Gòn ➔ Đà Lạt',
      fromCity: 'Sài Gòn',
      fromStation: 'Bến xe Miền Tây (Quầy vé TNT)',
      toCity: 'Đà Lạt',
      toStation: 'Bến xe Liên Tỉnh Đà Lạt (01 Tô Hiến Thành)',
      departureDate: '15/10/2026',
      departureTime: '07:00',
      arrivalTime: '14:00',
      duration: '7 giờ 00 phút',
      price: 310000,
      busType: 'GIUONG_NAM_36',
      busTypeName: 'Giường Nằm VIP 36 Chỗ',
      busId: 'bus_01',
      plateNumber: '51B-888.99',
      driverId: 'drv_01',
      driverName: 'Nguyễn Văn An',
      driverPhone: '0908.123.456',
      assistantId: 'drv_02',
      assistantName: 'Trần Văn Bình',
      assistantPhone: '0912.456.789',
      status: 'SCHEDULED',
      shift: 'MORNING',
      pickupPoints: STANDARD_PICKUP_POINTS_SG,
      dropoffPoints: STANDARD_DROPOFF_POINTS_DL,
      seats: t1Seats,
    },
    {
      id: 'trip_02',
      tripCode: 'TNT-SG-DL-1130',
      route: 'Sài Gòn ➔ Đà Lạt',
      fromCity: 'Sài Gòn',
      fromStation: 'Bến xe Miền Tây (Quầy vé TNT)',
      toCity: 'Đà Lạt',
      toStation: 'Bến xe Liên Tỉnh Đà Lạt',
      departureDate: '15/10/2026',
      departureTime: '11:30',
      arrivalTime: '18:30',
      duration: '7 giờ 00 phút',
      price: 390000,
      busType: 'LIMOUSINE_22',
      busTypeName: 'Limousine Phòng Cung Điện 22 VIP',
      busId: 'bus_02',
      plateNumber: '51B-777.66',
      driverId: 'drv_04',
      driverName: 'Phạm Quốc Hùng',
      driverPhone: '0978.555.444',
      assistantId: 'drv_05',
      assistantName: 'Vũ Minh Tuấn',
      assistantPhone: '0903.888.777',
      status: 'SCHEDULED',
      shift: 'MORNING',
      pickupPoints: STANDARD_PICKUP_POINTS_SG,
      dropoffPoints: STANDARD_DROPOFF_POINTS_DL,
      seats: t2Seats,
    },
    {
      id: 'trip_03',
      tripCode: 'TNT-SG-DL-2030',
      route: 'Sài Gòn ➔ Đà Lạt',
      fromCity: 'Sài Gòn',
      fromStation: 'Bến xe Miền Tây (Quầy vé TNT)',
      toCity: 'Đà Lạt',
      toStation: 'Bến xe Liên Tỉnh Đà Lạt',
      departureDate: '15/10/2026',
      departureTime: '20:30',
      arrivalTime: '04:00',
      duration: '7 giờ 30 phút',
      price: 310000,
      busType: 'GIUONG_NAM_36',
      busTypeName: 'Giường Nằm VIP 36 Chỗ',
      busId: 'bus_03',
      plateNumber: '51B-999.11',
      driverId: 'drv_06',
      driverName: 'Đỗ Gia Bảo',
      driverPhone: '0944.666.888',
      assistantId: 'drv_02',
      assistantName: 'Trần Văn Bình',
      assistantPhone: '0912.456.789',
      status: 'SCHEDULED',
      shift: 'NIGHT',
      pickupPoints: STANDARD_PICKUP_POINTS_SG,
      dropoffPoints: STANDARD_DROPOFF_POINTS_DL,
      seats: t3Seats,
    },
    {
      id: 'trip_04',
      tripCode: 'TNT-SG-DL-2200',
      route: 'Sài Gòn ➔ Đà Lạt',
      fromCity: 'Sài Gòn',
      fromStation: 'Bến xe Miền Tây (Quầy vé TNT)',
      toCity: 'Đà Lạt',
      toStation: 'Bến xe Liên Tỉnh Đà Lạt',
      departureDate: '15/10/2026',
      departureTime: '22:00',
      arrivalTime: '05:30',
      duration: '7 giờ 30 phút',
      price: 310000,
      busType: 'GIUONG_NAM_36',
      busTypeName: 'Giường Nằm VIP 36 Chỗ',
      busId: 'bus_04',
      plateNumber: '51B-555.22',
      driverId: 'drv_01',
      driverName: 'Nguyễn Văn An',
      driverPhone: '0908.123.456',
      assistantId: 'drv_05',
      assistantName: 'Vũ Minh Tuấn',
      assistantPhone: '0903.888.777',
      status: 'SCHEDULED',
      shift: 'NIGHT',
      pickupPoints: STANDARD_PICKUP_POINTS_SG,
      dropoffPoints: STANDARD_DROPOFF_POINTS_DL,
      seats: t4Seats,
    },

    // 2. Tuyến Sài Gòn -> Nha Trang
    {
      id: 'trip_05',
      tripCode: 'TNT-SG-NT-0800',
      route: 'Sài Gòn ➔ Nha Trang',
      fromCity: 'Sài Gòn',
      fromStation: 'Bến xe Miền Tây (Quầy vé TNT)',
      toCity: 'Nha Trang',
      toStation: 'Bến xe Phía Nam Nha Trang',
      departureDate: '15/10/2026',
      departureTime: '08:00',
      arrivalTime: '16:00',
      duration: '8 giờ 00 phút',
      price: 350000,
      busType: 'GIUONG_NAM_36',
      busTypeName: 'Giường Nằm Tiêu Chuẩn 36 Chỗ',
      busId: 'bus_05',
      plateNumber: '51B-666.33',
      driverId: 'drv_03',
      driverName: 'Lê Hoàng Nam',
      driverPhone: '0933.222.111',
      assistantId: 'drv_02',
      assistantName: 'Trần Văn Bình',
      assistantPhone: '0912.456.789',
      status: 'SCHEDULED',
      shift: 'MORNING',
      pickupPoints: STANDARD_PICKUP_POINTS_SG,
      dropoffPoints: STANDARD_DROPOFF_POINTS_NT,
      seats: t5Seats,
    },
    {
      id: 'trip_06',
      tripCode: 'TNT-SG-NT-2100',
      route: 'Sài Gòn ➔ Nha Trang',
      fromCity: 'Sài Gòn',
      fromStation: 'Bến xe Miền Tây (Quầy vé TNT)',
      toCity: 'Nha Trang',
      toStation: 'Bến xe Phía Nam Nha Trang',
      departureDate: '15/10/2026',
      departureTime: '21:00',
      arrivalTime: '05:00',
      duration: '8 giờ 00 phút',
      price: 420000,
      busType: 'LIMOUSINE_22',
      busTypeName: 'Limousine VIP 22 Cabin Riêng Tư',
      busId: 'bus_02',
      plateNumber: '51B-777.66',
      driverId: 'drv_04',
      driverName: 'Phạm Quốc Hùng',
      driverPhone: '0978.555.444',
      assistantId: 'drv_05',
      assistantName: 'Vũ Minh Tuấn',
      assistantPhone: '0903.888.777',
      status: 'SCHEDULED',
      shift: 'NIGHT',
      pickupPoints: STANDARD_PICKUP_POINTS_SG,
      dropoffPoints: STANDARD_DROPOFF_POINTS_NT,
      seats: t6Seats,
    },

    // 3. Tuyến Sài Gòn -> Cần Thơ
    {
      id: 'trip_07',
      tripCode: 'TNT-SG-CT-0700',
      route: 'Sài Gòn ➔ Cần Thơ',
      fromCity: 'Sài Gòn',
      fromStation: 'Bến xe Miền Tây (Quầy vé TNT)',
      toCity: 'Cần Thơ',
      toStation: 'Bến xe Trung tâm Cần Thơ',
      departureDate: '15/10/2026',
      departureTime: '07:00',
      arrivalTime: '10:30',
      duration: '3 giờ 30 phút',
      price: 180000,
      busType: 'GIUONG_NAM_36',
      busTypeName: 'Giường Nằm Tiêu Chuẩn 36 Chỗ',
      busId: 'bus_01',
      plateNumber: '51B-888.99',
      driverId: 'drv_01',
      driverName: 'Nguyễn Văn An',
      driverPhone: '0908.123.456',
      assistantId: 'drv_02',
      assistantName: 'Trần Văn Bình',
      assistantPhone: '0912.456.789',
      status: 'SCHEDULED',
      shift: 'MORNING',
      pickupPoints: STANDARD_PICKUP_POINTS_SG,
      dropoffPoints: STANDARD_DROPOFF_POINTS_CT,
      seats: t7Seats,
    },
    {
      id: 'trip_08',
      tripCode: 'TNT-SG-CT-1000',
      route: 'Sài Gòn ➔ Cần Thơ',
      fromCity: 'Sài Gòn',
      fromStation: 'Bến xe Miền Tây (Quầy vé TNT)',
      toCity: 'Cần Thơ',
      toStation: 'Bến xe Trung tâm Cần Thơ',
      departureDate: '15/10/2026',
      departureTime: '10:00',
      arrivalTime: '13:30',
      duration: '3 giờ 30 phút',
      price: 240000,
      busType: 'LIMOUSINE_22',
      busTypeName: 'Limousine VIP 22 Cabin Riêng Tư',
      busId: 'bus_02',
      plateNumber: '51B-777.66',
      driverId: 'drv_06',
      driverName: 'Đỗ Gia Bảo',
      driverPhone: '0944.666.888',
      assistantId: 'drv_05',
      assistantName: 'Vũ Minh Tuấn',
      assistantPhone: '0903.888.777',
      status: 'SCHEDULED',
      shift: 'MORNING',
      pickupPoints: STANDARD_PICKUP_POINTS_SG,
      dropoffPoints: STANDARD_DROPOFF_POINTS_CT,
      seats: t8Seats,
    },
    {
      id: 'trip_09',
      tripCode: 'TNT-SG-CT-1900',
      route: 'Sài Gòn ➔ Cần Thơ',
      fromCity: 'Sài Gòn',
      fromStation: 'Bến xe Miền Tây (Quầy vé TNT)',
      toCity: 'Cần Thơ',
      toStation: 'Bến xe Trung tâm Cần Thơ',
      departureDate: '15/10/2026',
      departureTime: '19:00',
      arrivalTime: '22:30',
      duration: '3 giờ 30 phút',
      price: 240000,
      busType: 'LIMOUSINE_22',
      busTypeName: 'Limousine VIP 22 Cabin Riêng Tư',
      busId: 'bus_03',
      plateNumber: '51B-999.11',
      driverId: 'drv_04',
      driverName: 'Phạm Quốc Hùng',
      driverPhone: '0978.555.444',
      assistantId: 'drv_02',
      assistantName: 'Trần Văn Bình',
      assistantPhone: '0912.456.789',
      status: 'SCHEDULED',
      shift: 'NIGHT',
      pickupPoints: STANDARD_PICKUP_POINTS_SG,
      dropoffPoints: STANDARD_DROPOFF_POINTS_CT,
      seats: t9Seats,
    },

    // Chuyến đã hoàn thành
    {
      id: 'trip_past_01',
      tripCode: 'TNT-SG-DL-0530-COMPLETED',
      route: 'Sài Gòn ➔ Đà Lạt',
      fromCity: 'Sài Gòn',
      fromStation: 'Bến xe Miền Tây',
      toCity: 'Đà Lạt',
      toStation: 'Bến xe Liên Tỉnh Đà Lạt',
      departureDate: '14/10/2026',
      departureTime: '05:30',
      arrivalTime: '12:30',
      duration: '7 giờ 00 phút',
      price: 310000,
      busType: 'GIUONG_NAM_36',
      busTypeName: 'Giường Nằm VIP 36 Chỗ',
      busId: 'bus_01',
      plateNumber: '51B-888.99',
      driverId: 'drv_01',
      driverName: 'Nguyễn Văn An',
      driverPhone: '0908.123.456',
      assistantId: 'drv_02',
      assistantName: 'Trần Văn Bình',
      assistantPhone: '0912.456.789',
      status: 'COMPLETED',
      shift: 'MORNING',
      pickupPoints: STANDARD_PICKUP_POINTS_SG,
      dropoffPoints: STANDARD_DROPOFF_POINTS_DL,
      seats: tPastSeats,
    },
  ];
}

// KHỞI TẠO ĐƠN ĐẶT VÉ MẪU
function createSeedBookings(): Booking[] {
  return [
    {
      id: 'bk_001',
      bookingCode: 'TNT-781920',
      tripId: 'trip_01',
      tripCode: 'TNT-SG-DL-0700',
      route: 'Sài Gòn ➔ Đà Lạt',
      departureTime: '07:00',
      departureDate: '15/10/2026',
      seats: ['A01', 'A02'],
      customerName: 'Trần Văn Cường',
      customerPhone: '0912.888.999',
      phone: '0912.888.999',
      customerEmail: 'cuong.tran@gmail.com',
      pickupPoint: 'VP 286 Lê Hồng Phong (Quận 5)',
      dropoffPoint: 'Trung chuyển tận nơi nội thành Đà Lạt',
      totalAmount: 620000,
      paymentMethod: 'VNPAY',
      paymentStatus: 'PAID',
      status: 'PAID',
      luggageNote: '2 vali trung bình',
      createdAt: '14/10/2026 10:15:30',
    },
    {
      id: 'bk_002',
      bookingCode: 'TNT-654321',
      tripId: 'trip_01',
      tripCode: 'TNT-SG-DL-0700',
      route: 'Sài Gòn ➔ Đà Lạt',
      departureTime: '07:00',
      departureDate: '15/10/2026',
      seats: ['A05'],
      customerName: 'Nguyễn Thị Bích Mai',
      customerPhone: '0988.333.222',
      phone: '0988.333.222',
      customerEmail: 'bichmai@gmail.com',
      pickupPoint: 'Ngã tư Hàng Xanh (Cây xăng Comeco)',
      dropoffPoint: 'Bến xe Liên Tỉnh Đà Lạt (01 Tô Hiến Thành)',
      totalAmount: 310000,
      paymentMethod: 'CASH',
      paymentStatus: 'UNPAID',
      status: 'PENDING',
      luggageNote: 'Gửi kèm 1 thùng sầu riêng nhỏ',
      createdAt: '14/10/2026 11:20:12',
    },
    {
      id: 'bk_003',
      bookingCode: 'TNT-991234',
      tripId: 'trip_02',
      tripCode: 'TNT-SG-DL-1130',
      route: 'Sài Gòn ➔ Đà Lạt',
      departureTime: '11:30',
      departureDate: '15/10/2026',
      seats: ['C01'],
      customerName: 'Hoàng Minh Quân',
      customerPhone: '0903.111.444',
      phone: '0903.111.444',
      pickupPoint: 'VP 286 Lê Hồng Phong (Quận 5)',
      dropoffPoint: 'Khách sạn Colline Đà Lạt',
      totalAmount: 390000,
      paymentMethod: 'VNPAY',
      paymentStatus: 'PAID',
      status: 'PAID',
      createdAt: '14/10/2026 13:00:45',
    },
    {
      id: 'bk_004',
      bookingCode: 'TNT-443322',
      tripId: 'trip_03',
      tripCode: 'TNT-SG-DL-1430',
      route: 'Sài Gòn ➔ Đà Lạt',
      departureTime: '14:30',
      departureDate: '15/10/2026',
      seats: ['A03'],
      customerName: 'Lê Thuỳ Dung',
      customerPhone: '0937.666.999',
      phone: '0937.666.999',
      pickupPoint: 'Bến xe Miền Đông Mới (Quầy vé Tam Nguyen Thanh)',
      dropoffPoint: 'Bến xe Liên Tỉnh Đà Lạt (01 Tô Hiến Thành)',
      totalAmount: 310000,
      paymentMethod: 'TRANSFER',
      paymentStatus: 'PAID',
      status: 'PAID',
      createdAt: '14/10/2026 15:45:10',
    },
    {
      id: 'bk_005',
      bookingCode: 'TNT-112233',
      tripId: 'trip_05',
      tripCode: 'TNT-SG-NT-2100',
      route: 'Sài Gòn ➔ Nha Trang',
      departureTime: '21:00',
      departureDate: '15/10/2026',
      seats: ['A01'],
      customerName: 'Vũ Hải Đăng',
      customerPhone: '0977.123.987',
      phone: '0977.123.987',
      pickupPoint: 'VP 286 Lê Hồng Phong (Quận 5)',
      dropoffPoint: 'Bến xe Phía Nam Nha Trang',
      totalAmount: 340000,
      paymentMethod: 'VNPAY',
      paymentStatus: 'PAID',
      status: 'PAID',
      createdAt: '14/10/2026 16:30:00',
    },
  ];
}

// BROADCAST SYNC EVENT
function notifyStoreUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT));
    window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
    localStorage.setItem('TNT_STORAGE_SYNC_TIMESTAMP', Date.now().toString());
  }
}

// ==========================================
// 1. MODULE FLEET (QUẢN LÝ ĐẦU XE)
// ==========================================
export function getBuses(): BusItem[] {
  if (typeof window === 'undefined') return INITIAL_BUSES;
  const raw = localStorage.getItem(STORAGE_KEY_BUSES);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_BUSES, JSON.stringify(INITIAL_BUSES));
    return INITIAL_BUSES;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_BUSES;
  }
}

export function saveBuses(buses: BusItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_BUSES, JSON.stringify(buses));
  notifyStoreUpdate();
  if (isSupabaseConfigured) {
    upsertBusesToSupabase(buses).catch((err) => console.warn('Supabase saveBuses:', err));
  }
}

export function getAvailableBuses(): BusItem[] {
  return getBuses().filter((b) => b.status === 'AVAILABLE');
}

export function addBus(bus: Omit<BusItem, 'id' | 'totalTrips'>): BusItem {
  const buses = getBuses();
  const newBus: BusItem = {
    ...bus,
    id: `bus_${Date.now()}`,
    totalTrips: 0,
  };
  buses.unshift(newBus);
  saveBuses(buses);
  return newBus;
}

export function updateBus(id: string, updates: Partial<BusItem>): BusItem | null {
  const buses = getBuses();
  const idx = buses.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  buses[idx] = { ...buses[idx], ...updates };
  saveBuses(buses);
  return buses[idx];
}

export function deleteBus(id: string): boolean {
  const buses = getBuses();
  const filtered = buses.filter((b) => b.id !== id);
  if (filtered.length !== buses.length) {
    saveBuses(filtered);
    return true;
  }
  return false;
}

export function setBusStatus(id: string, status: BusStatus) {
  updateBus(id, { status });
}

// ==========================================
// 2. MODULE DRIVERS & CREW (TÀI XẾ & PHỤ XE)
// ==========================================
export function getDrivers(): DriverItem[] {
  if (typeof window === 'undefined') return INITIAL_DRIVERS;
  const raw = localStorage.getItem(STORAGE_KEY_DRIVERS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_DRIVERS, JSON.stringify(INITIAL_DRIVERS));
    return INITIAL_DRIVERS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_DRIVERS;
  }
}

export function saveDrivers(drivers: DriverItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_DRIVERS, JSON.stringify(drivers));
  notifyStoreUpdate();
  if (isSupabaseConfigured) {
    upsertDriversToSupabase(drivers).catch((err) => console.warn('Supabase saveDrivers:', err));
  }
}

export function getAvailableDrivers(role?: 'MAIN_DRIVER' | 'ASSISTANT'): DriverItem[] {
  return getDrivers().filter((d) => {
    if (d.status !== 'AVAILABLE') return false;
    if (role && d.role !== role) return false;
    return true;
  });
}

export function addDriver(driver: Omit<DriverItem, 'id' | 'totalTrips'>): DriverItem {
  const drivers = getDrivers();
  const newDriver: DriverItem = {
    ...driver,
    id: `drv_${Date.now()}`,
    totalTrips: 0,
  };
  drivers.unshift(newDriver);
  saveDrivers(drivers);
  return newDriver;
}

export function updateDriver(id: string, updates: Partial<DriverItem>): DriverItem | null {
  const drivers = getDrivers();
  const idx = drivers.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  drivers[idx] = { ...drivers[idx], ...updates };
  saveDrivers(drivers);
  return drivers[idx];
}

export function deleteDriver(id: string): boolean {
  const drivers = getDrivers();
  const filtered = drivers.filter((d) => d.id !== id);
  if (filtered.length !== drivers.length) {
    saveDrivers(filtered);
    return true;
  }
  return false;
}

export function setDriverStatus(id: string, status: DriverStatus) {
  updateDriver(id, { status });
}

// ==========================================
// 3. MODULE TRIPS & LIFECYCLE (CHUYẾN XE & VÒNG ĐỜI)
// ==========================================
export function getTrips(options?: { includeCompleted?: boolean }): TripDetail[] {
  if (typeof window === 'undefined') {
    const list = createSeedTrips();
    return options?.includeCompleted ? list : list.filter((t) => t.status !== 'COMPLETED');
  }

  const raw = localStorage.getItem(STORAGE_KEY_TRIPS);
  let trips: TripDetail[] = [];
  if (!raw) {
    trips = createSeedTrips();
    localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(trips));
  } else {
    try {
      trips = JSON.parse(raw);
    } catch {
      trips = createSeedTrips();
    }
  }

  // Tự động gán shift nếu chưa có
  trips = trips.map((t) => ({
    ...t,
    shift: t.shift || determineShift(t.departureTime),
  }));

  if (options?.includeCompleted) {
    return trips;
  }
  return trips.filter((t) => t.status === 'SCHEDULED' || t.status === 'RUNNING');
}

export function saveTrips(trips: TripDetail[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(trips));
  notifyStoreUpdate();
  if (isSupabaseConfigured) {
    upsertTripsToSupabase(trips).catch((err) => console.warn('Supabase saveTrips:', err));
  }
}

export function getCompletedTrips(): TripDetail[] {
  const all = getTrips({ includeCompleted: true });
  return all.filter((t) => t.status === 'COMPLETED');
}

export function getTripById(tripIdOrCode: string): TripDetail | undefined {
  const trips = getTrips({ includeCompleted: true });
  return trips.find((t) => t.id === tripIdOrCode || t.tripCode === tripIdOrCode);
}

// TẠO CHUYẾN MỚI
export interface CreateTripParams {
  route: string;
  fromCity: string;
  fromStation: string;
  toCity: string;
  toStation: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  busId: string;
  driverId: string;
  assistantId: string;
}

export function createTrip(params: CreateTripParams): TripDetail {
  const trips = getTrips({ includeCompleted: true });
  const buses = getBuses();
  const drivers = getDrivers();

  const selectedBus = buses.find((b) => b.id === params.busId);
  const busPlate = selectedBus ? selectedBus.plateNumber : '51B-888.99';
  const busType = selectedBus ? selectedBus.busType : 'GIUONG_NAM_36';
  const busTypeName = busType === 'LIMOUSINE_22' ? 'Limousine Phòng Cung Điện 22 VIP' : 'Giường Nằm VIP 36 Chỗ';

  const selectedDriver = drivers.find((d) => d.id === params.driverId);
  const driverName = selectedDriver ? selectedDriver.name : 'Tài xế TNT';
  const driverPhone = selectedDriver ? selectedDriver.phone : '0908.123.456';

  const selectedAssistant = drivers.find((d) => d.id === params.assistantId);
  const assistantName = selectedAssistant ? selectedAssistant.name : 'Phụ xe TNT';
  const assistantPhone = selectedAssistant ? selectedAssistant.phone : '0912.456.789';

  // Sinh mã chuyến
  const routePrefix = params.route.includes('Nha Trang') ? 'TNT-SG-NT' : 'TNT-SG-DL';
  const timeSuffix = params.departureTime.replace(':', '');
  const tripCode = `${routePrefix}-${timeSuffix}`;

  // Sinh sơ đồ ghế trống theo loại xe
  const seats = busType === 'LIMOUSINE_22' ? generate22Seats(params.price) : generate36Seats(params.price);
  const shift = determineShift(params.departureTime);

  const newTrip: TripDetail = {
    id: `trip_${Date.now()}`,
    tripCode,
    route: params.route,
    fromCity: params.fromCity,
    fromStation: params.fromStation,
    toCity: params.toCity,
    toStation: params.toStation,
    departureDate: params.departureDate,
    departureTime: params.departureTime,
    arrivalTime: params.arrivalTime,
    duration: params.duration || '7 giờ 00 phút',
    price: params.price,
    busType,
    busTypeName,
    busId: params.busId,
    plateNumber: busPlate,
    driverId: params.driverId,
    driverName,
    driverPhone,
    assistantId: params.assistantId,
    assistantName,
    assistantPhone,
    status: 'SCHEDULED',
    shift,
    pickupPoints: STANDARD_PICKUP_POINTS_SG,
    dropoffPoints: params.route.includes('Nha Trang') ? STANDARD_DROPOFF_POINTS_NT : STANDARD_DROPOFF_POINTS_DL,
    seats,
  };

  trips.unshift(newTrip);
  saveTrips(trips);

  // Chuyển trạng thái xe và tài xế thành bận nếu cần, hoặc gán lịch
  return newTrip;
}

// BẮT ĐẦU XUẤT BẾN (SCHEDULED -> RUNNING)
export function startTrip(tripId: string): TripDetail | null {
  const trips = getTrips({ includeCompleted: true });
  const trip = trips.find((t) => t.id === tripId || t.tripCode === tripId);
  if (!trip) return null;

  trip.status = 'RUNNING';
  saveTrips(trips);

  // Đánh dấu Xe và Tài xế là ON_TRIP
  if (trip.busId) setBusStatus(trip.busId, 'ON_TRIP');
  if (trip.driverId) setDriverStatus(trip.driverId, 'ON_TRIP');
  if (trip.assistantId) setDriverStatus(trip.assistantId, 'ON_TRIP');

  return trip;
}

// HOÀN THÀNH CHUYẾN (RUNNING / SCHEDULED -> COMPLETED)
// QUAN TRỌNG: Ẩn khỏi sơ đồ điều hành, GIẢI PHÓNG XE VÀ TÀI XẾ VỀ SẴN SÀNG
export function completeTrip(tripId: string): TripDetail | null {
  const trips = getTrips({ includeCompleted: true });
  const trip = trips.find((t) => t.id === tripId || t.tripCode === tripId);
  if (!trip) return null;

  trip.status = 'COMPLETED';
  saveTrips(trips);

  // GIẢI PHÓNG XE: Chuyển lại về AVAILABLE & tăng số chuyến
  if (trip.busId) {
    const buses = getBuses();
    const bIdx = buses.findIndex((b) => b.id === trip.busId);
    if (bIdx !== -1) {
      buses[bIdx].status = 'AVAILABLE';
      buses[bIdx].totalTrips = (buses[bIdx].totalTrips || 0) + 1;
      saveBuses(buses);
    }
  }

  // GIẢI PHÓNG TÀI XẾ: Chuyển lại về AVAILABLE & tăng số chuyến
  const drivers = getDrivers();
  let updatedDrivers = false;
  if (trip.driverId) {
    const dIdx = drivers.findIndex((d) => d.id === trip.driverId);
    if (dIdx !== -1) {
      drivers[dIdx].status = 'AVAILABLE';
      drivers[dIdx].totalTrips = (drivers[dIdx].totalTrips || 0) + 1;
      updatedDrivers = true;
    }
  }
  if (trip.assistantId) {
    const aIdx = drivers.findIndex((d) => d.id === trip.assistantId);
    if (aIdx !== -1) {
      drivers[aIdx].status = 'AVAILABLE';
      drivers[aIdx].totalTrips = (drivers[aIdx].totalTrips || 0) + 1;
      updatedDrivers = true;
    }
  }
  if (updatedDrivers) {
    saveDrivers(drivers);
  }

  notifyStoreUpdate();
  return trip;
}

// HỦY CHUYẾN
export function cancelTrip(tripId: string): TripDetail | null {
  const trips = getTrips({ includeCompleted: true });
  const trip = trips.find((t) => t.id === tripId || t.tripCode === tripId);
  if (!trip) return null;

  trip.status = 'CANCELLED';
  saveTrips(trips);

  // Giải phóng xe và tài xế
  if (trip.busId) setBusStatus(trip.busId, 'AVAILABLE');
  if (trip.driverId) setDriverStatus(trip.driverId, 'AVAILABLE');
  if (trip.assistantId) setDriverStatus(trip.assistantId, 'AVAILABLE');

  return trip;
}

// ==========================================
// 4. MODULE BOOKINGS & SEATS (ĐẶT VÉ & GHẾ)
// ==========================================
export function getBookings(): Booking[] {
  if (typeof window === 'undefined') return createSeedBookings();
  const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
  let list: Booking[] = [];
  if (!raw) {
    list = createSeedBookings();
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(list));
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = createSeedBookings();
    }
  }

  // Tự động query Supabase Cloud bảng `bookings` khi chạy trên Client
  if (isSupabaseConfigured && typeof window !== 'undefined') {
    fetchBookingsFromSupabase()
      .then((cloudBookings) => {
        if (cloudBookings && cloudBookings.length > 0) {
          const currentRaw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
          if (JSON.stringify(cloudBookings) !== currentRaw) {
            console.log(`📥 [bookingStore] Nhận được ${cloudBookings.length} vé từ Supabase Cloud. Cập nhật state...`);
            localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(cloudBookings));
            notifyStoreUpdate();
          }
        }
      })
      .catch((err) => {
        console.error('❌ [bookingStore] Lỗi fetchBookingsFromSupabase trong getBookings():', err);
      });
  }

  return list;
}

export function saveBookings(bookings: Booking[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
  notifyStoreUpdate();
}

export interface BookSeatsParams {
  tripId: string;
  seatCodes: string[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupPoint: string;
  dropoffPoint?: string;
  dropPoint?: string;
  paymentMethod?: 'VNPAY' | 'CASH' | 'TRANSFER' | string;
  totalAmount?: number;
  totalPrice?: number;
  departureDate?: string;
  luggageNote?: string;
}

export type CreateBookingParams = BookSeatsParams;

export function getSeatsByTrip(tripIdOrCode: string): SeatInfo[] {
  const trip = getTripById(tripIdOrCode);
  return trip ? trip.seats : [];
}

export function bookSeats(params: BookSeatsParams): { success: boolean; bookingCode: string; message: string; booking?: Booking } {
  const trips = getTrips({ includeCompleted: true });
  let tripIndex = trips.findIndex((t) => t.id === params.tripId || t.tripCode === params.tripId);

  // Fallback 1: Tìm theo id/code tương tự
  if (tripIndex === -1 && params.tripId) {
    const cleanId = params.tripId.toLowerCase();
    tripIndex = trips.findIndex(
      (t) =>
        t.id.toLowerCase().includes(cleanId) ||
        cleanId.includes(t.id.toLowerCase()) ||
        t.tripCode.toLowerCase().includes(cleanId) ||
        cleanId.includes(t.tripCode.toLowerCase())
    );
  }

  // Fallback 2: Nếu không thấy, lấy chuyến xe đầu tiên đang mở
  if (tripIndex === -1 && trips.length > 0) {
    tripIndex = 0;
  }

  if (tripIndex === -1) {
    return { success: false, bookingCode: '', message: 'Không tìm thấy chuyến xe tương ứng!' };
  }

  const trip = trips[tripIndex];

  // Kiểm tra ghế có bị trùng không
  const alreadyBooked = params.seatCodes.filter((code) => {
    const s = trip.seats.find((st) => st.seatCode === code);
    return s && s.status === 'BOOKED';
  });

  if (alreadyBooked.length > 0) {
    return {
      success: false,
      bookingCode: '',
      message: `Ghế ${alreadyBooked.join(', ')} vừa có người khác đặt. Vui lòng chọn ghế khác!`,
    };
  }

  // Sinh mã vé ngẫu nhiên
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const bookingCode = `TNT-${randNum}`;
  const dropPointFinal = params.dropoffPoint || params.dropPoint || '';
  const totalAmount = params.totalPrice ?? params.totalAmount ?? (params.seatCodes.length * trip.price);
  const paymentMethodFinal: 'VNPAY' | 'CASH' | 'TRANSFER' = (params.paymentMethod as any) || 'VNPAY';
  const now = new Date();
  const timeString = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Cập nhật trạng thái từng ghế
  trip.seats = trip.seats.map((seat) => {
    if (params.seatCodes.includes(seat.seatCode)) {
      return {
        ...seat,
        status: 'BOOKED',
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        pickupPoint: params.pickupPoint,
        dropoffPoint: dropPointFinal,
        bookingCode,
        paymentMethod: paymentMethodFinal,
        paymentStatus: paymentMethodFinal === 'VNPAY' ? 'PAID' : 'UNPAID',
        luggageNote: params.luggageNote,
        bookingTime: timeString,
      };
    }
    return seat;
  });

  // Lưu lại trips
  saveTrips(trips);

  // Tạo bản ghi đơn vé Booking mới
  const newBooking: Booking = {
    id: `bk_${Date.now()}`,
    bookingCode,
    tripId: trip.id,
    tripCode: trip.tripCode,
    route: trip.route,
    departureTime: trip.departureTime,
    departureDate: params.departureDate || trip.departureDate,
    seats: params.seatCodes,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    phone: params.customerPhone,
    customerEmail: params.customerEmail,
    pickupPoint: params.pickupPoint,
    dropoffPoint: dropPointFinal,
    totalAmount,
    paymentMethod: paymentMethodFinal,
    paymentStatus: paymentMethodFinal === 'VNPAY' ? 'PAID' : 'UNPAID',
    status: paymentMethodFinal === 'VNPAY' ? 'PAID' : 'PENDING',
    luggageNote: params.luggageNote,
    createdAt: timeString,
  };

  const currentBookings = getBookings();
  currentBookings.unshift(newBooking);
  saveBookings(currentBookings);

  // Đồng bộ tức thời lên Supabase Cloud Database (bảng bookings & seats)
  if (isSupabaseConfigured) {
    console.log('🚀 [bookingStore] bookSeats kích hoạt insertBookingToSupabase cho mã vé:', newBooking.bookingCode);
    insertBookingToSupabase(newBooking)
      .then((res) => {
        if (res.success) {
          console.log('✅ [bookingStore] Đã lưu vé và cập nhật ghế vào Supabase thành công:', res.data);
        } else {
          console.error('❌ [bookingStore] Lỗi lưu vé vào Supabase:', res.error);
        }
      })
      .catch((err) => console.error('❌ [bookingStore] Ngoại lệ khi gọi insertBookingToSupabase:', err));
  }

  // Bật tín hiệu đồng bộ tức thì cho các tab khác
  if (typeof window !== 'undefined') {
    localStorage.setItem('TNT_LAST_BOOKING_TIMESTAMP', Date.now().toString());
  }

  notifyStoreUpdate();

  return {
    success: true,
    bookingCode,
    message: 'Đặt vé thành công!',
    booking: newBooking,
  };
}

export function createBooking(params: BookSeatsParams) {
  return bookSeats(params);
}

export async function createBookingAsync(params: BookSeatsParams) {
  const result = bookSeats(params);
  if (result.success && result.booking && isSupabaseConfigured) {
    console.log('🚀 [bookingStore] createBookingAsync đang đợi Supabase ghi nhận vé:', result.booking.bookingCode);
    const insertRes = await insertBookingToSupabase(result.booking);
    if (!insertRes.success) {
      console.error('❌ [bookingStore] Lỗi createBookingAsync khi ghi Supabase:', insertRes.error);
    } else {
      console.log('✅ [bookingStore] createBookingAsync hoàn tất ghi Supabase:', insertRes.data);
    }
  }
  return result;
}

// HỦY VÉ & GIẢI PHÓNG GHẾ
export function cancelBooking(bookingIdOrCode: string): { success: boolean; message: string } {
  const bookings = getBookings();
  const bookingIdx = bookings.findIndex((b) => b.id === bookingIdOrCode || b.bookingCode === bookingIdOrCode);

  if (bookingIdx === -1) {
    return { success: false, message: 'Không tìm thấy vé cần hủy!' };
  }

  const booking = bookings[bookingIdx];
  booking.status = 'CANCELLED';
  saveBookings(bookings);

  // Nhả ghế lại cho chuyến xe đó
  const trips = getTrips({ includeCompleted: true });
  const trip = trips.find((t) => t.id === booking.tripId || t.tripCode === booking.tripCode);

  if (trip) {
    trip.seats = trip.seats.map((seat) => {
      if (booking.seats.includes(seat.seatCode)) {
        return {
          ...seat,
          status: 'AVAILABLE',
          customerName: undefined,
          customerPhone: undefined,
          pickupPoint: undefined,
          dropoffPoint: undefined,
          bookingCode: undefined,
          paymentMethod: undefined,
          paymentStatus: undefined,
          bookingTime: undefined,
        };
      }
      return seat;
    });
    saveTrips(trips);
  }

  // Đồng bộ hủy vé lên Supabase
  if (isSupabaseConfigured) {
    console.log('🚀 [bookingStore] cancelBooking kích hoạt cancelBookingInSupabase cho mã vé:', booking.bookingCode);
    cancelBookingInSupabase(booking.bookingCode, booking.tripId, booking.seats)
      .catch((err) => console.error('❌ [bookingStore] Lỗi khi cancelBookingInSupabase:', err));
  }

  return { success: true, message: `Đã hủy vé ${booking.bookingCode} và giải phóng ghế thành công!` };
}

// KHÓA GHẾ KHẨN CẤP
export function lockSeat(tripId: string, seatCode: string, reason: string = 'Khóa kỹ thuật'): boolean {
  const trips = getTrips({ includeCompleted: true });
  const trip = trips.find((t) => t.id === tripId || t.tripCode === tripId);
  if (!trip) return false;

  const seat = trip.seats.find((s) => s.seatCode === seatCode);
  if (!seat) return false;

  seat.status = 'LOCKED';
  seat.luggageNote = reason;
  saveTrips(trips);
  return true;
}

// MỞ KHÓA GHẾ
export function unlockSeat(tripId: string, seatCode: string): boolean {
  const trips = getTrips({ includeCompleted: true });
  const trip = trips.find((t) => t.id === tripId || t.tripCode === tripId);
  if (!trip) return false;

  const seat = trip.seats.find((s) => s.seatCode === seatCode);
  if (!seat) return false;

  seat.status = 'AVAILABLE';
  seat.luggageNote = undefined;
  saveTrips(trips);
  return true;
}

// ==========================================
// 5. MODULE USERS & AUTHENTICATION (RBAC)
// ==========================================
export function getUsers(): UserAccount[] {
  if (typeof window === 'undefined') return INITIAL_USERS;
  const raw = localStorage.getItem(STORAGE_KEY_USERS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return parsed;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveUsers(users: UserAccount[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  notifyStoreUpdate();
  if (isSupabaseConfigured) {
    upsertUsersToSupabase(users).catch((err) => console.warn('Supabase saveUsers:', err));
  }
}

export function getCurrentUser(): UserAccount | null {
  if (typeof window === 'undefined') return INITIAL_USERS[0]; // fallback during SSR
  const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserAccount | null) {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  } else {
    // Lưu vào session (không để lộ password nếu có)
    const { password, ...safeUser } = user;
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(safeUser));
  }
  notifyStoreUpdate();
}

export function loginUser(
  identifier: string,
  pass: string
): { success: boolean; message: string; user?: UserAccount } {
  const users = getUsers();
  const cleanId = identifier.trim().toLowerCase();

  const found = users.find(
    (u) =>
      u.username.toLowerCase() === cleanId ||
      u.email.toLowerCase() === cleanId
  );

  if (!found) {
    return {
      success: false,
      message: 'Tài khoản không tồn tại trong hệ thống Nhà xe!',
    };
  }

  if (found.status === 'LOCKED') {
    return {
      success: false,
      message: 'Tài khoản này đã bị KHÓA! Vui lòng liên hệ Giám đốc để được hỗ trợ.',
    };
  }

  if (found.password && found.password !== pass) {
    return {
      success: false,
      message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.',
    };
  }

  // Cập nhật lastLogin
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const dateStr = `Hôm nay, ${hours}:${minutes}`;

  found.lastLogin = dateStr;
  saveUsers(users);

  setCurrentUser(found);

  return {
    success: true,
    message: `Đăng nhập thành công! Chào mừng ${found.name}`,
    user: found,
  };
}

export function logoutUser() {
  setCurrentUser(null);
}

export function createUser(params: {
  name: string;
  username: string;
  email?: string;
  phone: string;
  password?: string;
  role: UserRole;
  status?: UserStatus;
}): { success: boolean; message: string; user?: UserAccount } {
  const users = getUsers();
  const cleanUser = params.username.trim().toLowerCase();
  const cleanEmail = (params.email || params.username).trim().toLowerCase();

  if (users.some((u) => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'Tên đăng nhập hoặc Email này đã tồn tại trong hệ thống!' };
  }

  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();

  const newUser: UserAccount = {
    id: `usr_${Date.now()}`,
    name: params.name.trim(),
    username: params.username.trim(),
    email: params.email?.trim() || params.username.trim(),
    phone: params.phone.trim(),
    password: params.password || '123456',
    role: params.role,
    status: params.status || 'ACTIVE',
    lastLogin: 'Chưa đăng nhập',
    createdAt: `${day}/${month}/${year}`,
  };

  users.unshift(newUser);
  saveUsers(users);

  return { success: true, message: `Thêm nhân viên "${newUser.name}" thành công!`, user: newUser };
}

export function updateUser(
  id: string,
  updates: Partial<UserAccount>
): { success: boolean; message: string; user?: UserAccount } {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return { success: false, message: 'Không tìm thấy tài khoản nhân viên!' };
  }

  // Kiểm tra trùng tên đăng nhập nếu có cập nhật
  if (updates.username && updates.username.toLowerCase() !== users[idx].username.toLowerCase()) {
    const exists = users.some(
      (u) => u.id !== id && u.username.toLowerCase() === updates.username!.toLowerCase()
    );
    if (exists) {
      return { success: false, message: 'Tên đăng nhập mới bị trùng với nhân viên khác!' };
    }
  }

  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);

  // Nếu tài khoản đang đăng nhập được cập nhật, đồng bộ session
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === id) {
    setCurrentUser(users[idx]);
  }

  return { success: true, message: 'Cập nhật tài khoản thành công!', user: users[idx] };
}

export function deleteUser(id: string): { success: boolean; message: string } {
  const users = getUsers();
  const userToDelete = users.find((u) => u.id === id);
  if (!userToDelete) {
    return { success: false, message: 'Không tìm thấy tài khoản cần xóa!' };
  }

  // Không cho phép xóa Super Admin chính
  if (userToDelete.username === 'admin@tamnguyenthanh.vn') {
    return { success: false, message: 'Không thể xóa tài khoản Quản Trị Viên Gốc của hệ thống!' };
  }

  const filtered = users.filter((u) => u.id !== id);
  saveUsers(filtered);

  return { success: true, message: `Đã xóa tài khoản "${userToDelete.name}" thành công!` };
}

export function hasRole(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

// SUBSCRIPTION HELPER
export function subscribeBookingStore(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = () => callback();
  const handleStorageEvent = (e: StorageEvent) => {
    callback();
  };

  window.addEventListener(STORE_UPDATE_EVENT, handleCustomEvent);
  window.addEventListener(STORAGE_SYNC_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(STORE_UPDATE_EVENT, handleCustomEvent);
    window.removeEventListener(STORAGE_SYNC_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

// ==========================================
// 6. CLOUD SYNC ENGINE (SUPABASE RECONCILIATION)
// Tự động kết nối, đồng bộ và đăng ký Realtime
// ==========================================
let isCloudSyncInitialized = false;

export async function syncWithSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured || typeof window === 'undefined') return false;

  try {
    console.log('🔄 [bookingStore] Đang đồng bộ hóa danh sách vé từ Supabase Cloud...');
    const cloudBookings = await fetchBookingsFromSupabase();
    if (cloudBookings && cloudBookings.length > 0) {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(cloudBookings));
      console.log(`✅ [bookingStore] Đã đồng bộ ${cloudBookings.length} vé từ Cloud vào LocalStorage.`);
      notifyStoreUpdate();
      return true;
    }
    return false;
  } catch (err: any) {
    console.error('❌ [bookingStore] Lỗi khi đồng bộ Supabase Cloud:', err.message);
    return false;
  }
}

export function initCloudSync() {
  if (typeof window === 'undefined' || isCloudSyncInitialized || !isSupabaseConfigured) return;
  isCloudSyncInitialized = true;

  console.log('⚡ [bookingStore] Khởi chạy Cloud Sync Engine & Supabase Realtime Listener...');
  syncWithSupabase();

  // Đăng ký Supabase Realtime Channel
  subscribeSupabaseRealtime((table, payload) => {
    console.log(`⚡ [Supabase Realtime] Nhận sự kiện từ bảng [${table}]:`, payload.eventType || payload);
    if (table === 'bookings' || table === 'seats') {
      fetchBookingsFromSupabase().then((latest) => {
        if (latest && latest.length > 0) {
          localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(latest));
          notifyStoreUpdate();
        }
      });
    }
  });
}

// Helper kiểm tra trạng thái đám mây
export function isCloudConnected(): boolean {
  return isSupabaseConfigured;
}

// Khởi chạy nền khi chạy trên client
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initCloudSync();
  }, 300);
}

