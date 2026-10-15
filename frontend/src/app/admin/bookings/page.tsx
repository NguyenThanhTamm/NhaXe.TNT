'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Clock,
  Ticket,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  QrCode,
  DollarSign,
  ChevronRight,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export interface BookingRecord {
  id: string;
  bookingCode: string;
  customerName: string;
  phone: string;
  email: string;
  route: string;
  tripCode: string;
  departureTime: string;
  departureDate: string;
  pickupPoint: string;
  dropoffPoint: string;
  seats: string[];
  totalAmount: number;
  paymentMethod: 'VNPAY' | 'CASH' | 'TRANSFER';
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  createdAt: string;
}

import {
  getBookings,
  cancelBooking,
  subscribeBookingStore,
  fetchBookingsFromSupabase,
  isSupabaseConfigured,
  Booking,
} from '@/services/bookingStore';

export default function AdminBookingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'CANCELLED'>('ALL');
  const [routeFilter, setRouteFilter] = useState<string>('ALL');

  // Lấy dữ liệu trực tiếp từ Single Source of Truth Store và tự động đồng bộ thời gian thực
  const [bookings, setBookings] = useState<Booking[]>(() => getBookings());

  useEffect(() => {
    let isMounted = true;
    const refreshData = async () => {
      if (isSupabaseConfigured) {
        console.log('🔄 [Admin Bookings] Đang tải danh sách vé trực tiếp từ Supabase...');
        const cloudBookings = await fetchBookingsFromSupabase();
        if (isMounted && cloudBookings) {
          console.log(`✅ [Admin Bookings] Đã cập nhật ${cloudBookings.length} vé từ Supabase vào bảng.`);
          setBookings(cloudBookings);
          return;
        }
      }
      if (isMounted) {
        setBookings(getBookings());
      }
    };

    // 1. Initial load
    refreshData();

    // 2. Lắng nghe CustomEvent & Storage Event
    const unsubscribe = subscribeBookingStore(() => {
      refreshData();
    });

    // 3. Cơ chế Polling tự động mỗi 3 giây
    const interval = setInterval(refreshData, 3000);

    // 4. Lắng nghe khi Admin chuyển tab trình duyệt quay lại
    window.addEventListener('focus', refreshData);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener('focus', refreshData);
    };
  }, []);

  // Modal xem vé điện tử / In vé
  const [selectedTicketForPrint, setSelectedTicketForPrint] = useState<Booking | null>(null);

  // Modal đổi giường
  const [selectedTicketForChangeSeat, setSelectedTicketForChangeSeat] = useState<Booking | null>(null);
  const [targetNewSeat, setTargetNewSeat] = useState<string>('');

  // Modal hủy vé
  const [selectedTicketForCancel, setSelectedTicketForCancel] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Khách bận đột xuất muốn đổi lịch');

  // Bộ lọc dữ liệu tìm kiếm
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerPhone.includes(searchTerm) ||
        b.seats.join(',').toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
      const matchRoute = routeFilter === 'ALL' || b.route.includes(routeFilter);

      return matchSearch && matchStatus && matchRoute;
    });
  }, [bookings, searchTerm, statusFilter, routeFilter]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Xử lý Hủy vé & Hoàn tiền (Gọi Store để tự động trả ghế về trống)
  const handleConfirmCancel = () => {
    if (!selectedTicketForCancel) return;
    const ok = cancelBooking(selectedTicketForCancel.id);
    if (ok) {
      alert(
        `Đã hủy thành công vé ${selectedTicketForCancel.bookingCode}. Ghế trên chuyến ${selectedTicketForCancel.tripCode} đã được nhả lại thành TRỐNG!`,
      );
    }
    setSelectedTicketForCancel(null);
  };

  // Xử lý Đổi giường
  const handleConfirmChangeSeat = () => {
    if (!selectedTicketForChangeSeat || !targetNewSeat.trim()) {
      alert('Vui lòng chọn hoặc nhập mã giường mới hợp lệ!');
      return;
    }
    setBookings((prev) =>
      prev.map((b) =>
        b.id === selectedTicketForChangeSeat.id
          ? { ...b, seats: [targetNewSeat.toUpperCase()] }
          : b,
      ),
    );
    alert(
      `Đã chuyển đổi giường cho khách ${selectedTicketForChangeSeat.customerName} sang giường mới [${targetNewSeat.toUpperCase()}].`,
    );
    setSelectedTicketForChangeSeat(null);
    setTargetNewSeat('');
  };

  // Xuất file Excel / In danh sách
  const handleExportPassengerList = () => {
    alert(
      'Hệ thống đang trích xuất danh sách hành khách đi xe chuyến này ra file Excel (.xlsx) chuẩn kiểm tra tài xế...',
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. HEADER TRANG & NÚT XUẤT DANH SÁCH */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Vé & Danh Sách Hành Khách
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Tra cứu, in phôi vé, đổi giường và kiểm soát danh sách khách đi xe
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleExportPassengerList}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Xuất File Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-black shadow-md shadow-green-900/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>In Bảng Kiểm Khách</span>
          </button>
        </div>
      </div>

      {/* 2. THANH TÌM KIẾM TỨC THÌ & BỘ LỌC */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Input search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã vé (TNT-xxxx), Số điện thoại, Tên khách hoặc số giường (A01)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-[#2E7D32] transition-colors"
          />
        </div>

        {/* Lọc Trạng thái */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-bold text-slate-400">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 focus:outline-hidden focus:border-[#2E7D32]"
          >
            <option value="ALL">Tất cả ({bookings.length})</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="PENDING">Đang giữ chỗ (Pending)</option>
            <option value="CANCELLED">Đã hủy (Cancelled)</option>
          </select>
        </div>

        {/* Lọc Tuyến */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-bold text-slate-400">Tuyến:</span>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 focus:outline-hidden focus:border-[#2E7D32]"
          >
            <option value="ALL">Tất cả tuyến</option>
            <option value="Đà Lạt">Đà Lạt</option>
            <option value="Nha Trang">Nha Trang</option>
            <option value="Phan Thiết">Phan Thiết</option>
          </select>
        </div>
      </div>

      {/* 3A. DANH SÁCH VÉ DẠNG THẺ TRÊN MOBILE (md:hidden) */}
      <div className="md:hidden space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            Không tìm thấy vé xe nào phù hợp với bộ lọc tra cứu.
          </div>
        ) : (
          filteredBookings.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-black text-sm text-slate-900 block">
                    {b.bookingCode}
                  </span>
                  <span className="text-[10px] text-slate-400">{b.createdAt}</span>
                </div>

                <div>
                  {b.status === 'PAID' && (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Đã thanh toán</span>
                    </span>
                  )}
                  {b.status === 'PENDING' && (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      <Clock className="w-3 h-3" />
                      <span>Chờ giữ chỗ</span>
                    </span>
                  )}
                  {b.status === 'CANCELLED' && (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                      <XCircle className="w-3 h-3" />
                      <span>Đã hủy</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <div className="font-bold text-slate-900 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.customerName}</span>
                </div>
                <div className="font-mono font-semibold text-slate-600 flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{b.phone}</span>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-800">{b.route}</div>
                <div className="text-[11px] text-[#1B5E20] font-semibold mt-0.5">
                  {b.departureTime} • {b.departureDate} ({b.tripCode})
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5" title={b.pickupPoint}>
                  Đón: {b.pickupPoint}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 text-[11px]">Giường:</span>
                  <div className="flex flex-wrap gap-1">
                    {b.seats.map((seat) => (
                      <span
                        key={seat}
                        className="px-2 py-0.5 bg-emerald-50 text-[#1B5E20] font-black text-xs rounded-md border border-emerald-200"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-slate-900 text-sm">
                    {formatVND(b.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Hàng nút bấm thao tác trên Mobile */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForPrint(b)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-[11px]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Xem / In Vé</span>
                </button>

                {b.status === 'PAID' && (
                  <button
                    type="button"
                    onClick={() => setSelectedTicketForChangeSeat(b)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-[11px]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Đổi Giường</span>
                  </button>
                )}

                {b.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => setSelectedTicketForCancel(b)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-[11px]"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Hủy</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3B. BẢNG DANH SÁCH VÉ TRÊN DESKTOP (hidden md:block) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Mã Vé</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Tuyến & Giờ Chạy</th>
                <th className="py-3 px-4">Giường Đặt</th>
                <th className="py-3 px-4">Tổng Tiền</th>
                <th className="py-3 px-4">Hình Thức TT</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy vé xe nào phù hợp với bộ lọc tra cứu.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Mã vé */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900 tracking-tight">{b.bookingCode}</div>
                      <div className="text-[10px] text-slate-400">{b.createdAt}</div>
                    </td>

                    {/* Khách hàng */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.customerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{b.phone}</span>
                      </div>
                    </td>

                    {/* Tuyến & Giờ */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{b.route}</div>
                      <div className="text-[11px] text-[#1B5E20] font-semibold mt-0.5">
                        {b.departureTime} • {b.departureDate} ({b.tripCode})
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={b.pickupPoint}>
                        Đón: {b.pickupPoint}
                      </div>
                    </td>

                    {/* Giường */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {b.seats.map((seat) => (
                          <span
                            key={seat}
                            className="px-2 py-0.5 bg-emerald-50 text-[#1B5E20] font-black text-xs rounded-lg border border-emerald-200"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Tổng tiền */}
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                      {formatVND(b.totalAmount)}
                    </td>

                    {/* Phương thức thanh toán */}
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {b.paymentMethod === 'VNPAY'
                          ? 'Cổng VNPay'
                          : b.paymentMethod === 'CASH'
                          ? 'Tiền mặt tại quầy'
                          : 'Chuyển khoản'}
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-4">
                      {b.status === 'PAID' && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã thanh toán</span>
                        </span>
                      )}
                      {b.status === 'PENDING' && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Chờ giữ chỗ</span>
                        </span>
                      )}
                      {b.status === 'CANCELLED' && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-black text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Đã hủy vé</span>
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Xem vé / In */}
                        <button
                          type="button"
                          onClick={() => setSelectedTicketForPrint(b)}
                          title="Xem phôi vé / In vé lên xe"
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <Printer className="w-4 h-4 text-slate-700" />
                        </button>

                        {/* Đổi giường */}
                        {b.status === 'PAID' && (
                          <button
                            type="button"
                            onClick={() => setSelectedTicketForChangeSeat(b)}
                            title="Đổi giường khác cùng chuyến"
                            className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Hủy vé */}
                        {b.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => setSelectedTicketForCancel(b)}
                            title="Hủy vé & Hoàn tiền"
                            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: XEM VÉ ĐIỆN TỬ / IN PHÔI VÉ LÊN XE */}
      {selectedTicketForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedTicketForPrint(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {/* PHÔI VÉ ĐIỆN TỬ CHUẨN IN NHÀ XE */}
            <div className="border-2 border-dashed border-[#2E7D32]/40 rounded-3xl p-6 bg-slate-50/50 space-y-4">
              {/* Header vé */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider block">
                    Vé Xe Khách Liên Tỉnh
                  </span>
                  <span className="text-base font-black text-slate-900">
                    NHÀ XE TAM NGUYEN THANH
                  </span>
                </div>
                <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center font-black">
                  TNT
                </div>
              </div>

              {/* Thông tin chuyến */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                    Mã Vé
                  </span>
                  <span className="font-black text-slate-900 text-sm">
                    {selectedTicketForPrint.bookingCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                    Mã Chuyến
                  </span>
                  <span className="font-black text-[#1B5E20]">
                    {selectedTicketForPrint.tripCode}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                    Tuyến Đường
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedTicketForPrint.route}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                    Khởi Hành
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedTicketForPrint.departureTime} • {selectedTicketForPrint.departureDate}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                    Hành Khách
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedTicketForPrint.customerName} ({selectedTicketForPrint.phone})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                    Số Giường
                  </span>
                  <span className="font-black text-emerald-800 text-sm bg-emerald-100 px-2 py-0.5 rounded-lg">
                    {selectedTicketForPrint.seats.join(', ')}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">
                    Điểm Đón Khách
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedTicketForPrint.pickupPoint}
                  </span>
                </div>
              </div>

              {/* Tổng tiền & Mã QR Check-in */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Tổng Cước Đã Thu
                  </span>
                  <span className="text-xl font-black text-[#1B5E20]">
                    {formatVND(selectedTicketForPrint.totalAmount)}
                  </span>
                  <span className="text-[10px] text-emerald-600 block font-bold">
                    ✓ ĐÃ THANH TOÁN ({selectedTicketForPrint.paymentMethod})
                  </span>
                </div>

                <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl p-1.5 flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>
              </div>
            </div>

            {/* Nút In vé & Đóng */}
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSelectedTicketForPrint(null)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black text-xs shadow-md shadow-green-900/20"
              >
                <Printer className="w-4 h-4" />
                <span>In Phôi Vé Này</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ĐỔI GIƯỜNG CÙNG CHUYẾN */}
      {selectedTicketForChangeSeat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Đổi Giường Cho Khách Hàng
              </h3>
              <button
                onClick={() => setSelectedTicketForChangeSeat(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3.5 rounded-2xl">
              <div>
                Khách: <strong className="text-slate-900">{selectedTicketForChangeSeat.customerName}</strong>
              </div>
              <div>
                Giường hiện tại: <strong className="text-emerald-700">{selectedTicketForChangeSeat.seats.join(', ')}</strong>
              </div>
              <div>
                Chuyến: <strong>{selectedTicketForChangeSeat.tripCode} ({selectedTicketForChangeSeat.route})</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Nhập hoặc chọn giường trống mới:
              </label>
              <input
                type="text"
                value={targetNewSeat}
                onChange={(e) => setTargetNewSeat(e.target.value)}
                placeholder="Ví dụ: A08 hoặc B04..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-hidden focus:border-[#2E7D32]"
              />
              <p className="text-[11px] text-slate-400">
                Gợi ý các giường trống hiện có trên xe: A08, A09, B04, B06
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSelectedTicketForChangeSeat(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmChangeSeat}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20"
              >
                Xác Nhận Đổi Giường
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: HỦY VÉ & HOÀN TIỀN */}
      {selectedTicketForCancel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-black text-slate-900">
                Xác Nhận Hủy Vé & Hoàn Tiền
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Bạn đang yêu cầu hủy vé <strong>{selectedTicketForCancel.bookingCode}</strong> của hành khách{' '}
              <strong>{selectedTicketForCancel.customerName}</strong>.
            </p>

            <div className="bg-red-50 p-3.5 rounded-2xl border border-red-200 space-y-1 text-xs">
              <div className="text-red-900 font-bold">Chính sách hoàn cước nhà xe:</div>
              <div className="text-red-700 text-[11px]">
                • Hủy trước 24h: Hoàn 90% ({formatVND(selectedTicketForCancel.totalAmount * 0.9)})
              </div>
              <div className="text-red-700 text-[11px]">
                • Khấu trừ 10% phí quản lý: {formatVND(selectedTicketForCancel.totalAmount * 0.1)}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Lý do hủy vé:</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSelectedTicketForCancel(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Không Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-900/20"
              >
                Xác Nhận Hủy & Hoàn Tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
