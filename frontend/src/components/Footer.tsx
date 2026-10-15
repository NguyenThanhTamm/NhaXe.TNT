'use client';

import React from 'react';
import {
  Bus,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  CreditCard,
} from 'lucide-react';

interface FooterProps {
  onOpenLookupModal: () => void;
  onOpenScheduleModal: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLookupModal,
  onOpenScheduleModal,
  onScrollToSection,
}) => {
  return (
    <footer id="lien-he" className="bg-[#0D2811] text-slate-300 pt-16 pb-12 border-t border-green-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top 4-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Cột 1: Thông tin công ty */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-[#2E7D32] flex items-center justify-center text-white shadow-md">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white uppercase block">
                  Tam Nguyen Thanh
                </span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  Bus Lines Official
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>CÔNG TY TNHH VẬN TẢI TAM NGUYEN THANH</strong>
              <br />
              Đơn vị tiên phong cung cấp giải pháp vận tải hành khách liên tỉnh cao cấp với phương châm <em>&ldquo;Chất lượng là danh dự&rdquo;</em>.
            </p>

            <div className="text-[11px] text-slate-400 space-y-1 bg-white/5 p-3 rounded-2xl border border-white/10">
              <p>• GPKD Vận tải hành khách số: <strong>0318999888</strong> do Sở GTVT TP.HCM cấp</p>
              <p>• Mã số thuế doanh nghiệp: <strong>0318999888</strong></p>
              <p className="text-emerald-400 font-medium">✓ Đã đăng ký & thông báo Bộ Công Thương</p>
            </div>
          </div>

          {/* Cột 2: Tuyến đường chính & Lịch chạy */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Tuyến Trọng Điểm</span>
            </h4>

            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('booking-engine')}
                  className="hover:text-emerald-300 transition-colors flex items-center space-x-2 text-left"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Sài Gòn ⇄ Đà Lạt (Giường VIP & Cabin)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('booking-engine')}
                  className="hover:text-emerald-300 transition-colors flex items-center space-x-2 text-left"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Sài Gòn ⇄ Nha Trang (Xe đêm êm ái)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('booking-engine')}
                  className="hover:text-emerald-300 transition-colors flex items-center space-x-2 text-left"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Sài Gòn ⇄ Cần Thơ / Miền Tây</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToSection('booking-engine')}
                  className="hover:text-emerald-300 transition-colors flex items-center space-x-2 text-left"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Đà Lạt ⇄ Nha Trang (Liên tỉnh miền Trung)</span>
                </button>
              </li>
              <li className="pt-2">
                <button
                  type="button"
                  onClick={onOpenScheduleModal}
                  className="text-amber-300 hover:text-amber-200 font-bold flex items-center space-x-1.5"
                >
                  <span>→ Xem toàn bộ lịch trình xuất bến</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenLookupModal}
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1.5"
                >
                  <span>→ Tra cứu vé xe đã đặt</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 3: Chính sách & Hướng dẫn */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Chính Sách & Quy Định</span>
            </h4>

            <ul className="space-y-2 text-xs">
              <li className="hover:text-white cursor-pointer transition-colors flex items-center space-x-1.5">
                <ChevronRight className="w-3 h-3 text-emerald-500" />
                <span>Quy định đổi trả và hoàn tiền vé</span>
              </li>
              <li className="hover:text-white cursor-pointer transition-colors flex items-center space-x-1.5">
                <ChevronRight className="w-3 h-3 text-emerald-500" />
                <span>Chính sách bảo mật thông tin hành khách</span>
              </li>
              <li className="hover:text-white cursor-pointer transition-colors flex items-center space-x-1.5">
                <ChevronRight className="w-3 h-3 text-emerald-500" />
                <span>Quy định hành lý & hàng hóa ký gửi</span>
              </li>
              <li className="hover:text-white cursor-pointer transition-colors flex items-center space-x-1.5">
                <ChevronRight className="w-3 h-3 text-emerald-500" />
                <span>Hướng dẫn đặt vé và chọn giường online</span>
              </li>
            </ul>

            <div className="pt-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-2">
                Cổng thanh toán liên kết
              </span>
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-white/10 px-2 py-1 rounded text-[11px] font-bold text-white">VNPAY</span>
                <span className="bg-white/10 px-2 py-1 rounded text-[11px] font-bold text-white">VietQR</span>
                <span className="bg-white/10 px-2 py-1 rounded text-[11px] font-bold text-white">MoMo</span>
                <span className="bg-white/10 px-2 py-1 rounded text-[11px] font-bold text-white">Visa / Master</span>
                <span className="bg-white/10 px-2 py-1 rounded text-[11px] font-bold text-white">Tiền mặt</span>
              </div>
            </div>
          </div>

          {/* Cột 4: Kênh liên hệ & Mạng xã hội */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Văn Phòng & Tổng Đài</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">VP TP. Hồ Chí Minh:</span>
                  <span>395 Kinh Dương Vương, P. An Lạc, Q. Bình Tân</span>
                  <span className="block text-slate-400 text-[11px]">Trạm Hàng Xanh: 486H Điện Biên Phủ, Q. Bình Thạnh</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">VP TP. Đà Lạt:</span>
                  <span>01 Tô Hiến Thành, Phường 3, TP. Đà Lạt</span>
                  <span className="block text-slate-400 text-[11px]">VP Bảo Lộc: 280 Trần Phú, TP. Bảo Lộc</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[11px]">Hotline đặt vé / Thuê xe hợp đồng:</span>
                  <a
                    href="tel:19008899"
                    className="font-black text-amber-300 hover:text-amber-200 text-sm block"
                  >
                    1900 8899 (Cước 1.000đ/phút)
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>hotro@tamnguyenthanhbus.vn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Tam Nguyen Thanh Bus Lines. Bản quyền thuộc về Nhà Xe Tam Nguyen Thanh.</p>
          <div className="flex items-center space-x-6 text-[11px]">
            <span>An Toàn</span>
            <span>•</span>
            <span>Tiện Nghi</span>
            <span>•</span>
            <span>Đúng Giờ</span>
            <span>•</span>
            <span>Tận Tâm</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
