'use client';

import React from 'react';
import {
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  Sparkles,
  Bus,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export interface RouteCardData {
  id: string;
  fromCity: string;
  toCity: string;
  distance: string;
  duration: string;
  priceFrom: number;
  originalPrice?: number;
  busTypeInfo: string;
  highlightTag: string;
  departureFrequency: string;
  bgGradient: string;
  citySubtitle: string;
}

interface PopularRoutesSectionProps {
  onSelectRoute: (from: string, to: string) => void;
}

export const PopularRoutesSection: React.FC<PopularRoutesSectionProps> = ({ onSelectRoute }) => {
  const routes: RouteCardData[] = [
    {
      id: 'route-sg-dl',
      fromCity: 'Sài Gòn',
      toCity: 'Đà Lạt',
      citySubtitle: 'Thành phố ngàn hoa xứ sở sương mù',
      distance: '305 km',
      duration: '6h30m',
      priceFrom: 290000,
      originalPrice: 340000,
      busTypeInfo: 'Limousine 22 Phòng VIP & Giường nằm cao cấp',
      highlightTag: 'TUYẾN BÁN CHẠY NHẤT',
      departureFrequency: 'Xuất bến liên tục 30 - 60 phút/chuyến',
      bgGradient: 'from-emerald-900/90 via-green-800/80 to-teal-900/90',
    },
    {
      id: 'route-sg-nt',
      fromCity: 'Sài Gòn',
      toCity: 'Nha Trang',
      citySubtitle: 'Thiên đường biển xanh cát trắng miền duyên hải',
      distance: '430 km',
      duration: '8h00m',
      priceFrom: 310000,
      originalPrice: 370000,
      busTypeInfo: 'Xe giường nằm 36 chỗ & Limousine VIP êm ái',
      highlightTag: 'VIEW BIỂN TUYỆT ĐẸP',
      departureFrequency: 'Nhiều chuyến đêm, đến nơi sáng sớm ngắm bình minh',
      bgGradient: 'from-teal-900/90 via-emerald-800/80 to-cyan-950/90',
    },
    {
      id: 'route-sg-ct',
      fromCity: 'Sài Gòn',
      toCity: 'Cần Thơ',
      citySubtitle: 'Thủ phủ Tây Đô sông nước mến khách',
      distance: '170 km',
      duration: '3h30m',
      priceFrom: 180000,
      originalPrice: 220000,
      busTypeInfo: 'Chạy đường cao tốc Trung Lương - Mỹ Thuận',
      highlightTag: 'CAO TỐC NHANH CHÓNG',
      departureFrequency: 'Khởi hành cả ngày từ 05:00 đến 22:00',
      bgGradient: 'from-green-900/90 via-[#2E7D32]/80 to-emerald-950/90',
    },
    {
      id: 'route-dl-sg',
      fromCity: 'Đà Lạt',
      toCity: 'Sài Gòn',
      citySubtitle: 'Hành trình trở về thành phố sôi động',
      distance: '305 km',
      duration: '6h30m',
      priceFrom: 290000,
      originalPrice: 340000,
      busTypeInfo: 'Trung chuyển miễn phí tận nơi nội thành Đà Lạt',
      highlightTag: 'TRUNG CHUYỂN TẬN NƠI',
      departureFrequency: 'Chuyến đêm xuất bến 20h30, 22h00, 23h30',
      bgGradient: 'from-emerald-950/90 via-green-900/80 to-teal-900/90',
    },
  ];

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <section id="tuyen-pho-bien" className="py-16 bg-white relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 bg-green-50 text-[#1B5E20] font-bold text-xs px-3.5 py-1.5 rounded-full mb-3 border border-green-200">
            <TrendingUp className="w-3.5 h-3.5 text-[#2E7D32]" />
            <span>ĐIỂM ĐẾN ĐƯỢC YÊU THÍCH NHẤT</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Tuyến Đường Phổ Biến & Được Lựa Chọn Nhiều Nhất
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Hành trình trọn vẹn với các chuyến xe chất lượng cao, tần suất dày đặc, tài xế kinh nghiệm phục vụ mọi khung giờ.
          </p>
        </div>

        {/* Routes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {routes.map((route) => (
            <div
              key={route.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group hover:-translate-y-1.5"
            >
              {/* Visual Card Header */}
              <div
                className={`p-6 bg-gradient-to-br ${route.bgGradient} text-white relative flex flex-col justify-between min-h-[160px]`}
              >
                {/* Decorative background circle */}
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between relative z-10 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 px-2.5 py-0.5 rounded-full shadow-sm">
                    {route.highlightTag}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                    <Bus className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center space-x-2 text-xl font-black tracking-tight text-white mb-0.5">
                    <span>{route.fromCity}</span>
                    <span className="text-amber-300">⇄</span>
                    <span>{route.toCity}</span>
                  </div>
                  <p className="text-[11px] text-green-100/90 font-medium">
                    {route.citySubtitle}
                  </p>
                </div>
              </div>

              {/* Card Meta Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center space-x-1.5 text-slate-600">
                      <Compass className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span>{route.distance}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span>~{route.duration}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium flex items-start space-x-1.5">
                    <span className="text-[#2E7D32] font-black">•</span>
                    <span>{route.busTypeInfo}</span>
                  </p>

                  <p className="text-[11px] text-slate-500 flex items-start space-x-1.5">
                    <span className="text-amber-500 font-black">•</span>
                    <span>{route.departureFrequency}</span>
                  </p>
                </div>

                {/* Price and CTA Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Giá chỉ từ
                    </span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-lg font-black text-[#1B5E20]">
                        {formatVND(route.priceFrom)}
                      </span>
                      {route.originalPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatVND(route.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectRoute(route.fromCity, route.toCity)}
                    className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-sm hover:shadow-md transition-all flex items-center space-x-1 group-hover:scale-105"
                  >
                    <span>Đặt vé ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularRoutesSection;
