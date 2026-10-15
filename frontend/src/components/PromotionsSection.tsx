'use client';

import React, { useState } from 'react';
import { Tag, Copy, Check, Clock, Sparkles, ArrowRight, Gift, Percent } from 'lucide-react';

interface PromotionItem {
  id: string;
  code: string;
  discountBadge: string;
  badgeColor: string;
  title: string;
  description: string;
  expiryDate: string;
  applicableRoute: string;
  minOrder?: string;
  gradient: string;
}

interface PromotionsSectionProps {
  onApplyPromoCode: (code: string) => void;
}

export const PromotionsSection: React.FC<PromotionsSectionProps> = ({ onApplyPromoCode }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const promotions: PromotionItem[] = [
    {
      id: 'promo-1',
      code: 'TNTMOI20',
      discountBadge: 'GIẢM 20%',
      badgeColor: 'bg-red-500 text-white',
      title: 'Giảm ngay 20% cho khách đặt vé lần đầu',
      description: 'Áp dụng cho mọi tuyến xe khi đặt vé qua website Nhà Xe Tam Nguyen Thanh. Nhập mã trước khi thanh toán.',
      expiryDate: '31/12/2026',
      applicableRoute: 'Toàn mạng lưới',
      gradient: 'from-emerald-600 to-green-700',
    },
    {
      id: 'promo-2',
      code: 'TNTSINHVIEN',
      discountBadge: 'ƯU ĐÃI 15%',
      badgeColor: 'bg-amber-500 text-white',
      title: 'Ưu đãi học sinh - sinh viên & công nhân về quê',
      description: 'Hỗ trợ sinh viên các trường Đại học & người lao động về quê nghỉ lễ, Tết. Xuất trình thẻ khi lên xe.',
      expiryDate: '15/01/2027',
      applicableRoute: 'Sài Gòn ⇄ Đà Lạt, Nha Trang, Cần Thơ',
      gradient: 'from-teal-600 to-emerald-800',
    },
    {
      id: 'promo-3',
      code: 'TNTKHUHOI50',
      discountBadge: 'TIẾT KIỆM 50.000Đ',
      badgeColor: 'bg-orange-600 text-white',
      title: 'Combo khứ hồi Sài Gòn - Đà Lạt tiết kiệm 50K',
      description: 'Tự động giảm 50.000đ/vé khứ hồi xe Limousine 22 Phòng hoặc Giường Nằm VIP khi chọn vé 2 chiều.',
      expiryDate: '28/02/2027',
      applicableRoute: 'Sài Gòn ⇄ Đà Lạt',
      gradient: 'from-green-700 to-emerald-900',
    },
    {
      id: 'promo-4',
      code: 'TNTNHOM4',
      discountBadge: 'ĐI 4 TÍNH 3',
      badgeColor: 'bg-rose-500 text-white',
      title: 'Ưu đãi nhóm bạn & gia đình du lịch cuối tuần',
      description: 'Đi nhóm từ 4 người trở lên được tặng ngay voucher đồ uống và giảm 10% tổng hóa đơn giữ chỗ.',
      expiryDate: '31/03/2027',
      applicableRoute: 'Tất cả các tuyến cuối tuần',
      gradient: 'from-emerald-700 to-teal-900',
    },
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const handleApply = (code: string) => {
    handleCopy(code);
    onApplyPromoCode(code);
  };

  return (
    <section id="khuyen-mai" className="py-16 bg-[#F4F7F4] relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-green-100 text-[#1B5E20] font-bold text-xs px-3.5 py-1.5 rounded-full mb-3 border border-green-200">
              <Gift className="w-3.5 h-3.5 text-amber-600" />
              <span>ƯU ĐÃI ĐỘC QUYỀN TRỰC TUYẾN</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Khuyến Mãi Nổi Bật Dành Cho Bạn
            </h2>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              Nhận ngay mã giảm giá và đặc quyền giá vé tốt nhất từ Nhà Xe Tam Nguyen Thanh khi đặt vé trực tuyến hôm nay.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-2 text-xs font-semibold text-[#2E7D32]">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Mã ưu đãi áp dụng trực tiếp tại bước thanh toán</span>
          </div>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="bg-white rounded-3xl overflow-hidden border border-green-100/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
            >
              {/* Card Header with stylish badge & gradient */}
              <div className={`p-5 bg-gradient-to-br ${promo.gradient} text-white relative overflow-hidden`}>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span
                    className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm ${promo.badgeColor}`}
                  >
                    {promo.discountBadge}
                  </span>
                  <div className="flex items-center text-green-100 text-[11px] font-medium space-x-1">
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>HSD: {promo.expiryDate}</span>
                  </div>
                </div>

                <h3 className="font-black text-base sm:text-lg leading-snug line-clamp-2 relative z-10 group-hover:text-green-50 transition-colors">
                  {promo.title}
                </h3>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                    {promo.description}
                  </p>
                  <div className="flex items-center text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-700 mr-1.5">Áp dụng:</span>
                    <span className="truncate">{promo.applicableRoute}</span>
                  </div>
                </div>

                {/* Promo Code & Action Box */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="bg-green-50/70 border border-dashed border-green-300 rounded-2xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Mã khuyến mãi
                      </span>
                      <span className="text-sm font-black text-[#1B5E20] font-mono tracking-wider">
                        {promo.code}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(promo.code)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                          copiedCode === promo.code
                            ? 'bg-[#2E7D32] text-white shadow-sm'
                            : 'bg-white hover:bg-green-100 text-slate-700 border border-green-200'
                        }`}
                        title="Sao chép mã"
                      >
                        {copiedCode === promo.code ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span className="text-[11px] hidden sm:inline">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#2E7D32]" />
                            <span className="text-[11px] hidden sm:inline">Chép mã</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApply(promo.code)}
                        className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm flex items-center space-x-1"
                      >
                        <span>Dùng</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromotionsSection;
