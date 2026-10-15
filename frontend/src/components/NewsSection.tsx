'use client';

import React, { useState } from 'react';
import { Newspaper, Calendar, ArrowRight, BookOpen, Clock, Tag, X } from 'lucide-react';

interface ArticleItem {
  id: string;
  category: string;
  categoryColor: string;
  title: string;
  summary: string;
  date: string;
  readTime: string;
  content: string;
}

export const NewsSection: React.FC = () => {
  const [activeArticle, setActiveArticle] = useState<ArticleItem | null>(null);

  const articles: ArticleItem[] = [
    {
      id: 'news-1',
      category: 'Thông Báo',
      categoryColor: 'bg-red-500 text-white',
      title: 'Thông báo mở bán vé xe Tết Nguyên Đán tuyến Sài Gòn - Đà Lạt',
      summary:
        'Nhà xe Tam Nguyen Thanh chính thức triển khai mở bán vé xe Tết Nguyên Đán với cam kết giữ nguyên giá niêm yết minh bạch, tăng cường 40 chuyến xe Limousine VIP mỗi ngày để phục vụ bà con về quê sum họp.',
      date: '12/10/2026',
      readTime: '3 phút đọc',
      content:
        'Để đáp ứng nhu cầu đi lại tăng cao của quý khách hàng trong dịp Tết Nguyên Đán, Nhà Xe Tam Nguyen Thanh xin trân trọng thông báo mở bán vé xe Tết trực tuyến trên toàn hệ thống.\n\n1. Thời gian áp dụng: Từ ngày 20 tháng Chạp đến mùng 10 tháng Giêng.\n2. Các tuyến trọng điểm: Sài Gòn ⇄ Đà Lạt, Sài Gòn ⇄ Nha Trang, Sài Gòn ⇄ Cần Thơ.\n3. Chính sách bán vé: Đảm bảo 100% khách hàng đặt vé trên website được giữ đúng vị trí giường đã chọn, không xảy ra tình trạng nhồi nhét, không phụ thu bất hợp lý.\n\nQuý khách vui lòng đặt vé sớm qua website hoặc liên hệ hotline 1900 8899 để được hỗ trợ chu đáo nhất.',
    },
    {
      id: 'news-2',
      category: 'Dịch Vụ Mới',
      categoryColor: 'bg-emerald-600 text-white',
      title: 'Nhà xe Tam Nguyen Thanh đưa vào vận hành dòng xe Limousine VIP 22 phòng cao cấp',
      summary:
        'Trải nghiệm đẳng cấp thương gia với không gian cabin riêng tư biệt lập, rèm che kín đáo, giường nệm massage đa điểm, cổng sạc nhanh Type-C và hệ thống lọc không khí ion âm kháng khuẩn.',
      date: '08/10/2026',
      readTime: '4 phút đọc',
      content:
        'Nhằm nâng tầm trải nghiệm cho hành khách trên các hành trình đường dài, Nhà Xe Tam Nguyen Thanh đã chính thức tiếp nhận và đưa vào vận hành lô 20 xe Limousine VIP 22 Cabin phòng riêng cao cấp.\n\nĐiểm nổi bật của dòng xe Limousine 22 Phòng VIP:\n- Mỗi phòng là một không gian riêng tư hoàn toàn với rèm che và vách ngăn cách âm.\n- Giường nệm bọc da bò nhập khẩu tích hợp chế độ massage đa điểm giảm mỏi lưng.\n- Màn hình LED giải trí Full HD, tai nghe riêng biệt, cổng sạc chuẩn Type-C sạc nhanh cho điện thoại, iPad.\n- Nước suối Lavie, khăn lạnh cao cấp và bánh ngọt nhẹ phục vụ miễn phí suốt hành trình.\n\nHãy trải nghiệm ngay hôm nay để tận hưởng chuyến đi êm ái như phòng ngủ khách sạn 5 sao!',
    },
    {
      id: 'news-3',
      category: 'Cẩm Nang Du Lịch',
      categoryColor: 'bg-amber-600 text-white',
      title: 'Cẩm nang du lịch và lịch trình các trạm trung chuyển tại TP. Đà Lạt',
      summary:
        'Tổng hợp danh sách các điểm đón trả trung chuyển miễn phí tận nơi tại trung tâm TP. Đà Lạt, các khách sạn, homestay và lưu ý khi đón xe đêm để có kỳ nghỉ trọn vẹn và an toàn.',
      date: '02/10/2026',
      readTime: '5 phút đọc',
      content:
        'Đà Lạt luôn là điểm đến hấp dẫn du khách bốn phương với khí hậu mát mẻ và khung cảnh thơ mộng. Để giúp quý khách di chuyển thuận tiện nhất, Nhà Xe Tam Nguyen Thanh cung cấp dịch vụ xe trung chuyển miễn phí trong bán kính 7km từ Bến xe Liên tỉnh Đà Lạt.\n\nNhững lưu ý khi sử dụng xe trung chuyển:\n- Khi đặt vé, quý khách chỉ cần nhập địa chỉ khách sạn hoặc homestay tại Đà Lạt.\n- Trước giờ xe đến bến 30 phút, tài xế xe trung chuyển sẽ liên hệ xác nhận điểm trả.\n- Đối với các chuyến xe đến Đà Lạt vào sáng sớm (04:00 - 05:30), quý khách có thể nghỉ ngơi tại phòng chờ tiện nghi của nhà xe trước khi trung chuyển về khách sạn nhận phòng.\n\nChúc quý khách có một kỳ nghỉ thật tuyệt vời tại xứ sở ngàn hoa cùng Tam Nguyen Thanh Bus!',
    },
  ];

  return (
    <section id="tin-tuc" className="py-16 bg-white relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center space-x-2 bg-green-50 text-[#1B5E20] font-black text-xs px-3.5 py-1.5 rounded-full mb-3 border border-green-200">
              <Newspaper className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>BẢN TIN & THÔNG BÁO MỚI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tin Tức & Cẩm Nang Hành Trình
            </h2>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              Cập nhật thông báo mở bán vé, chính sách mới và kinh nghiệm du lịch hữu ích từ Nhà Xe Tam Nguyen Thanh.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-2 text-xs font-bold text-[#2E7D32]">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Cập nhật liên tục 24/7</span>
          </div>
        </div>

        {/* Articles 3-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
            >
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${item.categoryColor}`}
                    >
                      {item.category}
                    </span>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.readTime}</span>
                    </div>
                  </div>

                  <h3 className="font-black text-base sm:text-lg text-slate-900 leading-snug group-hover:text-[#2E7D32] transition-colors mb-2.5">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.date}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveArticle(item)}
                    className="inline-flex items-center space-x-1 text-xs font-black text-[#2E7D32] hover:text-[#1B5E20] group-hover:underline"
                  >
                    <span>Đọc chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Modal Đọc Tin Tức Chi Tiết */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${activeArticle.categoryColor}`}>
                {activeArticle.category}
              </span>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {activeArticle.title}
              </h3>
              <div className="flex items-center space-x-4 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ngày đăng: {activeArticle.date}</span>
                </span>
                <span>•</span>
                <span>{activeArticle.readTime}</span>
              </div>
            </div>

            <div className="text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line border-t border-slate-100 pt-4">
              {activeArticle.content}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default NewsSection;
