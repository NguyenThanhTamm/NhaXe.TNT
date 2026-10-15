'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Armchair,
  Ticket,
  Bus,
  Users,
  Settings,
  Bell,
  Search,
  LogOut,
  Clock,
  User,
  ShieldCheck,
  ChevronDown,
  ExternalLink,
  PlusCircle,
  Menu,
  X,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import {
  getCurrentUser,
  logoutUser,
  UserAccount,
  UserRole,
  ROLE_LABELS,
  subscribeBookingStore,
  getCurrentShift,
  isSupabaseConfigured,
} from '@/services/bookingStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | null;
  allowedRoles: UserRole[];
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentShift, setCurrentShift] = useState('Ca Sáng (06:00 - 14:00)');

  // DANH SÁCH MENU THEO PHÂN QUYỀN RBAC
  const navItems: NavItem[] = [
    {
      label: 'Tổng Quan',
      href: '/admin',
      icon: LayoutDashboard,
      badge: null,
      allowedRoles: ['SUPER_ADMIN', 'DISPATCHER'],
    },
    {
      label: 'Điều Phối Ca & Ghế POS',
      href: '/admin/seats',
      icon: Armchair,
      badge: 'Live',
      allowedRoles: ['SUPER_ADMIN', 'DISPATCHER', 'TICKET_CLERK'],
    },
    {
      label: 'Quản Lý Chuyến Xe',
      href: '/admin/trips',
      icon: CalendarDays,
      badge: '8 Chạy',
      allowedRoles: ['SUPER_ADMIN', 'DISPATCHER'],
    },
    {
      label: 'Quản Lý Vé & Khách',
      href: '/admin/bookings',
      icon: Ticket,
      badge: null,
      allowedRoles: ['SUPER_ADMIN', 'DISPATCHER', 'TICKET_CLERK'],
    },
    {
      label: 'Đội Xe & Tài Xế',
      href: '/admin/fleet',
      icon: Bus,
      badge: null,
      allowedRoles: ['SUPER_ADMIN', 'DISPATCHER'],
    },
    {
      label: 'Quản Lý Nhân Sự & RBAC',
      href: '/admin/users',
      icon: Users,
      badge: 'Admin',
      allowedRoles: ['SUPER_ADMIN'],
    },
  ];

  // ROUTE GUARD & AUTHENTICATION CHECK
  useEffect(() => {
    // Nếu là trang login, không cần check auth
    if (pathname === '/admin/login') {
      setAuthChecked(true);
      return;
    }

    const checkSession = () => {
      const user = getCurrentUser();
      if (!user || user.status === 'LOCKED') {
        setCurrentUser(null);
        setAuthChecked(true);
        router.replace('/admin/login');
      } else {
        setCurrentUser(user);
        setAuthChecked(true);

        // Nếu Ticket Clerk vào /admin gốc, tự động điều hướng sang trang bán vé POS
        if (user.role === 'TICKET_CLERK' && pathname === '/admin') {
          router.replace('/admin/seats');
        }
      }
    };

    checkSession();
    const unsubscribe = subscribeBookingStore(checkSession);
    return () => unsubscribe();
  }, [pathname, router]);

  // Tự động nhận diện ca làm việc
  useEffect(() => {
    const shift = getCurrentShift();
    if (shift === 'MORNING') setCurrentShift('Ca Sáng (06:00 - 14:00)');
    else if (shift === 'AFTERNOON') setCurrentShift('Ca Chiều (14:00 - 22:00)');
    else setCurrentShift('Ca Đêm (22:00 - 06:00)');
  }, []);

  // Đóng Drawer khi thay đổi route
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Xử lý Đăng xuất
  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn kết thúc ca và đăng xuất khỏi hệ thống?')) {
      logoutUser();
      router.replace('/admin/login');
    }
  };

  // NẾU LÀ TRANG LOGIN: RENDER NGUYÊN BẢN KHÔNG CÓ SIDEBAR/HEADER
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // ĐANG KIỂM TRA PHIÊN LÀM VIỆC
  if (!authChecked || !currentUser) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0F2413] text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center shadow-xl border border-emerald-400/30 animate-pulse mb-4">
          <Bus className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-bold text-emerald-300">Đang kiểm tra bảo mật phiên làm việc...</p>
        <span className="text-xs text-emerald-500/70 mt-1">Hệ thống TMS Nhà Xe Tam Nguyen Thanh</span>
      </div>
    );
  }

  // LỌC MENU DỰA TRÊN ROLE CỦA USER ĐANG ĐĂNG NHẬP
  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(currentUser.role)
  );

  const roleMeta = ROLE_LABELS[currentUser.role] || ROLE_LABELS.SUPER_ADMIN;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-gray-50 text-slate-800 print:h-auto print:w-auto print:overflow-visible print:block print:bg-white">
      {/* ========================================================= */}
      {/* 1. MOBILE TOP BAR CỐ ĐỊNH (md:hidden)                      */}
      {/* ========================================================= */}
      <header className="md:hidden h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0 sticky top-0 z-40 print:hidden select-none">
        {/* Nút Hamburger Menu bên trái */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
          aria-label="Mở menu quản trị"
        >
          <Menu className="w-5 h-5 text-slate-800" />
        </button>

        {/* Logo thương hiệu ở giữa */}
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center text-white shadow-xs">
            <Bus className="w-4 h-4" />
          </div>
          <span className="font-mono font-black text-xs uppercase tracking-tight text-[#1B5E20]">
            TAM NGUYEN THANH
          </span>
        </div>

        {/* Avatar / Ca chạy bên phải */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1B5E20] font-black text-xs flex items-center justify-center"
          >
            {currentUser.name
              .split(' ')
              .slice(-1)[0][0]
              .toUpperCase()}
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. DRAWER SIDEBAR TRÊN MOBILE (SLIDE-OVER SHEET)          */}
      {/* ========================================================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex select-none print:hidden">
          {/* Lớp phủ mờ nền đen (Backdrop) */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Khung Drawer trượt từ cạnh trái */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-300">
            {/* Header Drawer */}
            <div>
              <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1B5E20] flex items-center justify-center text-white shadow-sm">
                    <Bus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-xs uppercase text-slate-900 block font-mono">
                      TAM NGUYEN THANH
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      ERP & TMS Vận Tải
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thẻ nhân viên đăng nhập */}
              <div className="p-3.5 m-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                    {currentUser.name
                      .split(' ')
                      .slice(-2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {currentUser.name}
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    </div>
                    <div className="mt-0.5">
                      <span
                        className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded border ${roleMeta.badgeClass}`}
                      >
                        {roleMeta.shortName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh sách Menu */}
              <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Phân Hệ Vận Hành
              </div>
              <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#1B5E20] text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                            isActive
                              ? 'bg-white text-[#1B5E20]'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Footer Drawer */}
            <div className="p-3 border-t border-gray-100 space-y-1.5 bg-white">
              <Link
                href="/"
                target="_blank"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                <span className="flex items-center space-x-2">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cổng Khách Đặt Vé</span>
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                  Web
                </span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                <span>Đăng xuất hệ thống</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SIDEBAR BÊN TRÁI CHO DESKTOP (hidden md:flex w-64)      */}
      {/* ========================================================= */}
      <aside className="hidden md:flex w-64 h-full flex-col justify-between shrink-0 border-r border-gray-200 bg-white select-none shadow-xs z-20 print:hidden">
        {/* KHU VỰC TRÊN: LOGO + USER BADGE + NAV */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* 1. LOGO & THƯƠNG HIỆU */}
          <div className="h-16 shrink-0 border-b border-gray-200 px-5 flex items-center space-x-3 bg-white">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center shadow-md border border-emerald-500/30 shrink-0">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1">
                <span className="font-black text-xs tracking-tight text-slate-900 uppercase truncate">
                  Tam Nguyen Thanh
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block">
                TMS & ERP Vận Tải
              </span>
            </div>
          </div>

          {/* 2. THẺ PROFILE NHÂN VIÊN ĐANG ĐĂNG NHẬP (RBAC CARD) */}
          <div className="p-3.5 m-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                {currentUser.name
                  .split(' ')
                  .slice(-2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.name}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <div className="mt-0.5">
                  <span
                    className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded border ${roleMeta.badgeClass}`}
                  >
                    {roleMeta.shortName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. MENU ĐIỀU HƯỚNG THEO ROLE (SCROLLABLE NẾU DÀI) */}
          <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Phân Hệ Vận Hành
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group ${
                    isActive
                      ? 'bg-[#1B5E20] text-white shadow-sm border border-emerald-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-700'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                        isActive
                          ? 'bg-white text-[#1B5E20]'
                          : item.badge === 'Live'
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* KHU VỰC DƯỚI: TRANG KHÁCH & NÚT ĐĂNG XUẤT */}
        <div className="p-3 border-t border-gray-200 space-y-1.5 bg-white">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <span className="flex items-center space-x-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Cổng Khách Đặt Vé</span>
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
              Web
            </span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-red-500" />
            <span>Kết thúc ca / Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 4. KHU VỰC NỘI DUNG CHÍNH (MAIN AREA)                       */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden print:h-auto print:overflow-visible print:block print:w-full print:p-0 print:m-0">
        {/* HEADER DESKTOP (hidden md:flex) */}
        <header className="hidden md:flex h-16 shrink-0 border-b border-gray-200 bg-white px-6 items-center justify-between gap-4 z-10 print:hidden">
          {/* Ô tìm kiếm nhanh vé & khách */}
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tra nhanh mã vé (TNT-xxxx), SĐT khách..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#2E7D32] transition-colors"
            />
          </div>

          {/* Bên phải Desktop: Ca làm việc + Bán vé POS + User Menu */}
          <div className="flex items-center space-x-3">
            {/* Bộ chọn Ca làm việc */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowShiftDropdown(!showShiftDropdown)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>{currentShift}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showShiftDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                    Ca Vận Hành Trực Tiếp
                  </div>
                  {['Ca Sáng (06:00 - 14:00)', 'Ca Chiều (14:00 - 22:00)', 'Ca Đêm (22:00 - 06:00)'].map(
                    (shift) => (
                      <button
                        key={shift}
                        onClick={() => {
                          setCurrentShift(shift);
                          setShowShiftDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors ${
                          currentShift === shift
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {shift}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Trạng thái kết nối Supabase Cloud */}
            <div
              title={
                isSupabaseConfigured
                  ? 'Đã kết nối Supabase Cloud Database: Dữ liệu được đồng bộ Realtime đa thiết bị.'
                  : 'Đang chạy chế độ LocalStorage cục bộ. Cấu hình NEXT_PUBLIC_SUPABASE_URL & ANON_KEY trong .env.local hoặc Vercel để đồng bộ Cloud.'
              }
              className={`hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{isSupabaseConfigured ? 'Supabase: Đã kết nối' : 'Dữ liệu: LocalStorage'}</span>
            </div>

            {/* Quick POS button */}
            <Link
              href="/admin/seats"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] hover:from-[#1B5E20] hover:to-[#2E7D32] text-white text-xs font-bold shadow-xs transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Bán Vé Quầy (POS)</span>
            </Link>

            {/* User Dropdown Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-7 h-7 rounded-lg bg-[#1B5E20] text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name[0]}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium leading-tight">
                    {roleMeta.shortName}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                    <span
                      className={`inline-block text-[9px] font-black px-2 py-0.5 rounded mt-1.5 border ${roleMeta.badgeClass}`}
                    >
                      {roleMeta.name}
                    </span>
                  </div>

                  {currentUser.role === 'SUPER_ADMIN' && (
                    <Link
                      href="/admin/users"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Quản lý danh sách nhân sự</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Đăng xuất hệ thống</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* NỘI DUNG CHÍNH (MAIN SCROLLABLE VIEW) */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-20 md:pb-6 scroll-smooth bg-gray-50 print:p-0 print:m-0 print:w-full print:overflow-visible print:block print:bg-white">
          {children}
        </main>
      </div>

      {/* ========================================================= */}
      {/* 5. BOTTOM NAVIGATION BAR CỐ ĐỊNH TRÊN MOBILE (md:hidden)  */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-t border-gray-200 flex justify-around items-center px-1 z-30 print:hidden shadow-lg select-none">
        {/* TAB 1: TỔNG QUAN */}
        <Link
          href="/admin"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            pathname === '/admin' ? 'text-[#1B5E20]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard
            className={`w-5 h-5 ${pathname === '/admin' ? 'stroke-[2.5]' : 'stroke-2'}`}
          />
          <span className="text-[10px] font-bold mt-1">Tổng Quan</span>
        </Link>

        {/* TAB 2: ĐIỀU PHỐI GHẾ */}
        <Link
          href="/admin/seats"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            pathname.startsWith('/admin/seats') ? 'text-[#1B5E20]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Armchair
            className={`w-5 h-5 ${pathname.startsWith('/admin/seats') ? 'stroke-[2.5]' : 'stroke-2'}`}
          />
          <span className="text-[10px] font-bold mt-1">Điều Phối</span>
        </Link>

        {/* TAB 3: QUẢN LÝ VÉ */}
        <Link
          href="/admin/bookings"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            pathname.startsWith('/admin/bookings') ? 'text-[#1B5E20]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ticket
            className={`w-5 h-5 ${pathname.startsWith('/admin/bookings') ? 'stroke-[2.5]' : 'stroke-2'}`}
          />
          <span className="text-[10px] font-bold mt-1">Quản Lý Vé</span>
        </Link>

        {/* TAB 4: MENU DRAWER */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            drawerOpen ? 'text-[#1B5E20]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Menu className="w-5 h-5 stroke-2" />
          <span className="text-[10px] font-bold mt-1">Menu</span>
        </button>
      </nav>
    </div>
  );
}
