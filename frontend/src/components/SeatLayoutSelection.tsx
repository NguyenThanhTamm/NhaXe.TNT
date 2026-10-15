'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Check,
  X,
  Clock,
  ChevronRight,
  AlertCircle,
  Crown,
  Sparkles,
  Info,
} from 'lucide-react';

export type SeatStatus = 'AVAILABLE' | 'SELECTED' | 'HOLDING' | 'BOOKED';
export type FloorType = 1 | 2; // 1: Tầng Dưới, 2: Tầng Trên

export interface BedSeat {
  id: string;
  seatCode: string;
  floor: FloorType;
  row: number; // 1 -> 6
  col: number; // 1: Dãy Trái, 2: Dãy Giữa, 3: Dãy Phải
  status: SeatStatus;
  price: number;
}

export interface SeatLayoutSelectionProps {
  tripCode?: string;
  routeName?: string;
  departureTime?: string;
  unitPrice?: number;
  busType?: 'GIUONG_NAM_36' | 'LIMOUSINE_22' | string;
  initialSeats?: BedSeat[];
  maxSelectableSeats?: number;
  onProceed?: (selectedSeats: BedSeat[], totalAmount: number) => void;
}

export const SeatLayoutSelection: React.FC<SeatLayoutSelectionProps> = ({
  tripCode = 'TNT-2200',
  routeName = 'Bến xe Miền Tây ➔ Bến xe Đà Lạt',
  departureTime = '22:00 • Hôm nay',
  unitPrice = 310000,
  busType = 'GIUONG_NAM_36',
  initialSeats,
  maxSelectableSeats = 5,
  onProceed,
}) => {
  const isLimousine = busType.toUpperCase().includes('LIMOUSINE') || busType === 'LIMOUSINE_22';
  
  // State quản lý tầng đang hiển thị (1: Tầng Dưới, 2: Tầng Trên)
  const [activeTabFloor, setActiveTabFloor] = useState<FloorType>(1);

  // Khởi tạo danh sách giường theo loại xe (hoặc dùng initialSeats nếu được truyền)
  const [seats, setSeats] = useState<BedSeat[]>(() => {
    if (initialSeats && initialSeats.length > 0) {
      return initialSeats;
    }
    const list: BedSeat[] = [];

    if (isLimousine) {
      // Limousine VIP 22 Cabin: Tầng 1 (VIP01-VIP11), Tầng 2 (VIP12-VIP22)
      // Tầng 1
      for (let i = 1; i <= 11; i++) {
        const code = `VIP${i < 10 ? '0' + i : i}`;
        const row = Math.ceil(i / 2);
        const col = i % 2 !== 0 ? 1 : 3;
        let status: SeatStatus = 'AVAILABLE';
        if (code === 'VIP02' || code === 'VIP07') status = 'BOOKED';
        if (code === 'VIP05') status = 'HOLDING';

        list.push({
          id: `limo_${code}`,
          seatCode: code,
          floor: 1,
          row,
          col,
          status,
          price: unitPrice,
        });
      }

      // Tầng 2
      for (let i = 12; i <= 22; i++) {
        const code = `VIP${i}`;
        const relativeIdx = i - 11;
        const row = Math.ceil(relativeIdx / 2);
        const col = relativeIdx % 2 !== 0 ? 1 : 3;
        let status: SeatStatus = 'AVAILABLE';
        if (code === 'VIP14' || code === 'VIP19') status = 'BOOKED';
        if (code === 'VIP16') status = 'HOLDING';

        list.push({
          id: `limo_${code}`,
          seatCode: code,
          floor: 2,
          row,
          col,
          status,
          price: unitPrice,
        });
      }
    } else {
      // Giường Nằm Tiêu Chuẩn 36 Chỗ (Tầng 1: A01-A18, Tầng 2: B01-B18)
      // Tầng 1 (Dãy A)
      for (let r = 1; r <= 6; r++) {
        for (let c = 1; c <= 3; c++) {
          const num = (r - 1) * 3 + c;
          const code = `A${num < 10 ? '0' + num : num}`;
          let status: SeatStatus = 'AVAILABLE';
          if (code === 'A02' || code === 'A06' || code === 'A11') status = 'BOOKED';
          if (code === 'A04') status = 'HOLDING';

          list.push({
            id: `bed_${code}`,
            seatCode: code,
            floor: 1,
            row: r,
            col: c,
            status,
            price: unitPrice,
          });
        }
      }

      // Tầng 2 (Dãy B)
      for (let r = 1; r <= 6; r++) {
        for (let c = 1; c <= 3; c++) {
          const num = (r - 1) * 3 + c;
          const code = `B${num < 10 ? '0' + num : num}`;
          let status: SeatStatus = 'AVAILABLE';
          if (code === 'B01' || code === 'B09' || code === 'B15') status = 'BOOKED';
          if (code === 'B05') status = 'HOLDING';

          list.push({
            id: `bed_${code}`,
            seatCode: code,
            floor: 2,
            row: r,
            col: c,
            status,
            price: unitPrice,
          });
        }
      }
    }

    return list;
  });

  // Đồng bộ khi prop initialSeats thay đổi (ví dụ khi khách chọn chuyến xe khác)
  useEffect(() => {
    if (initialSeats && initialSeats.length > 0) {
      setSeats(initialSeats);
      setSelectedSeatIds([]); // Reset ghế đang chọn khi đổi chuyến
    }
  }, [initialSeats]);

  // State lưu id các ghế đang chọn (chung cho cả 2 tầng, không bị mất khi chuyển tab)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleToggleSeat = (seat: BedSeat) => {
    if (seat.status === 'BOOKED') {
      showToast(`Giường ${seat.seatCode} đã được khách khác mua trước đó.`);
      return;
    }
    if (seat.status === 'HOLDING') {
      showToast(`Giường ${seat.seatCode} đang trong phiên giữ chỗ 10 phút của khách khác.`);
      return;
    }

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= maxSelectableSeats) {
        showToast(`Bạn chỉ được chọn tối đa ${maxSelectableSeats} giường trong một lần đặt.`);
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  const selectedSeats = useMemo(
    () => seats.filter((s) => selectedSeatIds.includes(s.id)),
    [seats, selectedSeatIds],
  );

  const totalAmount = useMemo(
    () => selectedSeats.reduce((acc, curr) => acc + curr.price, 0),
    [selectedSeats],
  );

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Lọc giường theo từng tầng
  const floor1Seats = useMemo(() => seats.filter((s) => s.floor === 1), [seats]);
  const floor2Seats = useMemo(() => seats.filter((s) => s.floor === 2), [seats]);

  // Đếm số ghế đang chọn ở từng tầng để hiển thị badge số lượng trên từng Tab
  const countFloor1Selected = useMemo(
    () => selectedSeats.filter((s) => s.floor === 1).length,
    [selectedSeats],
  );
  const countFloor2Selected = useMemo(
    () => selectedSeats.filter((s) => s.floor === 2).length,
    [selectedSeats],
  );

  // Helper render bảng giường cho 1 tầng duy nhất đang active
  const renderFloorLayout = (floorNum: FloorType, floorSeats: BedSeat[]) => {
    return (
      <div className="w-full max-w-[460px] mx-auto bg-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-slate-200/50 border border-slate-200/90 relative">
        {/* ĐẦU XE & ĐỊNH HƯỚNG KHOANG XE */}
        <div className="bg-gradient-to-b from-slate-100 to-slate-50 border border-slate-200 rounded-2xl p-3 mb-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            {/* Ghế tài xế & Vô lăng */}
            <div className="flex items-center space-x-1.5 text-slate-700 bg-white/80 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-slate-200/70 shadow-2xs">
              <svg
                className="w-4 h-4 text-slate-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="9" />
                <line x1="4.93" y1="19.07" x2="9.88" y2="14.12" />
                <line x1="19.07" y1="19.07" x2="14.12" y2="14.12" />
              </svg>
              <span className="font-bold text-[11px]">Bác tài</span>
            </div>

            {/* Mũi tên hướng xe chạy */}
            <div className="flex items-center space-x-1 text-slate-400 font-semibold text-[11px] tracking-wide uppercase">
              <span className="text-[#2E7D32] animate-pulse">▲</span>
              <span>Đầu xe</span>
            </div>

            {/* Cửa lên xuống */}
            <div className="flex items-center space-x-1.5 text-emerald-800 bg-emerald-50/90 px-2.5 py-1.5 rounded-xl border border-emerald-200/70 shadow-2xs">
              <svg
                className="w-4 h-4 text-[#2E7D32]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
                <path d="M2 20h20" />
                <path d="M14 12v.01" />
              </svg>
              <span className="font-black text-[11px]">Cửa lên</span>
            </div>
          </div>
        </div>

        {/* TIÊU ĐỀ CÁC DÃY / LỐI ĐI */}
        {isLimousine ? (
          <div className="grid grid-cols-3 text-center text-xs font-bold text-slate-500 mb-2 px-1">
            <span>Dãy Trái</span>
            <span className="text-[11px] text-slate-400 font-medium">Lối đi</span>
            <span>Dãy Phải</span>
          </div>
        ) : (
          <div className="grid grid-cols-5 text-center text-xs font-bold text-slate-500 mb-2 px-1">
            <span>Dãy Trái</span>
            <span className="text-[10px] text-slate-300 font-medium">Lối đi</span>
            <span>Dãy Giữa</span>
            <span className="text-[10px] text-slate-300 font-medium">Lối đi</span>
            <span>Dãy Phải</span>
          </div>
        )}

        {/* DANH SÁCH HÀNG GIƯỜNG NẰM */}
        <div className="space-y-2.5">
          {isLimousine ? (
            // CẤU HÌNH LIMOUSINE 22 PHÒNG
            [1, 2, 3, 4, 5, 6].map((rowIdx) => {
              const leftBed = floorSeats.find((s) => s.row === rowIdx && s.col === 1);
              const rightBed = floorSeats.find((s) => s.row === rowIdx && s.col === 3);

              if (!leftBed && !rightBed) return null;

              return (
                <div key={`limo_f${floorNum}_r${rowIdx}`} className="grid grid-cols-3 items-center gap-2.5">
                  <div className="col-span-1">
                    {leftBed && renderBedButton(leftBed, selectedSeatIds.includes(leftBed.id), handleToggleSeat, true)}
                  </div>

                  <div className="col-span-1 flex items-center justify-center">
                    <div className="w-[1px] h-10 border-r border-dashed border-slate-300" />
                  </div>

                  <div className="col-span-1">
                    {rightBed && renderBedButton(rightBed, selectedSeatIds.includes(rightBed.id), handleToggleSeat, true)}
                  </div>
                </div>
              );
            })
          ) : (
            // CẤU HÌNH TIÊU CHUẨN 36 CHỖ
            [1, 2, 3, 4, 5, 6].map((rowIdx) => {
              const leftBed = floorSeats.find((s) => s.row === rowIdx && s.col === 1);
              const centerBed = floorSeats.find((s) => s.row === rowIdx && s.col === 2);
              const rightBed = floorSeats.find((s) => s.row === rowIdx && s.col === 3);

              return (
                <div key={`bed_f${floorNum}_r${rowIdx}`} className="grid grid-cols-5 items-center gap-1.5 sm:gap-2">
                  <div className="col-span-1">
                    {leftBed && renderBedButton(leftBed, selectedSeatIds.includes(leftBed.id), handleToggleSeat, false)}
                  </div>

                  <div className="col-span-1 flex items-center justify-center">
                    <div className="w-[1px] h-9 border-r border-dashed border-slate-200" />
                  </div>

                  <div className="col-span-1">
                    {centerBed && renderBedButton(centerBed, selectedSeatIds.includes(centerBed.id), handleToggleSeat, false)}
                  </div>

                  <div className="col-span-1 flex items-center justify-center">
                    <div className="w-[1px] h-9 border-r border-dashed border-slate-200" />
                  </div>

                  <div className="col-span-1">
                    {rightBed && renderBedButton(rightBed, selectedSeatIds.includes(rightBed.id), handleToggleSeat, false)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ĐUÔI XE */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-400 font-medium">
          <span className="w-8 h-[2px] bg-slate-200 rounded-full" />
          <span>Cuối khoang xe • {floorNum === 1 ? 'Tầng 1' : 'Tầng 2'}</span>
          <span className="w-8 h-[2px] bg-slate-200 rounded-full" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-32">
      {/* Toast thông báo lỗi phản hồi tức thì */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER XE & THÔNG TIN CHUYẾN */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-[#2E7D32] flex items-center justify-center font-bold shrink-0">
            {isLimousine ? <Crown className="w-6 h-6 text-amber-600" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm sm:text-base font-black text-slate-900 tracking-wide">
                {isLimousine ? 'Limousine VIP 22 Phòng Riêng' : 'Giường Nằm Tiêu Chuẩn 36 Chỗ'}
              </span>
              <span className="text-xs bg-green-100 text-[#1B5E20] font-black px-2 py-0.5 rounded-lg">
                Mã {tripCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{routeName} • {departureTime}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Đơn giá vé</span>
            <span className="text-base sm:text-lg font-black text-[#1B5E20]">{formatVND(unitPrice)}</span>
          </div>

          <div className="bg-green-100/70 border border-green-300 text-[#1B5E20] px-3 py-1.5 rounded-2xl text-xs font-black">
            Tối đa {maxSelectableSeats} giường
          </div>
        </div>
      </div>

      {/* 2. CHÚ THÍCH TRẠNG THÁI GIƯỜNG (LEGEND) */}
      <div className="bg-white px-4 py-2.5 rounded-2xl shadow-xs border border-slate-200/80 mb-4 flex flex-wrap items-center justify-center sm:justify-between gap-3 text-xs max-w-xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded-md bg-white border-2 border-[#2E7D32]" />
          <span className="text-slate-700 font-bold text-xs">Giường trống</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded-md bg-[#2E7D32] flex items-center justify-center text-white">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </span>
          <span className="text-slate-900 font-black text-xs text-[#2E7D32]">Đang chọn ({selectedSeats.length}/{maxSelectableSeats})</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded-md bg-[#FFF3E0] border border-orange-400" />
          <span className="text-slate-700 font-medium text-xs">Giữ chỗ 10p</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded-md bg-[#E0E0E0] flex items-center justify-center text-slate-500">
            <X className="w-2.5 h-2.5 stroke-[2.5]" />
          </span>
          <span className="text-slate-500 font-medium text-xs">Đã bán</span>
        </div>
      </div>

      {/* 3. THANH TAB SWITCHER CHUYỂN TẦNG (TẦNG DƯỚI / TẦNG TRÊN) */}
      <div className="w-full max-w-[460px] mx-auto mb-3">
        <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center gap-1.5 border border-slate-200/80 shadow-inner">
          {/* NÚT TAB TẦNG DƯỚI */}
          <button
            type="button"
            onClick={() => setActiveTabFloor(1)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-1.5 ${
              activeTabFloor === 1
                ? 'bg-[#2E7D32] text-white shadow-md shadow-green-900/20'
                : 'bg-[#F3F4F6] text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <span>
              {isLimousine ? 'Tầng Dưới (VIP01 - VIP11)' : 'Tầng Dưới (Tầng 1 - Dãy A)'}
            </span>
            {countFloor1Selected > 0 && (
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full transition-colors ${
                  activeTabFloor === 1
                    ? 'bg-white text-[#2E7D32]'
                    : 'bg-[#2E7D32] text-white'
                }`}
              >
                {countFloor1Selected}
              </span>
            )}
          </button>

          {/* NÚT TAB TẦNG TRÊN */}
          <button
            type="button"
            onClick={() => setActiveTabFloor(2)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-1.5 ${
              activeTabFloor === 2
                ? 'bg-[#2E7D32] text-white shadow-md shadow-green-900/20'
                : 'bg-[#F3F4F6] text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <span>
              {isLimousine ? 'Tầng Trên (VIP12 - VIP22)' : 'Tầng Trên (Tầng 2 - Dãy B)'}
            </span>
            {countFloor2Selected > 0 && (
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full transition-colors ${
                  activeTabFloor === 2
                    ? 'bg-white text-[#2E7D32]'
                    : 'bg-[#2E7D32] text-white'
                }`}
              >
                {countFloor2Selected}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4. SƠ ĐỒ GHẾ CỦA TẦNG ĐANG CHỌN (CĂN GIỮA MÀN HÌNH) */}
      <div className="w-full flex justify-center">
        {activeTabFloor === 1
          ? renderFloorLayout(1, floor1Seats)
          : renderFloorLayout(2, floor2Seats)}
      </div>

      {/* 5. THANH TỔNG TIỀN VÀ TIẾP TỤC DƯỚI CÙNG (FIXED BOTTOM BAR) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-bold shrink-0">Giường đã chọn:</span>
              <span className="text-xs sm:text-sm font-black text-[#2E7D32] truncate">
                {selectedSeats.length > 0
                  ? `${selectedSeats.map((s) => s.seatCode).join(', ')} (${selectedSeats.length}/${maxSelectableSeats} giường)`
                  : 'Chưa chọn giường nào (Hãy nhấp vào giường để chọn)'}
              </span>
            </div>

            <div className="flex items-baseline space-x-2 mt-0.5">
              {selectedSeats.length > 0 ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    {selectedSeats.length} vé × {formatVND(unitPrice)} =
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#1B5E20] leading-tight">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">
                  Nhấp vào sơ đồ trên để chọn tối đa {maxSelectableSeats} giường
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={selectedSeats.length === 0}
            onClick={() => onProceed && onProceed(selectedSeats, totalAmount)}
            className={`px-6 sm:px-8 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 flex items-center justify-center space-x-2 shrink-0 ${
              selectedSeats.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] hover:from-[#1B5E20] hover:to-[#2E7D32] text-white shadow-lg shadow-green-900/20 hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            <span>Tiếp Tục Đặt Vé</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Render nút từng giường với kích thước & padding gọn gàng
const renderBedButton = (
  seat: BedSeat,
  isSelected: boolean,
  onToggle: (seat: BedSeat) => void,
  isLimo: boolean = false,
) => {
  let containerStyle = '';
  let pillowColor = 'bg-slate-300';
  let badgeIcon = null;

  if (seat.status === 'BOOKED') {
    containerStyle = 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60';
    pillowColor = 'bg-slate-300';
    badgeIcon = <X className="w-3.5 h-3.5 text-slate-400" />;
  } else if (seat.status === 'HOLDING') {
    containerStyle = 'bg-amber-50 border border-amber-300 text-amber-700 cursor-not-allowed';
    pillowColor = 'bg-amber-300';
    badgeIcon = <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />;
  } else if (isSelected) {
    containerStyle =
      'bg-gradient-to-b from-[#2E7D32] to-[#1B5E20] border-2 border-emerald-400 text-white shadow-md transform scale-[1.02] cursor-pointer';
    pillowColor = 'bg-amber-300';
    badgeIcon = <Check className="w-3.5 h-3.5 text-white stroke-[3]" />;
  } else {
    // AVAILABLE
    containerStyle =
      'bg-white border-2 border-[#2E7D32]/80 text-[#1B5E20] hover:border-[#2E7D32] hover:bg-green-50/70 shadow-2xs cursor-pointer';
    pillowColor = 'bg-green-200';
  }

  // Tối ưu chiều cao ô giường gọn gàng (h-16 cho xe 36 chỗ, h-20 cho xe Limo)
  const heightClass = isLimo ? 'h-20 sm:h-22' : 'h-16 sm:h-18';

  return (
    <button
      key={seat.id}
      type="button"
      onClick={() => onToggle(seat)}
      disabled={seat.status === 'BOOKED' || seat.status === 'HOLDING'}
      className={`w-full ${heightClass} rounded-2xl flex flex-col items-center justify-between py-1.5 px-1 sm:p-2 transition-all duration-150 ${containerStyle}`}
    >
      {/* Gối nằm đầu giường thu gọn */}
      <div className={`w-7 h-1.5 rounded-full ${pillowColor} transition-colors`} />

      {/* Mã số giường (A01, B01 hoặc VIP01) */}
      <span className="font-black text-xs sm:text-sm tracking-tight leading-none">
        {seat.seatCode}
      </span>

      {/* Trạng thái icon hoặc nhãn */}
      <div className="h-3 flex items-center justify-center">
        {badgeIcon ? (
          badgeIcon
        ) : (
          <span className={`text-[9px] sm:text-[10px] font-bold ${isSelected ? 'text-green-100' : 'text-slate-400'}`}>
            {isLimo ? 'VIP' : 'Trống'}
          </span>
        )}
      </div>
    </button>
  );
};

export default SeatLayoutSelection;
