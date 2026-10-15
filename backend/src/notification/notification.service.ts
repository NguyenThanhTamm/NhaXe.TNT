import { Injectable, Logger } from '@nestjs/common';

export interface TicketNotificationPayload {
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  bookingCode: string;
  ticketCodes: string[];
  seatCodes: string[];
  tripCode: string;
  departureTime: Date;
  pickupPointName: string;
  dropoffPointName: string;
  totalAmount: number;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Tạo chuỗi dữ liệu mã QR phục vụ tài xế quét lên xe
   * Định dạng chuẩn Nhà Xe Tam Nguyen Thanh e-ticket
   */
  generateQrCodePayload(ticketCode: string, bookingCode: string): string {
    return JSON.stringify({
      app: 'TAM_NGUYEN_THANH_BUS',
      ticket: ticketCode,
      booking: bookingCode,
      ts: Date.now(),
    });
  }

  /**
   * Gửi Email vé điện tử kèm mã QR cho hành khách
   */
  async sendTicketEmail(payload: TicketNotificationPayload): Promise<boolean> {
    if (!payload.contactEmail) {
      this.logger.warn(`Không có email để gửi vé cho booking ${payload.bookingCode}`);
      return false;
    }

    const qrData = this.generateQrCodePayload(payload.ticketCodes[0], payload.bookingCode);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

    this.logger.log(`[EMAIL DISPATCH] Đang gửi vé điện tử tới: ${payload.contactEmail}`);
    this.logger.log(`
      ======================================================
      [NHÀ XE TAM NGUYEN THANH - VÉ ĐIỆN TỬ XÁC NHẬN ĐẶT CHỖ]
      Người nhận: ${payload.contactName} (${payload.contactPhone})
      Mã đơn đặt vé: ${payload.bookingCode}
      Mã vé: ${payload.ticketCodes.join(', ')}
      Giường nằm: ${payload.seatCodes.join(', ')}
      Chuyến xe: ${payload.tripCode}
      Thời gian khởi hành: ${payload.departureTime.toLocaleString('vi-VN')}
      Điểm đón: ${payload.pickupPointName}
      Điểm trả: ${payload.dropoffPointName}
      Tổng tiền: ${payload.totalAmount.toLocaleString('vi-VN')} VNĐ
      Mã QR vé: ${qrUrl}
      ======================================================
    `);

    // Trong môi trường production, tích hợp Nodemailer / SendGrid / AWS SES tại đây:
    // await this.mailerService.sendMail({ to: payload.contactEmail, subject: `[TAM NGUYEN THANH] Vé điện tử ${payload.bookingCode}`, html: ... });
    return true;
  }

  /**
   * Gửi SMS Brandname mã vé cho hành khách
   */
  async sendTicketSms(payload: TicketNotificationPayload): Promise<boolean> {
    const smsMessage = `[TAM NGUYEN THANH] Cam on quy khach ${payload.contactName}. Ma ve: ${payload.bookingCode}. Giuong: ${payload.seatCodes.join(',')}. Xuat ben: ${new Date(payload.departureTime).toLocaleTimeString('vi-VN')}. Xem ve & QR: https://tamnguyenthanh.vn/ticket/${payload.bookingCode}`;

    this.logger.log(`[SMS BRANDNAME] Gửi tới ${payload.contactPhone}: "${smsMessage}"`);

    // Trong môi trường production, tích hợp eSMS / FPT / Viettel SMS Brandname:
    // await this.smsClient.sendSms(payload.contactPhone, smsMessage);
    return true;
  }
}
