'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Printer,
  Bus,
  User,
  Phone,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Copy,
  DollarSign,
  MapPin,
  Calendar,
  X,
  Play,
  CheckCheck,
  Sun,
  Sunset,
  Moon,
  ArrowRight,
  PlusCircle,
  Disc,
  ArrowDownRight,
  Footprints,
  ShieldAlert,
  ArrowLeftRight,
  Trash2,
  FileText,
} from 'lucide-react';
import {
  TripDetail,
  SeatInfo,
  ShiftType,
  getTrips,
  saveTrips,
  bookSeats,
  cancelBooking,
  lockSeat,
  unlockSeat,
  startTrip,
  completeTrip,
  getCurrentShift,
  determineShift,
  subscribeBookingStore,
} from '@/services/bookingStore';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function AdminSeatManagementInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab tầng: 1 (Tầng Dưới), 2 (Tầng Trên), 3 (Xem Song Song 2 Tầng)
  const [activeFloorView, setActiveFloorView] = useState<1 | 2 | 'BOTH'>(1);
  const [activeTrips, setActiveTrips] = useState<TripDetail[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [copiedSeatCode, setCopiedSeatCode] = useState<string | null>(null);

  // Bộ lọc Ca chạy theo thời gian thực (Real-time Shift Selector)
  const [shiftFilter, setShiftFilter] = useState<ShiftType | 'ALL'>('ALL');

  // Modal Bán vé tại quầy (POS)
  const [sellingSeat, setSellingSeat] = useState<SeatInfo | null>(null);
  const [posForm, setPosForm] = useState({
    customerName: '',
    customerPhone: '',
    pickupPoint: '',
    dropoffPoint: '',
    paymentMethod: 'CASH' as 'CASH' | 'VNPAY' | 'TRANSFER',
  });

  // Drawer / Modal Chi tiết vé đã đặt
  const [selectedBookedSeat, setSelectedBookedSeat] = useState<SeatInfo | null>(null);
  const [targetChangeSeatCode, setTargetChangeSeatCode] = useState<string>('');
  const [isChangingSeat, setIsChangingSeat] = useState(false);

  // Tải dữ liệu & kích hoạt bộ lọc ca tự động theo giờ máy tính
  useEffect(() => {
    const autoShift = getCurrentShift();
    setShiftFilter(autoShift);

    const refreshData = () => {
      const trips = getTrips();
      setActiveTrips(trips);

      const urlTripId = searchParams.get('tripId');
      if (urlTripId && trips.some((t) => t.id === urlTripId || t.tripCode === urlTripId)) {
        const found = trips.find((t) => t.id === urlTripId || t.tripCode === urlTripId);
        if (found) setSelectedTripId(found.id);
      } else if (trips.length > 0) {
        const tripInShift = trips.find((t) => (t.shift || determineShift(t.departureTime)) === autoShift);
        setSelectedTripId((prev) => {
          if (prev && trips.some((t) => t.id === prev)) return prev;
          return tripInShift ? tripInShift.id : trips[0].id;
        });
      }
    };

    refreshData();
    const unsubscribe = subscribeBookingStore(refreshData);
    const interval = setInterval(refreshData, 3000);
    window.addEventListener('focus', refreshData);

    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener('focus', refreshData);
    };
  }, [searchParams]);

  // Lọc danh sách chuyến hiển thị trên thanh chọn theo ca
  const filteredTripsByShift = useMemo(() => {
    if (shiftFilter === 'ALL') return activeTrips;
    return activeTrips.filter((t) => {
      const shift = t.shift || determineShift(t.departureTime);
      return shift === shiftFilter;
    });
  }, [activeTrips, shiftFilter]);

  // Chuyến hiện tại đang được chọn
  const currentTrip = useMemo(() => {
    return activeTrips.find((t) => t.id === selectedTripId || t.tripCode === selectedTripId) || activeTrips[0];
  }, [activeTrips, selectedTripId]);

  // Phân chia ghế theo tầng
  const seatsFloor1 = useMemo(() => {
    if (!currentTrip) return [];
    return currentTrip.seats.filter((s) => s.floor === 1);
  }, [currentTrip]);

  const seatsFloor2 = useMemo(() => {
    if (!currentTrip) return [];
    return currentTrip.seats.filter((s) => s.floor === 2);
  }, [currentTrip]);

  // Phân loại cấu hình xe: Limousine 22 Cabin VIP vs Giường Nằm 36
  const isLimousine = useMemo(() => {
    return currentTrip?.busType === 'LIMOUSINE_22';
  }, [currentTrip]);

  const floor1Title = isLimousine ? 'TẦNG 1 (DÃY DƯỚI - 11 CABIN)' : 'TẦNG 1 (DÃY A - 18 GIƯỜNG)';
  const floor2Title = isLimousine ? 'TẦNG 2 (DÃY TRÊN - 11 CABIN)' : 'TẦNG 2 (DÃY B - 18 GIƯỜNG)';
  const floor1TabLabel = isLimousine ? 'TẦNG DƯỚI (DÃY C - 11 CABIN)' : 'TẦNG DƯỚI (DÃY A)';
  const floor2TabLabel = isLimousine ? 'TẦNG TRÊN (DÃY D - 11 CABIN)' : 'TẦNG TRÊN (DÃY B)';

  // Danh sách ghế trống hiện có để đổi giường
  const availableSeatCodes = useMemo(() => {
    if (!currentTrip) return [];
    return currentTrip.seats.filter((s) => s.status === 'AVAILABLE').map((s) => s.seatCode);
  }, [currentTrip]);

  // Thống kê nhanh ghế
  const seatStats = useMemo(() => {
    if (!currentTrip) return { total: 0, booked: 0, available: 0, locked: 0, totalRevenue: 0, cashToCollect: 0 };
    const total = currentTrip.seats.length;
    const booked = currentTrip.seats.filter((s) => s.status === 'BOOKED').length;
    const locked = currentTrip.seats.filter((s) => s.status === 'LOCKED').length;
    const available = total - booked - locked;
    const totalRevenue = booked * currentTrip.price;

    // Tổng tiền mặt cần thu trên xe
    const cashToCollect = currentTrip.seats
      .filter((s) => s.status === 'BOOKED' && s.paymentStatus !== 'PAID')
      .reduce((sum, s) => sum + s.price, 0);

    return { total, booked, available, locked, totalRevenue, cashToCollect };
  }, [currentTrip]);

  // Danh sách hành khách đã đặt để in hoặc điều hành
  const bookedPassengers = useMemo(() => {
    if (!currentTrip) return [];
    return currentTrip.seats
      .filter((s) => s.status === 'BOOKED' && s.customerName)
      .sort((a, b) => a.seatCode.localeCompare(b.seatCode));
  }, [currentTrip]);

  // Thao tác sao chép SĐT
  const handleCopyPhone = (phone: string, seatCode: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedSeatCode(seatCode);
    setTimeout(() => setCopiedSeatCode(null), 2000);
  };

  // Thao tác Bắt đầu chạy & Hoàn thành chuyến
  const handleStartTripAction = () => {
    if (!currentTrip) return;
    if (confirm(`Xác nhận cho xe [${currentTrip.plateNumber}] bắt đầu xuất bến?`)) {
      startTrip(currentTrip.id);
    }
  };

  const handleCompleteTripAction = () => {
    if (!currentTrip) return;
    if (
      confirm(
        `Xác nhận HOÀN THÀNH CHUYẾN XE [${currentTrip.tripCode}]?\n\nChuyến xe này sẽ lập tức biến mất khỏi danh sách điều hành trực tiếp. Đầu xe [${currentTrip.plateNumber}] và Tài xế [${currentTrip.driverName}] sẽ được tự động giải phóng về trạng thái "Sẵn sàng" để nhận chuyến mới!`
      )
    ) {
      completeTrip(currentTrip.id);
    }
  };

  // Xử lý Bán vé tại quầy (POS)
  const handleOpenPosModal = (seat: SeatInfo) => {
    setSellingSeat(seat);
    setPosForm({
      customerName: '',
      customerPhone: '',
      pickupPoint: currentTrip?.pickupPoints[0]?.name || 'VP chính (Bến xe Miền Đông)',
      dropoffPoint: currentTrip?.dropoffPoints[0]?.name || 'Bến xe Liên Tỉnh',
      paymentMethod: 'CASH',
    });
  };

  const handlePosSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingSeat || !currentTrip) return;
    if (!posForm.customerName.trim() || !posForm.customerPhone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại khách hàng!');
      return;
    }

    const res = bookSeats({
      tripId: currentTrip.id,
      seatCodes: [sellingSeat.seatCode],
      customerName: posForm.customerName.trim(),
      customerPhone: posForm.customerPhone.trim(),
      pickupPoint: posForm.pickupPoint,
      dropoffPoint: posForm.dropoffPoint,
      paymentMethod: posForm.paymentMethod,
      luggageNote: 'Vé bán nhanh tại quầy điều hành',
    });

    if (res.success) {
      setSellingSeat(null);
    } else {
      alert(res.message);
    }
  };

  // Hủy vé đã đặt và nhả lại ghế trống
  const handleCancelSeatBooking = (seat: SeatInfo) => {
    if (!currentTrip) return;
    if (
      confirm(
        `Bạn có chắc chắn muốn HỦY VÉ giường ${seat.seatCode} của khách ${seat.customerName}?\nGhế sẽ lập tức trở về trạng thái TRỐNG.`
      )
    ) {
      if (seat.bookingCode) {
        cancelBooking(seat.bookingCode);
      } else {
        // Cập nhật thủ công nếu vé không có bookingCode
        currentTrip.seats = currentTrip.seats.map((s) => {
          if (s.seatCode === seat.seatCode) {
            return {
              ...s,
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
          return s;
        });
        saveTrips(activeTrips);
      }
      setSelectedBookedSeat(null);
    }
  };

  // Đổi sang giường trống khác
  const handleChangeSeatConfirm = () => {
    if (!selectedBookedSeat || !targetChangeSeatCode || !currentTrip) return;

    const sourceSeat = selectedBookedSeat;
    const targetSeat = currentTrip.seats.find((s) => s.seatCode === targetChangeSeatCode);

    if (!targetSeat || targetSeat.status !== 'AVAILABLE') {
      alert('Giường đích đã có người đặt hoặc không hợp lệ!');
      return;
    }

    currentTrip.seats = currentTrip.seats.map((s) => {
      if (s.seatCode === targetChangeSeatCode) {
        return {
          ...s,
          status: 'BOOKED',
          customerName: sourceSeat.customerName,
          customerPhone: sourceSeat.customerPhone,
          pickupPoint: sourceSeat.pickupPoint,
          dropoffPoint: sourceSeat.dropoffPoint,
          bookingCode: sourceSeat.bookingCode,
          paymentMethod: sourceSeat.paymentMethod,
          paymentStatus: sourceSeat.paymentStatus,
          bookingTime: sourceSeat.bookingTime,
          luggageNote: sourceSeat.luggageNote,
        };
      }
      if (s.seatCode === sourceSeat.seatCode) {
        return {
          ...s,
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
      return s;
    });

    saveTrips(activeTrips);
    setIsChangingSeat(false);
    setSelectedBookedSeat(null);
    alert(`Đã đổi giường thành công từ ${sourceSeat.seatCode} sang ${targetChangeSeatCode}!`);
  };

  // Khóa / Mở khóa ghế
  const handleToggleLockSeat = (seat: SeatInfo) => {
    if (!currentTrip) return;
    if (seat.status === 'LOCKED') {
      unlockSeat(currentTrip.id, seat.seatCode);
      if (selectedBookedSeat?.seatCode === seat.seatCode) setSelectedBookedSeat(null);
    } else if (seat.status === 'AVAILABLE') {
      const reason = prompt('Nhập lý do khóa kỹ thuật (VD: Hỏng đệm, dự phòng):', 'Khóa kỹ thuật');
      if (reason !== null) {
        lockSeat(currentTrip.id, seat.seatCode, reason);
      }
    }
  };

  // In lệnh A4
  const handlePrintA4 = () => {
    window.print();
  };

  if (!currentTrip) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
        <Bus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700">Hiện Chưa Có Chuyến Xe Nào Đang Điều Hành</h3>
        <p className="text-xs text-slate-400 mt-1">
          Tất cả các chuyến có thể đã hoàn thành hoặc chưa được tạo. Vui lòng vào trang Quản lý Chuyến xe để mở chuyến mới.
        </p>
      </div>
    );
  }

  // Helper render sơ đồ mô phỏng khoang xe (Bus Cabin Blueprint)
  const renderCabinBlueprint = (seatsList: SeatInfo[], floorLabel: string, floorCode: string) => {
    const is36Seats = currentTrip.busType === 'GIUONG_NAM_36';
    const rows = [1, 2, 3, 4, 5, 6];

    return (
      <div className="w-full max-w-[380px] sm:max-w-[460px] md:max-w-[540px] mx-auto bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 border-2 sm:border-4 border-slate-700/80 rounded-3xl sm:rounded-[44px] p-2.5 sm:p-5 shadow-2xl relative overflow-hidden transition-all">
        {/* TAI GƯƠNG CHIẾU HẬU (SIDE MIRRORS) */}
        <div className="absolute -left-2 top-8 w-3 h-8 bg-slate-800 rounded-l-md border border-slate-600 shadow-md" />
        <div className="absolute -right-2 top-8 w-3 h-8 bg-slate-800 rounded-r-md border border-slate-600 shadow-md" />

        {/* 1. ĐẦU XE KHÁCH (CABIN FRONT & WINDSHIELD) */}
        <div className="rounded-t-2xl sm:rounded-t-[34px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white p-2.5 sm:p-3.5 mb-3.5 sm:mb-5 shadow-md border-b-2 border-emerald-500/40 relative">
          {/* Kính chắn gió cong phía trước */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black text-slate-400 border-b border-slate-800/80 pb-1.5 sm:pb-2 mb-2 sm:mb-3">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{floorLabel} ({floorCode})</span>
            </span>
            <span className="font-mono text-slate-400 uppercase tracking-widest text-[9px] sm:text-[10px]">
              KÍNH CHẮN GIÓ PHÍA TRƯỚC
            </span>
          </div>

          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {/* Vô-lăng & Ghế Bác tài (Bên trái) */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-800/90 border border-slate-700 px-2 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl shadow-inner">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-amber-400 shadow-sm animate-pulse shrink-0">
                <Disc className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase leading-none">Bác Tài</div>
                <div className="text-[11px] sm:text-xs font-black text-white truncate max-w-[90px] sm:max-w-[110px]">
                  {currentTrip.driverName}
                </div>
              </div>
            </div>

            {/* Cửa Lên Xuống (Bên phải) */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 bg-emerald-950/80 border border-emerald-500/60 px-2 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl shadow-inner text-right">
              <div className="min-w-0">
                <div className="text-[9px] sm:text-[10px] text-emerald-400 font-bold uppercase leading-none">Cửa Lên Xe</div>
                <div className="text-[10px] sm:text-[11px] font-black text-emerald-200">BẬC THANG ➔</div>
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-900 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. THÂN KHOANG XE & BỐ TRÍ LỐI ĐI CHUẨN THỰC TẾ */}
        {is36Seats ? (
          // ==============================================================
          // XE GIƯỜNG NẰM 36 CHỖ (5 CỘT: DÃY 1 | LỐI ĐI 1 | DÃY 2 | LỐI ĐI 2 | DÃY 3)
          // ==============================================================
          <div className="space-y-2 sm:space-y-3">
            {/* TIÊU ĐỀ DÃY GHẾ */}
            <div className="grid grid-cols-[1fr_16px_1fr_16px_1fr] sm:grid-cols-[1fr_24px_1fr_24px_1fr] items-center text-center text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              <span>Dãy Trái</span>
              <span className="text-slate-300">L1</span>
              <span>Dãy Giữa</span>
              <span className="text-slate-300">L2</span>
              <span>Dãy Phải</span>
            </div>

            {rows.map((rowNum) => {
              const seatCol1 = seatsList.find((s) => s.row === rowNum && s.col === 1);
              const seatCol2 = seatsList.find((s) => s.row === rowNum && s.col === 2);
              const seatCol3 = seatsList.find((s) => s.row === rowNum && s.col === 3);

              return (
                <div
                  key={`row_${rowNum}`}
                  className="grid grid-cols-[1fr_16px_1fr_16px_1fr] sm:grid-cols-[1fr_24px_1fr_24px_1fr] gap-x-1 sm:gap-x-1.5 items-center"
                >
                  {/* CỘT 1: DÃY TRÁI */}
                  {seatCol1 ? renderBedBox(seatCol1) : <div className="h-14 sm:h-16" />}

                  {/* LỐI ĐI 1: HỌA TIẾT BƯỚC CHÂN / SỌC ĐỊNH HƯỚNG */}
                  <div className="h-full flex flex-col items-center justify-center text-slate-300/80">
                    <Footprints className="w-3 sm:w-3.5 h-3 sm:h-3.5 rotate-90 opacity-60" />
                  </div>

                  {/* CỘT 2: DÃY GIỮA */}
                  {seatCol2 ? renderBedBox(seatCol2) : <div className="h-14 sm:h-16" />}

                  {/* LỐI ĐI 2: HỌA TIẾT BƯỚC CHÂN / SỌC ĐỊNH HƯỚNG */}
                  <div className="h-full flex flex-col items-center justify-center text-slate-300/80">
                    <Footprints className="w-3 sm:w-3.5 h-3 sm:h-3.5 rotate-90 opacity-60" />
                  </div>

                  {/* CỘT 3: DÃY PHẢI */}
                  {seatCol3 ? renderBedBox(seatCol3) : <div className="h-14 sm:h-16" />}
                </div>
              );
            })}
          </div>
        ) : (
          // ==============================================================
          // XE LIMOUSINE VIP 22 CABIN (2 CỘT THỰC TẾ: DÃY TRÁI | LỐI ĐI CHÍNH | DÃY PHẢI)
          // ==============================================================
          <div className="space-y-2.5 sm:space-y-3.5">
            <div className="grid grid-cols-[1fr_24px_1fr] sm:grid-cols-[1fr_36px_1fr] items-center text-center text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-2">
              <span className="bg-slate-200/90 py-1 px-1.5 sm:px-2 rounded-lg text-slate-700">DÃY TRÁI (BÊN TÀI)</span>
              <span className="text-slate-400 text-[8px] sm:text-[9px]">LỐI ĐI</span>
              <span className="bg-slate-200/90 py-1 px-1.5 sm:px-2 rounded-lg text-slate-700">DÃY PHẢI (BÊN PHỤ)</span>
            </div>

            {(() => {
              // Phân tách 2 dãy cabin: Dãy Trái (C01, C03, C05... / D01, D03...) và Dãy Phải (C02, C04, C06... / D02, D04...)
              const leftCabins = seatsList
                .filter((s) => s.col === 1 || parseInt(s.seatCode.replace(/\D/g, ''), 10) % 2 === 1)
                .sort((a, b) => a.seatCode.localeCompare(b.seatCode));

              const rightCabins = seatsList
                .filter((s) => s.col === 3 || parseInt(s.seatCode.replace(/\D/g, ''), 10) % 2 === 0)
                .sort((a, b) => a.seatCode.localeCompare(b.seatCode));

              const totalRows = Math.max(leftCabins.length, rightCabins.length);
              const cabinRows = [];

              for (let i = 0; i < totalRows; i++) {
                const sLeft = leftCabins[i];
                const sRight = rightCabins[i];

                cabinRows.push(
                  <div
                    key={`cabin_row_${i}`}
                    className="grid grid-cols-[1fr_24px_1fr] sm:grid-cols-[1fr_36px_1fr] gap-x-1.5 sm:gap-x-2 items-center"
                  >
                    {sLeft ? (
                      renderBedBox(sLeft, true)
                    ) : (
                      <div className="h-[70px] sm:h-[78px] rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-[9px] sm:text-[10px] text-slate-400 italic">
                        Lối đi sau
                      </div>
                    )}

                    {/* LỐI ĐI CHÍNH GIỮA CABIN */}
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 border-x border-dashed border-slate-300/60 py-2">
                      <Footprints className="w-3.5 sm:w-4 h-3.5 sm:h-4 rotate-90 opacity-70" />
                    </div>

                    {sRight ? (
                      renderBedBox(sRight, true)
                    ) : (
                      <div className="h-[70px] sm:h-[78px] rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-[9px] sm:text-[10px] text-slate-400 italic">
                        Khoang hành lý
                      </div>
                    )}
                  </div>
                );
              }

              return cabinRows;
            })()}
          </div>
        )}

        {/* 3. ĐUÔI XE KHÁCH (REAR COMPARTMENT / WC / BĂNG GHẾ SAU) */}
        <div className="rounded-b-2xl sm:rounded-b-[34px] bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800 text-slate-300 py-2 sm:py-2.5 px-3 sm:px-4 mt-3 sm:mt-5 border-t-2 border-slate-700 flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
          <span className="flex items-center space-x-1 text-slate-400 text-[9px] sm:text-[10px]">
            <ShieldAlert className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-500" />
            <span>Khoang Máy & WC</span>
          </span>
          <span className="font-mono text-emerald-400 bg-slate-900 px-2 sm:px-2.5 py-0.5 rounded border border-emerald-500/40 text-[11px] sm:text-xs">
            {currentTrip.plateNumber}
          </span>
          <span className="text-slate-400 text-[9px] sm:text-[10px]">Cửa Thoát Hiểm</span>
        </div>
      </div>
    );
  };

  // Helper render từng ô giường nhỏ gọn chuẩn mô hình xe khách
  const renderBedBox = (seat: SeatInfo, isCabinVIP: boolean = false) => {
    const isBooked = seat.status === 'BOOKED';
    const isLocked = seat.status === 'LOCKED';

    return (
      <div
        key={seat.id}
        onClick={() => {
          if (isBooked) {
            setSelectedBookedSeat(seat);
            setIsChangingSeat(false);
          } else if (isLocked) {
            handleToggleLockSeat(seat);
          } else {
            handleOpenPosModal(seat);
          }
        }}
        className={`relative group rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden shadow-2xs select-none active:scale-[0.98] ${
          isCabinVIP ? 'h-[74px] sm:h-[80px] rounded-xl sm:rounded-2xl' : 'h-[62px] sm:h-[68px]'
        } min-h-[50px] ${
          isBooked
            ? 'bg-rose-50/95 border-rose-400 hover:border-rose-600 hover:shadow-md'
            : isLocked
            ? 'bg-slate-200/90 border-slate-400 text-slate-600 hover:bg-slate-300'
            : 'bg-white border-emerald-300 hover:border-[#1B5E20] hover:bg-emerald-50/70 hover:shadow-md'
        }`}
      >
        {/* GỐI ĐẦU GIƯỜNG NẰM / CABIN (PILLOW STRIP) */}
        <div
          className={`h-2.5 mx-2.5 rounded-b-md transition-colors ${
            isBooked
              ? 'bg-rose-200/80 border-b border-rose-300'
              : isLocked
              ? 'bg-slate-300 border-b border-slate-400'
              : 'bg-emerald-100 border-b border-emerald-200'
          }`}
        />

        {/* NỘI DUNG Ô GIƯỜNG / CABIN */}
        <div className="px-2 pb-1.5 flex flex-col justify-between flex-1">
          {/* DÒNG ĐỈNH: MÃ GIƯỜNG & TRẠNG THÁI */}
          <div className="flex items-center justify-between">
            <span
              className={`font-mono text-xs font-black px-1.5 py-0.2 rounded-md ${
                isBooked
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : isLocked
                  ? 'bg-slate-700 text-white'
                  : 'bg-emerald-700 text-white'
              }`}
            >
              {seat.seatCode}
            </span>

            {isBooked ? (
              <span className="text-[9px] font-black uppercase text-rose-700 bg-rose-100 px-1 py-0.2 rounded">
                {isCabinVIP ? 'ĐÃ ĐẶT' : 'ĐÃ BÁN'}
              </span>
            ) : isLocked ? (
              <Lock className="w-3 h-3 text-slate-600" />
            ) : (
              <span className="text-[10px] font-black text-emerald-800">
                {formatVND(seat.price).replace('₫', 'đ')}
              </span>
            )}
          </div>

          {/* DÒNG THÂN: THÔNG TIN KHÁCH (NẾU ĐÃ BÁN) HOẶC NÚT ĐẶT */}
          {isBooked ? (
            <div className="space-y-0.5 mt-0.5">
              <div className="text-[11px] font-black text-slate-900 truncate leading-tight">
                {seat.customerName || 'Khách đặt'}
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-600">
                <span className="truncate">{seat.customerPhone || seat.bookingCode}</span>
                <span className="text-emerald-800 bg-emerald-100/80 px-1 rounded truncate max-w-[55px]">
                  {seat.pickupPoint ? seat.pickupPoint.split('(')[0].trim() : 'Đón VP'}
                </span>
              </div>
            </div>
          ) : isLocked ? (
            <div className="text-[10px] font-bold text-slate-500 italic text-center">
              Khóa Kỹ Thuật
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-1 text-[10px] font-black text-[#1B5E20] opacity-90 group-hover:opacity-100">
              <PlusCircle className="w-3 h-3" />
              <span>{isCabinVIP ? 'Bán Vé Cabin' : 'Bán Vé'}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0 print:w-full print:max-w-none print:block">
      {/* CSS PRINT CHUẨN KHỔ GIẤY A4 PORTRAIT */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ============================================================== */}
      {/* 1. SCREEN VIEW ONLY (ẨN KHI IN ẤN @media print) */}
      {/* ============================================================== */}
      <div className="print:hidden no-print space-y-6">
        {/* BANNER ĐIỀU HÀNH & NÚT IN A4 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#1B5E20] uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Khoang Xe Mô Phỏng Chuẩn Thực Tế (Bus Cabin Blueprint)</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Sơ Đồ Ghế Thời Gian Thực & Điều Phối Chuyến
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Mô phỏng chân thực đầu xe, cửa lên xuống, lối đi và giường nằm. Nhấp vào giường để bán vé quầy, đổi chỗ hoặc hủy vé.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentTrip.status === 'SCHEDULED' && (
              <button
                type="button"
                onClick={handleStartTripAction}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>🚀 Xuất Bến</span>
              </button>
            )}

            {currentTrip.status === 'RUNNING' && (
              <button
                type="button"
                onClick={handleCompleteTripAction}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <CheckCheck className="w-4 h-4" />
                <span>✅ Hoàn Thành Chuyến</span>
              </button>
            )}

            {/* NÚT IN A4 CHUYÊN NGHIỆP */}
            <button
              type="button"
              onClick={handlePrintA4}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] hover:from-[#144718] hover:to-[#1B5E20] text-white font-black text-xs shadow-md shadow-emerald-900/10 hover:shadow-lg active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ In Phôi Lệnh & Danh Sách Đón Khách (A4)</span>
            </button>
          </div>
        </div>

        {/* 2. BỘ CHỌN CA TỰ ĐỘNG & BỘ CHỌN CHUYẾN XE */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Bus className="w-4 h-4 text-[#1B5E20]" />
              <span className="text-xs font-black uppercase text-slate-800">
                BỘ CHỌN CHUYẾN ĐIỀU HÀNH ({activeTrips.length} chuyến mở)
              </span>
            </div>

            {/* BỘ LỌC CA CHẠY */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
              <span className="text-[11px] text-slate-400 px-2 font-semibold">Ca chạy:</span>
              <button
                type="button"
                onClick={() => setShiftFilter('MORNING')}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all ${
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
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all ${
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
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  shiftFilter === 'NIGHT'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Ca Đêm (18:00 - 04:59)</span>
              </button>

              <button
                type="button"
                onClick={() => setShiftFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  shiftFilter === 'ALL'
                    ? 'bg-slate-800 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Tất Cả Ca
              </button>
            </div>
          </div>

          {/* DANH SÁCH THẺ CHUYẾN ĐI THEO CA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredTripsByShift.length === 0 ? (
              <div className="col-span-full py-4 text-center text-xs text-slate-400 font-semibold">
                Không có chuyến nào trong ca này. Hãy chọn "Tất Cả Ca" để xem các chuyến khác.
              </div>
            ) : (
              filteredTripsByShift.map((t) => {
                const isSelected = t.id === currentTrip.id;
                const bookedCount = t.seats.filter((s) => s.status === 'BOOKED').length;
                const totalCount = t.seats.length;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTripId(t.id);
                      router.replace(`/admin/seats?tripId=${t.id}`);
                    }}
                    className={`p-3.5 rounded-2xl text-left border transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-emerald-50/90 border-[#1B5E20] shadow-sm ring-2 ring-[#1B5E20]/20'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-[#1B5E20] rounded-bl-lg" />
                    )}
                    <div className="flex items-center justify-between text-xs font-black text-slate-900 mb-1">
                      <span className="truncate pr-1">{t.route}</span>
                      <span className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        {t.departureTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mt-1">
                      <span className="font-mono">{t.plateNumber}</span>
                      <span>
                        {bookedCount}/{totalCount} vé
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 truncate">
                      Lái xe: {t.driverName}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 3. THÔNG TIN ĐIỀU HÀNH CHUYẾN & BỘ ĐIỀU KHIỂN KHOANG */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Tuyến & Giờ xuất bến */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tuyến & Giờ Xuất Bến</span>
              <div className="text-base font-black text-slate-900">{currentTrip.route}</div>
              <div className="text-xs font-bold text-[#1B5E20] flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Khởi hành: {currentTrip.departureTime} ({currentTrip.departureDate})
                </span>
              </div>
            </div>

            {/* Đầu xe & Biển số */}
            <div className="space-y-1 md:pl-4 pt-3 md:pt-0">
              <span className="text-[10px] uppercase font-bold text-slate-400">Đầu Xe Phụ Trách</span>
              <div className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-mono">
                  {currentTrip.plateNumber}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">{currentTrip.busTypeName}</div>
            </div>

            {/* Tổ lái & Phụ xe */}
            <div className="space-y-1 md:pl-4 pt-3 md:pt-0">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tổ Lái & Tiếp Viên</span>
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-[#1B5E20]" />
                <span>Lái chính: {currentTrip.driverName}</span>
              </div>
              <div className="text-xs text-slate-500">Phụ xe: {currentTrip.assistantName}</div>
            </div>

            {/* Thống kê doanh thu nhanh */}
            <div className="space-y-1 md:pl-4 pt-3 md:pt-0">
              <span className="text-[10px] uppercase font-bold text-slate-400">Lấp Đầy & Tiền Mặt Thu Xe</span>
              <div className="text-sm font-black text-slate-900">
                {seatStats.booked}/{seatStats.total} Giường (Trống: {seatStats.available})
              </div>
              <div className="text-xs font-black text-[#1B5E20]">
                Tiền mặt thu trên xe: {formatVND(seatStats.cashToCollect)}
              </div>
            </div>
          </div>

          {/* BỘ ĐIỀU KHIỂN CHỌN TẦNG VÀ CHÚ THÍCH */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
            {/* THANH CHUYỂN TAB TẦNG 1 / TẦNG 2 / SONG SONG */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setActiveFloorView(1)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeFloorView === 1
                    ? 'bg-white text-[#1B5E20] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {floor1TabLabel}
              </button>
              <button
                type="button"
                onClick={() => setActiveFloorView(2)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeFloorView === 2
                    ? 'bg-white text-[#1B5E20] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {floor2TabLabel}
              </button>
              <button
                type="button"
                onClick={() => setActiveFloorView('BOTH')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeFloorView === 'BOTH'
                    ? 'bg-white text-[#1B5E20] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SONG SONG 2 TẦNG
              </button>
            </div>

            {/* CHÚ THÍCH MÀU SẮC */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-md bg-white border-2 border-emerald-400" />
                <span className="text-slate-600">
                  {isLimousine ? 'Cabin Trống' : 'Giường Trống'} ({seatStats.available})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-md bg-rose-100 border-2 border-rose-400" />
                <span className="text-slate-600">
                  {isLimousine ? 'Đã Có Khách' : 'Đã Bán'} ({seatStats.booked})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-200 border-2 border-slate-400" />
                <span className="text-slate-600">Khóa Kỹ Thuật ({seatStats.locked})</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. KHOANG XE MÔ PHỎNG CHUẨN THỰC TẾ (BUS CABIN BLUEPRINT) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          {activeFloorView === 'BOTH' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start justify-center">
              <div>
                {renderCabinBlueprint(
                  seatsFloor1,
                  isLimousine ? 'TẦNG 1 (DÃY DƯỚI)' : 'TẦNG DƯỚI',
                  isLimousine ? '11 CABIN' : 'DÃY A'
                )}
              </div>
              <div>
                {renderCabinBlueprint(
                  seatsFloor2,
                  isLimousine ? 'TẦNG 2 (DÃY TRÊN)' : 'TẦNG TRÊN',
                  isLimousine ? '11 CABIN' : 'DÃY B'
                )}
              </div>
            </div>
          ) : activeFloorView === 1 ? (
            renderCabinBlueprint(
              seatsFloor1,
              isLimousine ? 'TẦNG 1 (DÃY DƯỚI)' : 'TẦNG DƯỚI',
              isLimousine ? '11 CABIN' : 'DÃY A'
            )
          ) : (
            renderCabinBlueprint(
              seatsFloor2,
              isLimousine ? 'TẦNG 2 (DÃY TRÊN)' : 'TẦNG TRÊN',
              isLimousine ? '11 CABIN' : 'DÃY B'
            )
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. BẢN IN PHÔI LỆNH XUẤT BẾN KHỔ A4 CHUẨN (@media print) */}
      {/* ============================================================== */}
      <div className="hidden print:block print:w-full print:max-w-none print:m-0 print:p-4 mx-auto bg-white text-black text-xs leading-normal">
        {/* HEADER BẢN IN */}
        <div className="border-b-2 border-black pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-bold text-sm uppercase">CÔNG TY TNHH VẬN TẢI TAM NGUYEN THANH</div>
              <div className="text-[10px] text-slate-700">PHÒNG ĐIỀU ĐỘ & ĐIỀU HÀNH VẬN TẢI HÀNH KHÁCH</div>
              <div className="text-[9px] text-slate-600">Hotline điều độ: 1900 8886 | Website: tamnguyenthanh.vn</div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-sm">{currentTrip.tripCode}</div>
              <div className="text-[10px]">Ngày in: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}</div>
            </div>
          </div>

          <div className="text-center my-2">
            <h1 className="text-lg font-black uppercase tracking-wider">
              LỆNH XUẤT BẾN & SƠ ĐỒ ĐÓN TRẢ HÀNH KHÁCH
            </h1>
            <p className="text-[10px] italic">Áp dụng cho Tổ lái xe và Tiếp viên làm thủ tục xuất bến</p>
          </div>

          {/* KHUNG THÔNG TIN CHUYẾN XE */}
          <div className="border border-black p-2 mt-2 grid grid-cols-4 gap-2 text-[11px]">
            <div>
              <span className="font-bold">Tuyến đường:</span> {currentTrip.route}
            </div>
            <div>
              <span className="font-bold">Biển số xe:</span> <span className="font-mono font-bold">{currentTrip.plateNumber}</span>
            </div>
            <div>
              <span className="font-bold">Giờ xuất bến:</span> <span className="font-bold">{currentTrip.departureTime}</span>
            </div>
            <div>
              <span className="font-bold">Ngày chạy:</span> {currentTrip.departureDate}
            </div>
            <div>
              <span className="font-bold">Tài xế chính:</span> {currentTrip.driverName} ({currentTrip.driverPhone})
            </div>
            <div>
              <span className="font-bold">Phụ xe:</span> {currentTrip.assistantName} ({currentTrip.assistantPhone})
            </div>
            <div>
              <span className="font-bold">Lấp đầy:</span> {seatStats.booked}/{seatStats.total} giường (Trống: {seatStats.available})
            </div>
            <div>
              <span className="font-bold">Tiền mặt thu xe:</span> <span className="font-bold">{formatVND(seatStats.cashToCollect)}</span>
            </div>
          </div>
        </div>

        {/* BẢN VẼ SƠ ĐỒ 2 TẦNG NẰM CẠNH NHAU TRÊN BẢN IN */}
        <div className="mb-6">
          <div className="font-bold text-center text-xs uppercase mb-2">
            SƠ ĐỒ BỐ TRÍ {isLimousine ? 'CABIN VIP' : 'GIƯỜNG NẰM'} THỰC TẾ (ĐẦU XE ➔ ĐUÔI XE)
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* TẦNG 1 */}
            <div className="border-2 border-black p-2 rounded-lg">
              <div className="font-bold text-center border-b border-black pb-1 mb-2">
                {floor1Title}
              </div>
              {isLimousine ? (
                // SƠ ĐỒ 2 CỘT CHO XE LIMOUSINE VIP CABIN (TẦNG 1)
                <div>
                  <div className="grid grid-cols-2 text-center font-bold text-[9px] mb-1 pb-1 border-b border-dashed border-black">
                    <span>DÃY TRÁI (BÊN TÀI)</span>
                    <span>DÃY PHẢI (BÊN PHỤ)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-center">
                    {(() => {
                      const leftCabins = seatsFloor1
                        .filter((s) => s.col === 1 || parseInt(s.seatCode.replace(/\D/g, ''), 10) % 2 === 1)
                        .sort((a, b) => a.seatCode.localeCompare(b.seatCode));
                      const rightCabins = seatsFloor1
                        .filter((s) => s.col === 3 || parseInt(s.seatCode.replace(/\D/g, ''), 10) % 2 === 0)
                        .sort((a, b) => a.seatCode.localeCompare(b.seatCode));
                      const totalPairs = Math.max(leftCabins.length, rightCabins.length);
                      const cells = [];
                      for (let i = 0; i < totalPairs; i++) {
                        const sL = leftCabins[i];
                        const sR = rightCabins[i];

                        cells.push(
                          sL ? (
                            <div
                              key={sL.id}
                              className={`border-2 border-black p-1 text-[9px] min-h-[50px] rounded flex flex-col justify-between ${
                                sL.status === 'BOOKED' ? 'bg-slate-100 font-bold' : 'bg-white'
                              }`}
                            >
                              <div className="font-bold font-mono text-[10px] text-left">{sL.seatCode} (Cabin VIP)</div>
                              {sL.status === 'BOOKED' ? (
                                <>
                                  <div className="truncate font-black text-left">{sL.customerName}</div>
                                  <div className="text-[8px] text-slate-700 font-mono text-left">
                                    {sL.customerPhone ? sL.customerPhone.slice(-4) : ''} - {sL.pickupPoint ? sL.pickupPoint.slice(0, 12) : ''}
                                  </div>
                                </>
                              ) : (
                                <div className="text-[8px] text-slate-400 italic text-center py-1">Trống (viết tay)</div>
                              )}
                            </div>
                          ) : (
                            <div key={`empty_l_${i}`} className="border border-dashed border-slate-300 p-1 text-[8px] text-slate-300 flex items-center justify-center italic">
                              -
                            </div>
                          )
                        );

                        cells.push(
                          sR ? (
                            <div
                              key={sR.id}
                              className={`border-2 border-black p-1 text-[9px] min-h-[50px] rounded flex flex-col justify-between ${
                                sR.status === 'BOOKED' ? 'bg-slate-100 font-bold' : 'bg-white'
                              }`}
                            >
                              <div className="font-bold font-mono text-[10px] text-left">{sR.seatCode} (Cabin VIP)</div>
                              {sR.status === 'BOOKED' ? (
                                <>
                                  <div className="truncate font-black text-left">{sR.customerName}</div>
                                  <div className="text-[8px] text-slate-700 font-mono text-left">
                                    {sR.customerPhone ? sR.customerPhone.slice(-4) : ''} - {sR.pickupPoint ? sR.pickupPoint.slice(0, 12) : ''}
                                  </div>
                                </>
                              ) : (
                                <div className="text-[8px] text-slate-400 italic text-center py-1">Trống (viết tay)</div>
                              )}
                            </div>
                          ) : (
                            <div key={`empty_r_${i}`} className="border border-dashed border-slate-300 p-1 text-[8px] text-slate-300 flex items-center justify-center italic">
                              -
                            </div>
                          )
                        );
                      }
                      return cells;
                    })()}
                  </div>
                </div>
              ) : (
                // SƠ ĐỒ 3 DÃY CHO XE GIƯỜNG NẰM TIÊU CHUẨN 36 CHỖ
                <div className="grid grid-cols-3 gap-1 text-center">
                  {seatsFloor1.map((s) => (
                    <div
                      key={s.id}
                      className={`border border-black p-1 text-[9px] min-h-[46px] flex flex-col justify-between ${
                        s.status === 'BOOKED' ? 'bg-slate-100 font-bold' : 'bg-white'
                      }`}
                    >
                      <div className="font-bold font-mono text-[10px]">{s.seatCode}</div>
                      {s.status === 'BOOKED' ? (
                        <>
                          <div className="truncate font-black">{s.customerName}</div>
                          <div className="text-[8px] text-slate-700 font-mono">
                            {s.customerPhone ? s.customerPhone.slice(-4) : ''} - {s.pickupPoint ? s.pickupPoint.slice(0, 10) : ''}
                          </div>
                        </>
                      ) : (
                        <div className="text-[8px] text-slate-400 italic">Trống (viết tay)</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TẦNG 2 */}
            <div className="border-2 border-black p-2 rounded-lg">
              <div className="font-bold text-center border-b border-black pb-1 mb-2">
                {floor2Title}
              </div>
              {isLimousine ? (
                // SƠ ĐỒ 2 CỘT CHO XE LIMOUSINE VIP CABIN (TẦNG 2)
                <div>
                  <div className="grid grid-cols-2 text-center font-bold text-[9px] mb-1 pb-1 border-b border-dashed border-black">
                    <span>DÃY TRÁI (BÊN TÀI)</span>
                    <span>DÃY PHẢI (BÊN PHỤ)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-center">
                    {(() => {
                      const leftCabins = seatsFloor2
                        .filter((s) => s.col === 1 || parseInt(s.seatCode.replace(/\D/g, ''), 10) % 2 === 1)
                        .sort((a, b) => a.seatCode.localeCompare(b.seatCode));
                      const rightCabins = seatsFloor2
                        .filter((s) => s.col === 3 || parseInt(s.seatCode.replace(/\D/g, ''), 10) % 2 === 0)
                        .sort((a, b) => a.seatCode.localeCompare(b.seatCode));
                      const totalPairs = Math.max(leftCabins.length, rightCabins.length);
                      const cells = [];
                      for (let i = 0; i < totalPairs; i++) {
                        const sL = leftCabins[i];
                        const sR = rightCabins[i];

                        cells.push(
                          sL ? (
                            <div
                              key={sL.id}
                              className={`border-2 border-black p-1 text-[9px] min-h-[50px] rounded flex flex-col justify-between ${
                                sL.status === 'BOOKED' ? 'bg-slate-100 font-bold' : 'bg-white'
                              }`}
                            >
                              <div className="font-bold font-mono text-[10px] text-left">{sL.seatCode} (Cabin VIP)</div>
                              {sL.status === 'BOOKED' ? (
                                <>
                                  <div className="truncate font-black text-left">{sL.customerName}</div>
                                  <div className="text-[8px] text-slate-700 font-mono text-left">
                                    {sL.customerPhone ? sL.customerPhone.slice(-4) : ''} - {sL.pickupPoint ? sL.pickupPoint.slice(0, 12) : ''}
                                  </div>
                                </>
                              ) : (
                                <div className="text-[8px] text-slate-400 italic text-center py-1">Trống (viết tay)</div>
                              )}
                            </div>
                          ) : (
                            <div key={`empty_l_2_${i}`} className="border border-dashed border-slate-300 p-1 text-[8px] text-slate-300 flex items-center justify-center italic">
                              -
                            </div>
                          )
                        );

                        cells.push(
                          sR ? (
                            <div
                              key={sR.id}
                              className={`border-2 border-black p-1 text-[9px] min-h-[50px] rounded flex flex-col justify-between ${
                                sR.status === 'BOOKED' ? 'bg-slate-100 font-bold' : 'bg-white'
                              }`}
                            >
                              <div className="font-bold font-mono text-[10px] text-left">{sR.seatCode} (Cabin VIP)</div>
                              {sR.status === 'BOOKED' ? (
                                <>
                                  <div className="truncate font-black text-left">{sR.customerName}</div>
                                  <div className="text-[8px] text-slate-700 font-mono text-left">
                                    {sR.customerPhone ? sR.customerPhone.slice(-4) : ''} - {sR.pickupPoint ? sR.pickupPoint.slice(0, 12) : ''}
                                  </div>
                                </>
                              ) : (
                                <div className="text-[8px] text-slate-400 italic text-center py-1">Trống (viết tay)</div>
                              )}
                            </div>
                          ) : (
                            <div key={`empty_r_2_${i}`} className="border border-dashed border-slate-300 p-1 text-[8px] text-slate-300 flex items-center justify-center italic">
                              -
                            </div>
                          )
                        );
                      }
                      return cells;
                    })()}
                  </div>
                </div>
              ) : (
                // SƠ ĐỒ 3 DÃY CHO XE GIƯỜNG NẰM TIÊU CHUẨN 36 CHỖ (TẦNG 2)
                <div className="grid grid-cols-3 gap-1 text-center">
                  {seatsFloor2.map((s) => (
                    <div
                      key={s.id}
                      className={`border border-black p-1 text-[9px] min-h-[46px] flex flex-col justify-between ${
                        s.status === 'BOOKED' ? 'bg-slate-100 font-bold' : 'bg-white'
                      }`}
                    >
                      <div className="font-bold font-mono text-[10px]">{s.seatCode}</div>
                      {s.status === 'BOOKED' ? (
                        <>
                          <div className="truncate font-black">{s.customerName}</div>
                          <div className="text-[8px] text-slate-700 font-mono">
                            {s.customerPhone ? s.customerPhone.slice(-4) : ''} - {s.pickupPoint ? s.pickupPoint.slice(0, 10) : ''}
                          </div>
                        </>
                      ) : (
                        <div className="text-[8px] text-slate-400 italic">Trống (viết tay)</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BẢNG DANH SÁCH HÀNH KHÁCH THEO THỨ TỰ ĐIỂM ĐÓN (PICKUP LIST) */}
        <div className="mb-6">
          <div className="font-bold uppercase text-xs mb-1">
            DANH SÁCH ĐÓN TRẢ HÀNH KHÁCH ({bookedPassengers.length} KHÁCH)
          </div>
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-black p-1 text-center w-8">STT</th>
                <th className="border border-black p-1 text-center w-12">Số Giường</th>
                <th className="border border-black p-1 text-left">Họ và Tên</th>
                <th className="border border-black p-1 text-center w-24">Số Điện Thoại</th>
                <th className="border border-black p-1 text-left">Điểm Đón Chi Tiết</th>
                <th className="border border-black p-1 text-left">Điểm Trả</th>
                <th className="border border-black p-1 text-center w-20">Tiền Thu</th>
                <th className="border border-black p-1 text-center w-16">Ký Nhận</th>
              </tr>
            </thead>
            <tbody>
              {bookedPassengers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-black p-2 text-center italic">
                    Chưa có hành khách nào đặt chỗ trên chuyến xe này.
                  </td>
                </tr>
              ) : (
                bookedPassengers.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="border border-black p-1 text-center">{idx + 1}</td>
                    <td className="border border-black p-1 text-center font-mono font-bold">{p.seatCode}</td>
                    <td className="border border-black p-1 font-bold">{p.customerName}</td>
                    <td className="border border-black p-1 text-center font-mono">{p.customerPhone}</td>
                    <td className="border border-black p-1">{p.pickupPoint || 'VP chính'}</td>
                    <td className="border border-black p-1">{p.dropoffPoint || 'Bến xe Liên Tỉnh'}</td>
                    <td className="border border-black p-1 text-center font-bold">
                      {p.paymentStatus === 'PAID' ? 'Đã TT' : `Thu ${formatVND(p.price)}`}
                    </td>
                    <td className="border border-black p-1 text-center"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PHẦN CHỮ KÝ 3 BÊN */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs mt-6 pt-4 border-t border-black">
          <div>
            <div className="font-bold">NGƯỜI LẬP LỆNH</div>
            <div className="text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</div>
            <div className="h-16" />
            <div className="font-bold">Phòng Điều Độ TNT</div>
          </div>
          <div>
            <div className="font-bold">THỦ QUỸ THU TIỀN</div>
            <div className="text-[10px] text-slate-500">(Ký nhận tiền cước)</div>
            <div className="h-16" />
            <div className="font-bold">Kế Toán Soát Vé</div>
          </div>
          <div>
            <div className="font-bold">TÀI XẾ NHẬN LỆNH</div>
            <div className="text-[10px] text-slate-500">(Ký cam kết lái xe an toàn)</div>
            <div className="h-16" />
            <div className="font-bold">{currentTrip.driverName}</div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MODAL / DRAWER CHI TIẾT VÉ ĐÃ ĐẶT (BOTTOM SHEET TRÊN MOBILE) */}
      {/* ============================================================== */}
      {selectedBookedSeat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs print:hidden no-print">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* THANH KÉO BOTTOM SHEET CHO MOBILE */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />

            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/80 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                  {selectedBookedSeat.seatCode}
                </span>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  Chi Tiết Vé Giường {selectedBookedSeat.seatCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookedSeat(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* THÔNG TIN KHÁCH HÀNG */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">HỌ TÊN KHÁCH HÀNG</span>
                  <span className="font-black text-sm text-slate-900">
                    {selectedBookedSeat.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">SỐ ĐIỆN THOẠI</span>
                  <div className="flex items-center space-x-1.5 font-mono font-bold text-sm text-[#1B5E20]">
                    <span>{selectedBookedSeat.customerPhone}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(selectedBookedSeat.customerPhone!, selectedBookedSeat.seatCode)}
                      className="text-slate-400 hover:text-slate-700"
                      title="Sao chép"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">MÃ VÉ ĐIỆN TỬ</span>
                  <span className="font-mono font-black text-slate-800">
                    {selectedBookedSeat.bookingCode || 'TNT-QUAY-POS'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">TIỀN VÉ / THANH TOÁN</span>
                  <span className="font-black text-sm text-[#1B5E20]">
                    {formatVND(selectedBookedSeat.price)} ({selectedBookedSeat.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'})
                  </span>
                </div>
              </div>

              {/* ĐIỂM ĐÓN / TRẢ */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Điểm đón: </span>
                    <span>{selectedBookedSeat.pickupPoint || 'Bến xe Miền Đông Mới'}</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Điểm trả: </span>
                    <span>{selectedBookedSeat.dropoffPoint || 'Bến xe Liên Tỉnh Đà Lạt'}</span>
                  </div>
                </div>
              </div>

              {/* CHỨC NĂNG ĐỔI GIƯỜNG */}
              {isChangingSeat ? (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center space-x-2 font-bold text-amber-900">
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>Chọn giường trống để chuyển sang:</span>
                  </div>
                  {availableSeatCodes.length === 0 ? (
                    <p className="text-amber-800 text-[11px]">Chuyến xe hiện đã kín chỗ, không còn giường trống để đổi.</p>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <select
                        value={targetChangeSeatCode}
                        onChange={(e) => setTargetChangeSeatCode(e.target.value)}
                        className="px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">-- Chọn Giường Mới --</option>
                        {availableSeatCodes.map((code) => (
                          <option key={code} value={code}>
                            Giường {code} (Trống)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleChangeSeatConfirm}
                        disabled={!targetChangeSeatCode}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
                      >
                        Xác Nhận Đổi
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {/* CÁC NÚT THAO TÁC */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChangingSeat(!isChangingSeat)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 transition-colors"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>{isChangingSeat ? 'Đóng Đổi Giường' : 'Đổi Sang Giường Khác'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleCancelSeatBooking(selectedBookedSeat)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hủy Vé / Nhả Giường</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODAL BÁN VÉ QUẦY NHANH POS (BOTTOM SHEET TRÊN MOBILE) */}
      {/* ============================================================== */}
      {sellingSeat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs print:hidden no-print">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* THANH KÉO BOTTOM SHEET CHO MOBILE */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />

            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-[#1B5E20]" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  Bán Vé Nhanh Tại Quầy ({sellingSeat.seatCode})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSellingSeat(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePosSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ Và Tên Khách Hàng*</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phạm Minh Hiếu"
                  value={posForm.customerName}
                  onChange={(e) => setPosForm({ ...posForm, customerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại Liên Hệ*</label>
                <input
                  type="tel"
                  required
                  placeholder="VD: 0912.888.999"
                  value={posForm.customerPhone}
                  onChange={(e) => setPosForm({ ...posForm, customerPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Điểm Đón</label>
                <input
                  type="text"
                  value={posForm.pickupPoint}
                  onChange={(e) => setPosForm({ ...posForm, pickupPoint: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Điểm Trả</label>
                <input
                  type="text"
                  value={posForm.dropoffPoint}
                  onChange={(e) => setPosForm({ ...posForm, dropoffPoint: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hình Thức TT</label>
                  <select
                    value={posForm.paymentMethod}
                    onChange={(e) =>
                      setPosForm({
                        ...posForm,
                        paymentMethod: e.target.value as 'CASH' | 'VNPAY' | 'TRANSFER',
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#1B5E20] focus:outline-none"
                  >
                    <option value="CASH">Tiền Mặt (Thu trên xe/quầy)</option>
                    <option value="TRANSFER">Chuyển Khoản VietQR</option>
                    <option value="VNPAY">Cổng VNPAY</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá Vé</label>
                  <div className="py-2 px-3 bg-emerald-50 rounded-xl font-black text-sm text-[#1B5E20] border border-emerald-200">
                    {formatVND(sellingSeat.price)}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleToggleLockSeat(sellingSeat)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold text-[11px]"
                >
                  🔒 Khóa Kỹ Thuật
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSellingSeat(null)}
                    className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white font-bold text-xs shadow-md shadow-emerald-900/10 hover:shadow-lg transition-all"
                  >
                    Xác Nhận Xuất Vé
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSeatsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-bold text-slate-400">
          Đang tải khoang xe điều hành...
        </div>
      }
    >
      <AdminSeatManagementInner />
    </Suspense>
  );
}
