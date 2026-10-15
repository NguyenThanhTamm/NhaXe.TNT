import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nhà Xe Tam Nguyen Thanh - Đặt Vé Xe Khách & Limousine VIP Trực Tuyến',
  description: 'Hệ thống đặt vé xe khách giường nằm liên tỉnh chất lượng cao Tam Nguyen Thanh Bus Lines. Đội xe đời mới, an toàn, tiện nghi, phục vụ 24/7.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#F8FAF8] antialiased selection:bg-[#2E7D32] selection:text-white">
        {children}
      </body>
    </html>
  );
}
