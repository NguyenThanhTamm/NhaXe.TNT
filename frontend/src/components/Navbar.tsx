'use client';

import React, { useState } from 'react';
import {
  Bus,
  Phone,
  Search,
  Calendar,
  Tag,
  Newspaper,
  ShieldCheck,
  MapPin,
  Menu,
  X,
  ChevronRight,
  Headphones,
} from 'lucide-react';

interface NavbarProps {
  onOpenLookupModal: () => void;
  onOpenScheduleModal: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLookupModal,
  onOpenScheduleModal,
  onScrollToSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    onScrollToSection(sectionId);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-green-100 shadow-sm transition-all">
      {/* Top emergency hotline bar */}
      <div className="bg-[#1B5E20] text-white text-xs py-1.5 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-green-200">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hệ thống đặt vé xe khách liên tỉnh trực tuyến 24/7</span>
            </span>
            <span className="text-white/40">|</span>
            <span className="text-emerald-100">Cam kết xuất bến đúng giờ - Đúng giá niêm yết</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={onOpenScheduleModal}
              className="text-green-100 hover:text-white flex items-center space-x-1 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Xem lịch trình xe chạy</span>
            </button>
            <span className="text-white/40">|</span>
            <a
              href="/admin"
              className="text-emerald-300 hover:text-white font-bold flex items-center space-x-1 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cổng Quản Trị (CMS)</span>
            </a>
            <span className="text-white/40">|</span>
            <a
              href="tel:19008899"
              className="text-amber-300 hover:text-amber-200 font-bold flex items-center space-x-1"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Hotline khẩn cấp: 1900 8899</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <a
            href="#"
            className="flex items-center space-x-3 group focus:outline-none shrink-0"
            aria-label="Tam Nguyen Thanh Bus Lines"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center text-white shadow-md shadow-green-900/20 group-hover:scale-105 transition-transform duration-200 border border-green-400/30 shrink-0">
              <Bus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-[#1B5E20] uppercase group-hover:text-[#2E7D32] transition-colors whitespace-nowrap">
                  Tam Nguyen Thanh
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-400/20 text-amber-800 border border-amber-400/40 px-2 py-0.5 rounded-full hidden xl:inline-block whitespace-nowrap">
                  Bus Lines
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide whitespace-nowrap hidden sm:block">
                Chất lượng là danh dự • Phục vụ tận tâm
              </p>
            </div>
          </a>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-0.5 xl:space-x-1 shrink-0">
            <button
              type="button"
              onClick={onOpenScheduleModal}
              className="px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-bold text-slate-700 hover:text-[#2E7D32] hover:bg-green-50/70 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span className="whitespace-nowrap">Lịch trình</span>
            </button>

            <button
              type="button"
              onClick={onOpenLookupModal}
              className="px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-bold text-slate-700 hover:text-[#2E7D32] hover:bg-green-50/70 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Search className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span className="whitespace-nowrap">Tra cứu vé</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('khuyen-mai')}
              className="px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-bold text-slate-700 hover:text-[#2E7D32] hover:bg-green-50/70 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Tag className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="whitespace-nowrap">Khuyến mãi</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('tuyen-pho-bien')}
              className="px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-bold text-slate-700 hover:text-[#2E7D32] hover:bg-green-50/70 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap"
            >
              <MapPin className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span className="whitespace-nowrap">Tuyến phổ biến</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('ve-chung-toi')}
              className="px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-bold text-slate-700 hover:text-[#2E7D32] hover:bg-green-50/70 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span className="whitespace-nowrap">Về chúng tôi</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('tin-tuc')}
              className="px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-bold text-slate-700 hover:text-[#2E7D32] hover:bg-green-50/70 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Newspaper className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span className="whitespace-nowrap">Tin tức</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('lien-he')}
              className="px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-bold text-slate-700 hover:text-[#2E7D32] hover:bg-green-50/70 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Headphones className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span className="whitespace-nowrap">Liên hệ</span>
            </button>
          </nav>

          {/* Action Button: Hotline */}
          <div className="hidden sm:flex items-center space-x-3 shrink-0">
            <a
              href="tel:19008899"
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] text-white px-4 py-2 rounded-2xl font-black text-sm shadow-md shadow-green-900/20 hover:shadow-lg hover:from-[#1B5E20] hover:to-[#2E7D32] transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap shrink-0"
            >
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
              </div>
              <div className="text-left whitespace-nowrap">
                <span className="block text-[10px] text-green-200 leading-none whitespace-nowrap">Hotline khẩn cấp</span>
                <span className="block text-sm font-black tracking-wide leading-tight whitespace-nowrap">1900 8899</span>
              </div>
            </a>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex lg:hidden items-center space-x-2">
            <a
              href="tel:19008899"
              className="p-2 rounded-xl bg-green-50 text-[#2E7D32] border border-green-200"
              aria-label="Gọi hotline"
            >
              <Phone className="w-5 h-5" />
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:text-[#2E7D32] hover:bg-green-50 focus:outline-none transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-20 bg-white/95 backdrop-blur-xl border-b border-green-100 shadow-2xl py-5 px-6 space-y-3 animate-in slide-in-from-top-4 duration-200 z-50">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLookupModal();
              }}
              className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-green-50 text-[#2E7D32] font-bold text-xs border border-green-200"
            >
              <Search className="w-4 h-4" />
              <span>Tra cứu vé</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenScheduleModal();
              }}
              className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200"
            >
              <Calendar className="w-4 h-4 text-[#2E7D32]" />
              <span>Lịch trình</span>
            </button>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleNavClick('booking-engine')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-green-50 text-slate-800 hover:text-[#2E7D32] font-bold text-sm transition-colors text-left"
            >
              <span className="flex items-center space-x-3">
                <Bus className="w-4 h-4 text-[#2E7D32]" />
                <span>Đặt vé xe trực tuyến</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('khuyen-mai')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-green-50 text-slate-800 hover:text-[#2E7D32] font-bold text-sm transition-colors text-left"
            >
              <span className="flex items-center space-x-3">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Chương trình khuyến mãi</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('tuyen-pho-bien')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-green-50 text-slate-800 hover:text-[#2E7D32] font-bold text-sm transition-colors text-left"
            >
              <span className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-[#2E7D32]" />
                <span>Các tuyến đường phổ biến</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('ve-chung-toi')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-green-50 text-slate-800 hover:text-[#2E7D32] font-bold text-sm transition-colors text-left"
            >
              <span className="flex items-center space-x-3">
                <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
                <span>Cam kết chất lượng</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('tin-tuc')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-green-50 text-slate-800 hover:text-[#2E7D32] font-bold text-sm transition-colors text-left"
            >
              <span className="flex items-center space-x-3">
                <Newspaper className="w-4 h-4 text-[#2E7D32]" />
                <span>Tin tức & Cẩm nang</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('lien-he')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-green-50 text-slate-800 hover:text-[#2E7D32] font-bold text-sm transition-colors text-left"
            >
              <span className="flex items-center space-x-3">
                <Headphones className="w-4 h-4 text-[#2E7D32]" />
                <span>Liên hệ văn phòng & Trạm đón</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="pt-3">
            <a
              href="tel:19008899"
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-[#2E7D32] text-white font-bold text-sm shadow-md"
            >
              <Phone className="w-4 h-4" />
              <span>Gọi Tổng Đài: 1900 8899 (24/7)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
