'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bus,
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Radio,
  Clock,
  PhoneCall,
} from 'lucide-react';
import { loginUser, getCurrentUser } from '@/services/bookingStore';

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Nếu đã có phiên đăng nhập hợp lệ, tự động chuyển hướng vào Dashboard
  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.status === 'ACTIVE') {
      router.replace('/admin');
    }
  }, [router]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập Tên tài khoản hoặc Email điều hành!');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập Mật khẩu bảo mật!');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = loginUser(username, password);
      if (res.success && res.user) {
        setSuccessMessage(`Xác thực thành công! Đang chuyển hướng vào cổng điều hành...`);
        setTimeout(() => {
          router.replace('/admin');
        }, 500);
      } else {
        setErrorMessage(res.message);
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-slate-800 font-sans selection:bg-[#1B5E20] selection:text-white">
      {/* ============================================================== */}
      {/* 1. CỘT BÊN TRÁI: BRAND SHOWCASE & VISUAL IDENTITY (52% - 55%)   */}
      {/* ============================================================== */}
      <section className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden select-none text-white bg-[#061D0C]">
        {/* ẢNH NỀN XE KHÁCH LIMOUSINE CAO CẤP */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />

        {/* LỚP PHỦ GRADIENT NHẬN DIỆN THƯƠNG HIỆU */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#051C0B]/98 via-[#0A3315]/85 to-[#061D0C]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#051C0B]/95 via-transparent to-[#051C0B]/90" />

        {/* CÁC ĐỐM SÁNG PHẢN CHIẾU HIỆU ỨNG ÁNH ĐÈN XA LỘ */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#2E7D32]/30 blur-3xl pointer-events-none" />

        {/* HOA VĂN LƯỚI SUBTLE GRID TRÊN NỀN */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* HEADER CỘT TRÁI: LOGO & THƯƠNG HIỆU */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center shadow-xl shadow-black/40 border border-emerald-400/40">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-base xl:text-lg tracking-wider text-white uppercase font-mono drop-shadow-md">
                  TAM NGUYEN THANH
                </span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 font-bold px-2 py-0.5 rounded-full border border-emerald-400/40 backdrop-blur-xs">
                  BUS LINES
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 font-medium tracking-wide drop-shadow-xs">
                Chất lượng là danh dự • Phục vụ tận tâm
              </p>
            </div>
          </div>
        </div>

        {/* BODY CỘT TRÁI: TIÊU ĐỀ LỚN & 3 THẺ STATS GLASSMORPHISM */}
        <div className="relative z-10 max-w-xl my-auto py-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs text-emerald-300 font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nền tảng Quản trị Vận tải & Điều độ Xe khách Chuẩn TMS</span>
          </div>

          <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-white leading-tight tracking-tight mb-5 drop-shadow-md">
            Hệ Thống Quản Trị Vận Hành & Điều Độ Xe Khách Thông Minh
          </h1>

          <p className="text-sm xl:text-base text-slate-100/90 leading-relaxed font-normal mb-8 drop-shadow-xs">
            Số hóa toàn diện điều hành bến xe, định vị đội xe Limousine VIP, tối ưu tỷ lệ lấp đầy ghế và đồng bộ bán vé đa kênh theo thời gian thực.
          </p>

          {/* 3 THẺ THỐNG KÊ KÍNH MỜ (GLASSMORPHISM CARDS) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* THẺ 1 */}
            <div className="p-4 rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 hover:bg-black/50 transition-all hover:-translate-y-1 duration-300 group shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-2.5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-white font-mono">50+ Đầu Xe</div>
              <div className="text-[11px] text-emerald-200/90 font-medium mt-1 leading-snug">
                Đạt chuẩn kiểm định an toàn quốc gia
              </div>
            </div>

            {/* THẺ 2 */}
            <div className="p-4 rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 hover:bg-black/50 transition-all hover:-translate-y-1 duration-300 group shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-amber-500/30 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-2.5 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-white font-mono">99.8%</div>
              <div className="text-[11px] text-amber-200/90 font-medium mt-1 leading-snug">
                Xuất bến chuẩn xác theo lệnh điều độ
              </div>
            </div>

            {/* THẺ 3 */}
            <div className="p-4 rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 hover:bg-black/50 transition-all hover:-translate-y-1 duration-300 group shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-2.5 group-hover:scale-110 transition-transform">
                <Radio className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-white font-mono">Real-Time</div>
              <div className="text-[11px] text-cyan-200/90 font-medium mt-1 leading-snug">
                Đồng bộ tức thì Website, POS và Tài xế
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER CỘT TRÁI: CAM KẾT & HỖ TRỢ KỸ THUẬT */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400" />
            <span className="text-white font-medium drop-shadow-xs">Trung tâm điều hành hoạt động 24/7</span>
          </div>
          <div className="flex items-center space-x-1.5 text-emerald-300 font-mono font-bold drop-shadow-xs">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Hotline Điều Độ: 1900 8886</span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. CỘT BÊN PHẢI: LOGIN FORM CONTAINER (CĂN GIỮA ĐẸP MẮT)       */}
      {/* ============================================================== */}
      <section className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-8 sm:p-12 xl:p-16 bg-white min-h-screen">
        {/* NÚT QUAY LẠI TRANG ĐẶT VÉ KHÁCH HÀNG & TRẠNG THÁI SERVER */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-[#1B5E20] transition-colors py-2 px-3 rounded-xl hover:bg-slate-100 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại trang đặt vé khách hàng</span>
          </Link>

          {/* BADGE TRẠNG THÁI HỆ THỐNG */}
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
            <span>Máy chủ trực tuyến</span>
          </div>
        </div>

        {/* KHU VỰC FORM TRUNG TÂM - BỐ CỤC LIỀN MẠCH KHÔNG KHUNG LỒNG */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          {/* HEADER FORM */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200/80 mb-4">
              <div className="w-5 h-5 rounded-lg bg-[#1B5E20] flex items-center justify-center text-white">
                <Bus className="w-3 h-3" />
              </div>
              <span className="font-mono text-xs font-black uppercase text-slate-800 tracking-wider">
                TAM NGUYEN THANH
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-[#1B5E20]">
                TMS PORTAL
              </span>
            </div>

            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Đăng nhập hệ thống
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Nhập tài khoản điều hành được cấp để truy cập cổng quản trị và khai thác chuyến xe.
            </p>
          </div>

          {/* THÔNG BÁO LỖI (ERROR ALERT) */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* THÔNG BÁO THÀNH CÔNG (SUCCESS ALERT) */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* FORM NHẬP LIỆU */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* TRƯỜNG: TÊN ĐĂNG NHẬP / EMAIL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Tên đăng nhập hoặc Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@tamnguyenthanh.vn"
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B5E20] focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* TRƯỜNG: MẬT KHẨU BẢO MẬT */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Mật khẩu bảo mật
                </label>
                <button
                  type="button"
                  onClick={() =>
                    alert('Vui lòng liên hệ Quản Trị Viên qua hotline 1900 8886 để được cấp lại mật khẩu truy cập!')
                  }
                  className="text-xs font-bold text-[#1B5E20] hover:text-[#2E7D32] transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B5E20] focus:bg-white transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* TIỆN ÍCH: GHI NHỚ PHIÊN ĐĂNG NHẬP */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#1B5E20] focus:ring-[#1B5E20] cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Ghi nhớ phiên đăng nhập trên thiết bị này
                </span>
              </label>
            </div>

            {/* NÚT HÀNH ĐỘNG: ĐĂNG NHẬP VẬN HÀNH */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-4 px-5 rounded-xl bg-gradient-to-r from-[#1B5E20] via-[#246A28] to-[#2E7D32] hover:from-[#144718] hover:to-[#1B5E20] text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-emerald-950/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực thông tin...</span>
                </div>
              ) : (
                <>
                  <span>ĐĂNG NHẬP VẬN HÀNH</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* FOOTER FORM: BẢO MẬT & BẢN QUYỀN */}
        <div className="w-full max-w-md mx-auto pt-6 text-center text-[11px] text-slate-400 border-t border-slate-100">
          <p>
            🔒 Mã hóa SSL 256-bit • Bản quyền © 2026 Tam Nguyen Thanh Transport. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}
