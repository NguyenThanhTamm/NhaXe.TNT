export interface VnpayConfig {
  tmnCode: string;
  hashSecret: string;
  vnpUrl: string;
  returnUrl: string;
}

export const getVnpayConfig = (): VnpayConfig => ({
  // Mã định danh website tại VNPAY (Terminal ID)
  tmnCode: process.env.VNP_TMN_CODE || 'DEMO_TNT_TMN',
  // Chuỗi bí mật tạo chữ ký checksum
  hashSecret: process.env.VNP_HASH_SECRET || 'SECRET_KEY_VNPAY_1234567890ABCDEF',
  // URL cổng thanh toán (Sandbox hoặc Production)
  vnpUrl: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  // URL điều hướng khách sau khi thanh toán xong trên web VNPAY
  returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/vnpay/vnpay_return',
});
