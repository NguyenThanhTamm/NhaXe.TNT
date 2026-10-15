'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  PlusCircle,
  Search,
  Filter,
  Armchair,
  Clock,
  Bus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Users,
  MapPin,
  ChevronRight,
  Sparkles,
  X,
  Play,
  CheckCheck,
  History,
  Sun,
  Sunset,
  Moon,
  TrendingUp,
} from 'lucide-react';
import {
  TripDetail,
  BusItem,
  DriverItem,
  ShiftType,
  TripStatus,
  getTrips,
  createTrip,
  startTrip,
  completeTrip,
  cancelTrip,
  getAvailableBuses,
  getAvailableDrivers,
  getCurrentShift,
  determineShift,
  subscribeBookingStore,
} from '@/services/bookingStore';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function AdminTripsPage() {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [allTrips, setAllTrips] = useState<TripDetail[]>([]);
  const [availableBuses, setAvailableBuses] = useState<BusItem[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<DriverItem[]>([]);
  const [availableAssistants, setAvailableAssistants] = useState<DriverItem[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [routeFilter, setRouteFilter] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState<ShiftType | 'ALL'>('ALL');

  // Modal tạo chuyến xe mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTripData, setNewTripData] = useState({
    route: 'Sài Gòn ➔ Đà Lạt',
    fromCity: 'TP. Hồ Chí Minh',
    fromStation: 'Bến xe Miền Đông Mới (Quầy TNT)',
    toCity: 'TP. Đà Lạt',
    toStation: 'Bến xe Liên Tỉnh Đà Lạt (01 Tô Hiến Thành)',
    departureDate: '15/10/2026',
    departureTime: '20:30',
    arrivalTime: '04:30',
    duration: '7 giờ 00 phút',
    price: 310000,
    busId: '',
    driverId: '',
    assistantId: '',
  });

  // Tải dữ liệu và cài đặt shift mặc định theo giờ thực tế máy tính
  useEffect(() => {
    // 1. Kích hoạt bộ lọc ca tự động theo giờ thực tế (05:00-11:59 => MORNING, 12:00-17:59 => AFTERNOON, 18:00-04:59 => NIGHT)
    const initialShift = getCurrentShift();
    setShiftFilter(initialShift);

    // 2. Tải danh sách
    const refreshData = () => {
      const trips = getTrips({ includeCompleted: true });
      setAllTrips(trips);
      setAvailableBuses(getAvailableBuses());
      setAvailableDrivers(getAvailableDrivers('MAIN_DRIVER'));
      setAvailableAssistants(getAvailableDrivers('ASSISTANT'));
    };

    refreshData();
    const unsubscribe = subscribeBookingStore(refreshData);
    return () => unsubscribe();
  }, []);

  // Khi mở modal tạo chuyến, set mặc định xe & tài xế đầu tiên còn rảnh
  const handleOpenCreateModal = () => {
    const freshBuses = getAvailableBuses();
    const freshDrivers = getAvailableDrivers('MAIN_DRIVER');
    const freshAssistants = getAvailableDrivers('ASSISTANT');
    setAvailableBuses(freshBuses);
    setAvailableDrivers(freshDrivers);
    setAvailableAssistants(freshAssistants);

    setNewTripData({
      route: 'Sài Gòn ➔ Đà Lạt',
      fromCity: 'TP. Hồ Chí Minh',
      fromStation: 'Bến xe Miền Đông Mới (Quầy TNT)',
      toCity: 'TP. Đà Lạt',
      toStation: 'Bến xe Liên Tỉnh Đà Lạt (01 Tô Hiến Thành)',
      departureDate: '15/10/2026',
      departureTime: '20:30',
      arrivalTime: '04:30',
      duration: '7 giờ 00 phút',
      price: 310000,
      busId: freshBuses[0]?.id || '',
      driverId: freshDrivers[0]?.id || '',
      assistantId: freshAssistants[0]?.id || '',
    });
    setShowCreateModal(true);
  };

  // Tạo chuyến
  const handleCreateTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripData.busId) {
      alert('Vui lòng chọn Xe sẵn sàng hoạt động!');
      return;
    }
    if (!newTripData.driverId) {
      alert('Vui lòng chọn Tài xế chính đang rảnh!');
      return;
    }

    createTrip({
      route: newTripData.route,
      fromCity: newTripData.fromCity,
      fromStation: newTripData.fromStation,
      toCity: newTripData.toCity,
      toStation: newTripData.toStation,
      departureDate: newTripData.departureDate,
      departureTime: newTripData.departureTime,
      arrivalTime: newTripData.arrivalTime,
      duration: newTripData.duration,
      price: Number(newTripData.price),
      busId: newTripData.busId,
      driverId: newTripData.driverId,
      assistantId: newTripData.assistantId,
    });

    setShowCreateModal(false);
  };

  // Thao tác vòng đời chuyến
  const handleStartTrip = (tripId: string) => {
    if (confirm('Xác nhận cho xe bắt đầu xuất bến (chuyển sang trạng thái ĐANG CHẠY)?')) {
      startTrip(tripId);
    }
  };

  const handleCompleteTrip = (tripId: string, tripCode: string) => {
    if (
      confirm(
        `Xác nhận hoàn thành chuyến [${tripCode}]?\n\nChuyến xe sẽ được lưu vào mục Lịch Sử, Xe và Tài Xế phụ trách sẽ được tự động giải phóng về trạng thái "Sẵn sàng" để nhận chuyến mới!`
      )
    ) {
      completeTrip(tripId);
    }
  };

  const handleCancelTrip = (tripId: string, tripCode: string) => {
    if (confirm(`Bạn có chắc chắn muốn hủy chuyến xe [${tripCode}]?`)) {
      cancelTrip(tripId);
    }
  };

  // Danh sách chuyến phân theo tab
  const activeTrips = useMemo(() => {
    return allTrips.filter((t) => t.status === 'SCHEDULED' || t.status === 'RUNNING');
  }, [allTrips]);

  const historyTrips = useMemo(() => {
    return allTrips.filter((t) => t.status === 'COMPLETED' || t.status === 'CANCELLED');
  }, [allTrips]);

  const displayedList = useMemo(() => {
    const source = activeTab === 'ACTIVE' ? activeTrips : historyTrips;

    return source.filter((t) => {
      const matchSearch =
        t.tripCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.driverName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRoute =
        routeFilter === 'ALL' ||
        (routeFilter === 'SG-DL' && t.route.includes('Đà Lạt')) ||
        (routeFilter === 'SG-NT' && t.route.includes('Nha Trang')) ||
        (routeFilter === 'SG-CT' && t.route.includes('Cần Thơ'));

      const shift = t.shift || determineShift(t.departureTime);
      const matchShift = shiftFilter === 'ALL' || shift === shiftFilter;

      return matchSearch && matchRoute && matchShift;
    });
  }, [activeTab, activeTrips, historyTrips, searchTerm, routeFilter, shiftFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const running = activeTrips.filter((t) => t.status === 'RUNNING').length;
    const scheduled = activeTrips.filter((t) => t.status === 'SCHEDULED').length;
    const completed = historyTrips.filter((t) => t.status === 'COMPLETED').length;
    const totalRevenueEst = allTrips.reduce((acc, t) => {
      const bookedCount = t.seats.filter((s) => s.status === 'BOOKED').length;
      return acc + bookedCount * t.price;
    }, 0);

    return { running, scheduled, completed, totalRevenueEst };
  }, [activeTrips, historyTrips, allTrips]);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#1B5E20] uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>TMS / ERP Điều Phối & Lịch Trình Chuyến</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Chuyến Xe & Điều Phối Bến
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Theo dõi trạng thái xuất bến, gán đầu xe - tài xế và kiểm soát vòng đời chuyến theo thời gian thực.
          </p>
        </div>

        {/* NÚT TẠO CHUYẾN MỚI */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white font-bold text-sm shadow-md shadow-emerald-900/10 hover:shadow-lg hover:shadow-emerald-900/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Mở Chuyến Xe Mới</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>Đang Chạy Trên Tuyến</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.running} chuyến</div>
          <div className="text-[11px] text-slate-400 mt-1">Đang di chuyển trên đường</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>Sắp Khởi Hành (Lên Lịch)</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">{stats.scheduled} chuyến</div>
          <div className="text-[11px] text-slate-400 mt-1">Đang đón khách tại các trạm</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>Đã Hoàn Thành</span>
            <CheckCheck className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{stats.completed} chuyến</div>
          <div className="text-[11px] text-slate-400 mt-1">Xe & tài xế đã giải phóng</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>Ước Tính Doanh Thu</span>
            <TrendingUp className="w-4 h-4 text-[#1B5E20]" />
          </div>
          <div className="text-xl font-black text-[#1B5E20]">{formatVND(stats.totalRevenueEst)}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Tổng vé đã bán ra</div>
        </div>
      </div>

      {/* THANH ĐIỀU KHIỂN & BỘ LỌC CA TỰ ĐỘNG */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* TAB ĐIỀU HÀNH TRỰC TIẾP VS LỊCH SỬ HOÀN THÀNH */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                activeTab === 'ACTIVE'
                  ? 'bg-white text-[#1B5E20] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>ĐIỀU HÀNH TRỰC TIẾP ({activeTrips.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                activeTab === 'HISTORY'
                  ? 'bg-white text-[#1B5E20] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>LỊCH SỬ CHUYẾN ĐÃ HOÀN THÀNH ({historyTrips.length})</span>
            </button>
          </div>

          {/* BỘ LỌC CA CHẠY THEO THỜI GIAN THỰC */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <span className="text-[11px] text-slate-400 px-2 font-semibold">Ca chạy:</span>
            <button
              type="button"
              onClick={() => setShiftFilter('MORNING')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                shiftFilter === 'MORNING'
                  ? 'bg-amber-500 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Ca Sáng (05:00 - 11:59)</span>
            </button>

            <button
              type="button"
              onClick={() => setShiftFilter('AFTERNOON')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                shiftFilter === 'AFTERNOON'
                  ? 'bg-orange-500 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
              <span>Ca Chiều (12:00 - 17:59)</span>
            </button>

            <button
              type="button"
              onClick={() => setShiftFilter('NIGHT')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                shiftFilter === 'NIGHT'
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Ca Tối / Đêm (18:00 - 04:59)</span>
            </button>

            <button
              type="button"
              onClick={() => setShiftFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                shiftFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Tất Cả Ca
            </button>
          </div>
        </div>

        {/* BỘ LỌC TÌM KIẾM & TUYẾN ĐƯỜNG */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã chuyến, biển số xe, tài xế..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
            >
              <option value="ALL">-- Tất Cả Tuyến Đường --</option>
              <option value="SG-DL">Sài Gòn ➔ Đà Lạt</option>
              <option value="SG-NT">Sài Gòn ➔ Nha Trang</option>
              <option value="SG-CT">Sài Gòn ➔ Cần Thơ</option>
            </select>
          </div>
        </div>

        {/* BẢNG DANH SÁCH CHUYẾN XE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">MÃ CHUYẾN</th>
                <th className="py-3 px-4">TUYẾN ĐƯỜNG & GIỜ CHẠY</th>
                <th className="py-3 px-4">ĐẦU XE & BIỂN SỐ</th>
                <th className="py-3 px-4">TÀI XẾ & PHỤ XE</th>
                <th className="py-3 px-4">GIÁ VÉ</th>
                <th className="py-3 px-4">LẤP ĐẦY GHẾ</th>
                <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                <th className="py-3 px-4 text-center">THAO TÁC ĐIỀU PHỐI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Không có chuyến xe nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                displayedList.map((t) => {
                  const totalSeats = t.seats.length;
                  const bookedSeats = t.seats.filter((s) => s.status === 'BOOKED').length;
                  const fillPercent = Math.round((bookedSeats / totalSeats) * 100);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Mã chuyến */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {t.tripCode}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 font-semibold">{t.departureDate}</div>
                      </td>

                      {/* Tuyến & Giờ */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{t.route}</div>
                        <div className="text-[11px] text-[#1B5E20] font-black mt-0.5 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {t.departureTime} ➔ {t.arrivalTime}
                          </span>
                        </div>
                      </td>

                      {/* Xe */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold text-xs">
                          <Bus className="w-3 h-3 text-amber-700" />
                          <span>{t.plateNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-1">
                          {t.busTypeName}
                        </div>
                      </td>

                      {/* Tài xế & Phụ */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{t.driverName} (Lái chính)</div>
                        <div className="text-[11px] text-slate-400">{t.assistantName} (Phụ xe)</div>
                      </td>

                      {/* Giá vé */}
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {formatVND(t.price)}
                      </td>

                      {/* Tỷ lệ lấp đầy */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className="text-slate-700">
                            {bookedSeats}/{totalSeats} giường
                          </span>
                          <span className={fillPercent >= 80 ? 'text-emerald-700' : 'text-slate-500'}>
                            {fillPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              fillPercent >= 80
                                ? 'bg-gradient-to-r from-[#2E7D32] to-emerald-400'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        {t.status === 'RUNNING' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-black text-emerald-800 bg-emerald-100">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                            <span>ĐANG CHẠY</span>
                          </span>
                        )}
                        {t.status === 'SCHEDULED' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200">
                            <Clock className="w-3 h-3" />
                            <span>LÊN LỊCH</span>
                          </span>
                        )}
                        {t.status === 'COMPLETED' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-600 bg-slate-100">
                            <CheckCheck className="w-3 h-3 text-slate-500" />
                            <span>HOÀN THÀNH</span>
                          </span>
                        )}
                        {t.status === 'CANCELLED' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-red-700 bg-red-100">
                            <XCircle className="w-3 h-3" />
                            <span>ĐÃ HỦY</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác điều phối */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Vào sơ đồ ghế */}
                          <Link
                            href={`/admin/seats?tripId=${t.id}`}
                            className="p-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white transition-colors"
                            title="Mở sơ đồ ghế thời gian thực"
                          >
                            <Armchair className="w-4 h-4" />
                          </Link>

                          {/* Bắt đầu xuất bến */}
                          {t.status === 'SCHEDULED' && (
                            <button
                              type="button"
                              onClick={() => handleStartTrip(t.id)}
                              title="Bắt đầu xuất bến"
                              className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}

                          {/* Hoàn thành chuyến */}
                          {(t.status === 'RUNNING' || t.status === 'SCHEDULED') && (
                            <button
                              type="button"
                              onClick={() => handleCompleteTrip(t.id, t.tripCode)}
                              title="Hoàn thành chuyến (giải phóng xe & tài xế)"
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Hủy chuyến */}
                          {t.status === 'SCHEDULED' && (
                            <button
                              type="button"
                              onClick={() => handleCancelTrip(t.id, t.tripCode)}
                              title="Hủy chuyến xe"
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL MỞ CHUYẾN XE MỚI */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-[#1B5E20]" />
                <h3 className="font-black text-slate-900 text-base">
                  Mở Lịch Chạy Chuyến Xe Mới (TMS)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTripSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn Tuyến Đường Vận Hành*
                </label>
                <select
                  value={newTripData.route}
                  onChange={(e) => {
                    const r = e.target.value;
                    if (r === 'Sài Gòn ➔ Đà Lạt') {
                      setNewTripData({
                        ...newTripData,
                        route: r,
                        toCity: 'TP. Đà Lạt',
                        toStation: 'Bến xe Liên Tỉnh Đà Lạt (01 Tô Hiến Thành)',
                        price: 310000,
                      });
                    } else if (r === 'Sài Gòn ➔ Nha Trang') {
                      setNewTripData({
                        ...newTripData,
                        route: r,
                        toCity: 'TP. Nha Trang',
                        toStation: 'Bến xe Phía Nam Nha Trang',
                        price: 340000,
                      });
                    } else {
                      setNewTripData({
                        ...newTripData,
                        route: r,
                        toCity: 'TP. Cần Thơ',
                        toStation: 'Bến xe Trung Tâm Cần Thơ',
                        price: 220000,
                      });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                >
                  <option value="Sài Gòn ➔ Đà Lạt">Sài Gòn ➔ Đà Lạt (Đèo Prenn)</option>
                  <option value="Sài Gòn ➔ Nha Trang">Sài Gòn ➔ Nha Trang (Cao tốc Dầu Giây - Cam Lâm)</option>
                  <option value="Sài Gòn ➔ Cần Thơ">Sài Gòn ➔ Cần Thơ (Cao tốc Trung Lương - Mỹ Thuận)</option>
                </select>
              </div>

              {/* CHỌN ĐẦU XE (CHỈ HIỂN THỊ XE SẴN SÀNG) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Chọn Đầu Xe Điều Động (Chỉ xe SẴN SÀNG)*</span>
                  <span className="text-emerald-700 font-bold">{availableBuses.length} xe rảnh</span>
                </label>
                {availableBuses.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                    Hiện không có xe nào ở trạng thái "Sẵn sàng". Vui lòng kiểm tra mục Quản lý Đội xe!
                  </div>
                ) : (
                  <select
                    required
                    value={newTripData.busId}
                    onChange={(e) => setNewTripData({ ...newTripData, busId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  >
                    <option value="">-- Bấm chọn đầu xe xuất bến --</option>
                    {availableBuses.map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.plateNumber}] - {b.model} ({b.busType === 'GIUONG_NAM_36' ? '36 Giường' : '22 VIP'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* CHỌN TÀI XẾ & PHỤ XE (CHỈ HIỂN THỊ TÀI XẾ ĐANG RẢNH) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tài Xế Chính (Đang rảnh)*
                  </label>
                  <select
                    required
                    value={newTripData.driverId}
                    onChange={(e) => setNewTripData({ ...newTripData, driverId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  >
                    <option value="">-- Chọn lái chính --</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phụ Xe / Lái Phụ*
                  </label>
                  <select
                    required
                    value={newTripData.assistantId}
                    onChange={(e) =>
                      setNewTripData({ ...newTripData, assistantId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  >
                    <option value="">-- Chọn phụ xe --</option>
                    {availableAssistants.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* NGÀY & GIỜ KHỞI HÀNH */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày Chạy (dd/mm/yyyy)*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="15/10/2026"
                    value={newTripData.departureDate}
                    onChange={(e) =>
                      setNewTripData({ ...newTripData, departureDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giờ Xuất Bến*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="20:30"
                    value={newTripData.departureTime}
                    onChange={(e) =>
                      setNewTripData({ ...newTripData, departureTime: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giá Vé Niêm Yết (VNĐ)*
                  </label>
                  <input
                    type="number"
                    required
                    step={10000}
                    value={newTripData.price}
                    onChange={(e) =>
                      setNewTripData({ ...newTripData, price: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={availableBuses.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-900/10 hover:shadow-lg transition-all"
                >
                  Xác Nhận Xuất Lệnh Chuyến
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
