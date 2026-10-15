'use client';

import React, { useState } from 'react';
import { Search, X, CheckCircle2, AlertCircle, Phone, Calendar, Clock, MapPin, Bus } from 'lucide-react';

import { getBookings } from '@/services/bookingStore';

interface TicketLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TicketLookupModal: React.FC<TicketLookupModalProps> = ({ isOpen, onClose }) => {
  const [lookupCode, setLookupCode] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setHasSearched(true);

    const cleanCode = lookupCode.trim().toUpperCase();
    const cleanPhone = lookupPhone.trim().replace(/\D/g, '');

    if (!cleanCode && !cleanPhone) {
      setErrorMsg('Vui lòng nhập Mã vé (VD: TNT-889102) hoặc Số điện thoại đặt vé.');
      setSearchResult(null);
      return;
    }

    const allBookings = getBookings();
    const matched = allBookings.find((b) => {
      const matchCode = cleanCode && (b.bookingCode.toUpperCase() === cleanCode || b.id.toUpperCase() === cleanCode);
      const bPhoneClean = (b.customerPhone || b.phone || '').replace(/\D/g, '');
      const matchPhone = cleanPhone && bPhoneClean.length > 5 && bPhoneClean.includes(cleanPhone);
      return matchCode || matchPhone;
    });

    if (matched) {
      setSearchResult({
        code: matched.bookingCode,
        passenger: matched.customerName,
        phone: matched.customerPhone || matched.phone,
        route: matched.route,
        departureTime: `${matched.departureTime} • ${matched.departureDate}`,
        busType: matched.seats[0]?.startsWith('C') || matched.seats[0]?.startsWith('D') || matched.seats[0]?.startsWith('VIP')
          ? 'Limousine VIP 22 Phòng Riêng'
          : 'Xe Giường Nằm Tiêu Chuẩn 36 Chỗ',
        seats: matched.seats,
        pickupPoint: matched.pickupPoint,
        dropoffPoint: matched.dropoffPoint,
        totalAmount: matched.totalAmount,
        paymentStatus: matched.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN (VNPAY/VIETQR)' : 'CHỜ THANH TOÁN KHI LÊN XE',
        ticketStatus: matched.status === 'CANCELLED' ? 'ĐÃ HỦY VÉ' : 'XÁC NHẬN - CHỜ LÊN XE',
      });
    } else {
      setErrorMsg(`Không tìm thấy vé xe phù hợp với thông tin tra cứu "${cleanCode || cleanPhone}". Vui lòng kiểm tra lại mã vé hoặc SĐT.`);
      setSearchResult(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-green-100 text-[#2E7D32] flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Tra Cứu Thông Tin Vé Xe
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Mã vé điện tử (VD: TNT-88239):
            </label>
            <input
              type="text"
              placeholder="Nhập mã vé..."
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold uppercase focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Hoặc Số điện thoại người đặt:
            </label>
            <input
              type="text"
              placeholder="Nhập số điện thoại..."
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-3 rounded-xl font-black text-sm shadow-sm transition-all flex items-center justify-center space-x-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Tra cứu thông tin vé</span>
          </button>
        </form>

        {/* Result Display */}
        {hasSearched && searchResult && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-500">Mã vé:</span>
              <span className="font-mono font-black text-sm text-[#2E7D32] bg-green-100 px-2.5 py-0.5 rounded-lg">
                {searchResult.code}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="block text-[11px] text-slate-400">Tuyến đi:</span>
                <span className="font-bold text-slate-900">{searchResult.route}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400">Thời gian:</span>
                <span className="font-bold text-slate-900">{searchResult.departureTime}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400">Dòng xe:</span>
                <span className="font-bold text-slate-900">{searchResult.busType}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400">Giường đã đặt:</span>
                <span className="font-black text-[#2E7D32]">{searchResult.seats.join(', ')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1">
              <div>
                <span className="text-[11px] text-slate-400 block">Điểm đón:</span>
                <span className="font-semibold text-slate-800">{searchResult.pickupPoint}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Điểm trả:</span>
                <span className="font-semibold text-slate-800">{searchResult.dropoffPoint}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-700">Trạng thái:</span>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                ✓ {searchResult.ticketStatus}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketLookupModal;
