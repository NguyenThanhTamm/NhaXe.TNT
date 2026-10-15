'use client';

import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  Clock,
  Headphones,
  Award,
  Wifi,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export const CoreValuesSection: React.FC = () => {
  const values = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-[#2E7D32]" />,
      badge: 'Ưu tiên số 1',
      title: 'An toàn là trên hết',
      description:
        'Đội ngũ tài xế chuyên nghiệp, nhiều năm kinh nghiệm chạy tuyến đường đèo dốc. Tuyệt đối tuân thủ tốc độ quy định, không phóng nhanh vượt ẩu, không bắt khách dọc đường.',
      highlights: ['Tài xế sát hạch định kỳ', 'Kiểm tra kỹ thuật trước giờ xuất bến', 'GPS giám sát hành trình 24/7'],
      bgColor: 'bg-emerald-50/70',
      borderColor: 'border-emerald-200/80',
    },
    {
      icon: <Sparkles className="w-8 h-8 text-[#2E7D32]" />,
      badge: 'Chuẩn 5 sao',
      title: 'Tiện nghi đỉnh cao',
      description:
        'Dàn xe giường nằm & Limousine VIP 22 phòng đời mới. Nệm bọc da cao cấp êm ái, wifi tốc độ cao, cổng sạc nhanh Type-C/USB từng vị trí, nước suối Lavie và khăn lạnh miễn phí suốt tuyến.',
      highlights: ['Limousine 22 Cabin riêng tư', 'Khử khuẩn & thay chăn ga mỗi chuyến', 'Màn hình giải trí & cổng sạc riêng'],
      bgColor: 'bg-green-50/70',
      borderColor: 'border-green-200/80',
    },
    {
      icon: <Clock className="w-8 h-8 text-[#2E7D32]" />,
      badge: 'Uy tín hàng đầu',
      title: 'Đúng giờ - Đúng giá',
      description:
        'Cam kết xuất bến đúng giờ 100%. Giá vé niêm yết công khai minh bạch, đặt trước bao nhiêu thanh toán bấy nhiêu. Tuyệt đối không chèn ép phụ thu bất hợp lý dịp lễ, Tết.',
      highlights: ['Xuất bến đúng giờ theo lịch', 'Giá vé niêm yết minh bạch', 'Chính sách hoàn/đổi vé linh hoạt'],
      bgColor: 'bg-teal-50/70',
      borderColor: 'border-teal-200/80',
    },
    {
      icon: <Headphones className="w-8 h-8 text-[#2E7D32]" />,
      badge: 'Hỗ trợ 24/7',
      title: 'Phục vụ tận tâm 24/7',
      description:
        'Tổng đài CSKH và đội ngũ hỗ trợ trạm trực tuyến 24/7 mọi ngày trong năm. Sẵn sàng giải đáp thắc mắc, hướng dẫn trung chuyển tận tình và xử lý khiếu nại nhanh chóng.',
      highlights: ['Tổng đài miễn cước 1900 8899', 'Hệ thống xe trung chuyển chu đáo', 'Tiếp nhận & xử lý phản hồi tức thì'],
      bgColor: 'bg-emerald-50/70',
      borderColor: 'border-emerald-200/80',
    },
  ];

  return (
    <section id="ve-chung-toi" className="py-20 bg-[#F4F7F4] relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-[#1B5E20] font-black text-xs px-4 py-1.5 rounded-full mb-3 border border-green-200 shadow-xs">
            <Award className="w-4 h-4 text-amber-600" />
            <span>TRIẾT LÝ HOẠT ĐỘNG CỦA NHÀ XE TAM NGUYEN THANH</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            &ldquo;Chất Lượng Là Danh Dự&rdquo;
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
            Mỗi chuyến đi không chỉ là đưa đón hành khách, mà là trao gửi sự an tâm, tiện nghi và trọn vẹn niềm tin trên từng cung đường.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((item, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-3xl p-6 sm:p-7 border ${item.borderColor} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200/70 flex items-center justify-center group-hover:scale-110 group-hover:bg-green-100 transition-all duration-200">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 group-hover:text-[#2E7D32] transition-colors mb-2.5">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-1.5">
                {item.highlights.map((h, i) => (
                  <div key={i} className="flex items-center space-x-2 text-[11px] text-slate-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Banner Cam kết thêm */}
        <div className="mt-12 bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#388E3C] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-green-200">
              Cam kết dịch vụ vượt trội
            </span>
            <h4 className="text-xl sm:text-2xl font-black">
              100% Giữ Chỗ Đúng Số Giường Đã Chọn Trên Website
            </h4>
            <p className="text-xs text-green-100/90 max-w-xl">
              Hệ thống khóa giường tức thì trong 10 phút. Không bao giờ xảy ra tình trạng trùng giường hoặc đổi chỗ của khách hàng.
            </p>
          </div>

          <a
            href="tel:19008899"
            className="shrink-0 bg-white hover:bg-green-50 text-[#1B5E20] font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2"
          >
            <Headphones className="w-4 h-4 text-[#2E7D32]" />
            <span>Gọi Tư Vấn Ngay: 1900 8899</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CoreValuesSection;
