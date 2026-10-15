'use client';

import React, { useState } from 'react';
import { Calendar, X, Clock, MapPin, Bus, ArrowRight } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSchedule: (from: string, to: string) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSelectSchedule,
}) => {
  const [selectedRouteTab, setSelectedRouteTab] = useState<'SG-DL' | 'SG-NT' | 'SG-CT'>('SG-DL');

  if (!isOpen) return null;

  const schedules = {
    'SG-DL': {
      title: 'Sài Gòn ⇄ Đà Lạt',
      from: 'Sài Gòn',
      to: 'Đà Lạt',
      distance: '305 km • Thời gian chạy ~6h30',
      trips: [
        { time: '07:00', type: 'Giường Nằm 36 Chỗ', price: '310.000đ', pickup: 'Bến xe Miền Tây ➔ Hàng Xanh' },
        { time: '11:30', type: 'Limousine VIP 22 Phòng', price: '380.000đ', pickup: 'Bến xe Miền Tây ➔ Hàng Xanh' },
        { time: '20:30', type: 'Giường Nằm 36 Chỗ', price: '310.000đ', pickup: 'Bến xe Miền Tây ➔ Hàng Xanh' },
        { time: '22:00', type: 'Giường Nằm 36 Chỗ', price: '310.000đ', pickup: 'Bến xe Miền Tây ➔ Hàng Xanh' },
        { time: '23:30', type: 'Limousine VIP 22 Phòng', price: '380.000đ', pickup: 'Bến xe Miền Tây ➔ Hàng Xanh' },
      ],
    },
    'SG-NT': {
      title: 'Sài Gòn ⇄ Nha Trang',
      from: 'Sài Gòn',
      to: 'Nha Trang',
      distance: '430 km • Thời gian chạy ~8h00',
      trips: [
        { time: '08:00', type: 'Giường Nằm 36 Chỗ', price: '350.000đ', pickup: 'Bến xe Miền Tây ➔ Thủ Đức' },
        { time: '21:00', type: 'Limousine VIP 22 Phòng', price: '420.000đ', pickup: 'Bến xe Miền Tây ➔ Thủ Đức' },
        { time: '22:30', type: 'Giường Nằm 36 Chỗ', price: '350.000đ', pickup: 'Bến xe Miền Tây ➔ Thủ Đức' },
      ],
    },
    'SG-CT': {
      title: 'Sài Gòn ⇄ Cần Thơ',
      from: 'Sài Gòn',
      to: 'Cần Thơ',
      distance: '170 km • Thời gian chạy ~3h30',
      trips: [
        { time: '07:00', type: 'Giường Nằm 36 Chỗ', price: '180.000đ', pickup: 'Bến xe Miền Tây ➔ Cao tốc' },
        { time: '10:00', type: 'Limousine VIP 22 Phòng', price: '240.000đ', pickup: 'Bến xe Miền Tây ➔ Cao tốc' },
        { time: '13:30', type: 'Giường Nằm 36 Chỗ', price: '180.000đ', pickup: 'Bến xe Miền Tây ➔ Cao tốc' },
        { time: '16:00', type: 'Giường Nằm 36 Chỗ', price: '180.000đ', pickup: 'Bến xe Miền Tây ➔ Cao tốc' },
        { time: '19:00', type: 'Limousine VIP 22 Phòng', price: '240.000đ', pickup: 'Bến xe Miền Tây ➔ Cao tốc' },
      ],
    },
  };

  const current = schedules[selectedRouteTab];

  const handleBookNow = () => {
    onClose();
    onSelectSchedule(current.from, current.to);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-green-100 text-[#2E7D32] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Lịch Trình Xuất Bến Hàng Ngày
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

        {/* Route Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setSelectedRouteTab('SG-DL')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              selectedRouteTab === 'SG-DL'
                ? 'bg-[#2E7D32] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sài Gòn - Đà Lạt
          </button>
          <button
            type="button"
            onClick={() => setSelectedRouteTab('SG-NT')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              selectedRouteTab === 'SG-NT'
                ? 'bg-[#2E7D32] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sài Gòn - Nha Trang
          </button>
          <button
            type="button"
            onClick={() => setSelectedRouteTab('SG-CT')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              selectedRouteTab === 'SG-CT'
                ? 'bg-[#2E7D32] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sài Gòn - Cần Thơ
          </button>
        </div>

        {/* Route Info */}
        <div className="bg-green-50/70 p-3.5 rounded-2xl border border-green-200/70 flex items-center justify-between">
          <div>
            <h4 className="font-black text-sm text-[#1B5E20]">{current.title}</h4>
            <p className="text-xs text-slate-600">{current.distance}</p>
          </div>
          <button
            type="button"
            onClick={handleBookNow}
            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-black px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1"
          >
            <span>Đặt tuyến này</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timetable List */}
        <div className="space-y-2">
          {current.trips.map((trip, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 hover:bg-green-50/50 rounded-2xl border border-slate-200/80 transition-colors flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 text-center py-1 bg-white rounded-xl border border-slate-200 font-black text-sm text-[#1B5E20]">
                  {trip.time}
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">{trip.type}</span>
                  <span className="text-[11px] text-slate-500">{trip.pickup}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-sm text-[#2E7D32] block">{trip.price}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Xuất bến đúng giờ</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
