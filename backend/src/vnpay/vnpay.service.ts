import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { DataSource } from 'typeorm';
import { getVnpayConfig, VnpayConfig } from './vnpay.config';
import { CreatePaymentUrlDto } from './dtos/create-payment-url.dto';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { TripSeat, SeatStatus } from '../entities/trip-seat.entity';
import { Ticket } from '../entities/ticket.entity';
import {
  Transaction,
  PaymentGateway,
  TransactionStatus,
} from '../entities/transaction.entity';
import { RedisService } from '../redis/redis.service';
import { SeatGateway } from '../gateways/seat.gateway';
import { NotificationService } from '../notification/notification.service';
import { Trip } from '../entities/trip.entity';

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);
  private readonly config: VnpayConfig;

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly seatGateway: SeatGateway,
    private readonly notificationService: NotificationService,
  ) {
    this.config = getVnpayConfig();
  }

  /**
   * Định dạng thời gian theo chuẩn VNPAY: yyyyMMddHHmmss (GMT+7)
   */
  private formatVnpDate(date: Date): string {
    const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = vnTime.getUTCFullYear();
    const MM = pad(vnTime.getUTCMonth() + 1);
    const dd = pad(vnTime.getUTCDate());
    const HH = pad(vnTime.getUTCHours());
    const mm = pad(vnTime.getUTCMinutes());
    const ss = pad(vnTime.getUTCSeconds());
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  }

  /**
   * Sắp xếp và mã hóa query parameters chuẩn VNPAY
   */
  private sortAndBuildSignData(params: Record<string, any>): {
    sortedParams: Record<string, string>;
    signData: string;
  } {
    const sortedKeys = Object.keys(params).sort();
    const sortedParams: Record<string, string> = {};

    sortedKeys.forEach((key) => {
      const val = params[key];
      if (val !== undefined && val !== null && val !== '') {
        sortedParams[key] = String(val);
      }
    });

    const signData = Object.keys(sortedParams)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(sortedParams[k])}`)
      .join('&');

    return { sortedParams, signData };
  }

  /**
   * Tính mã băm HMAC-SHA512
   */
  private hmacSHA512(key: string, data: string): string {
    return crypto.createHmac('sha512', key).update(Buffer.from(data, 'utf-8')).digest('hex');
  }

  /**
   * 1. TẠO URL THANH TOÁN VNPAY (REDIRECT URL)
   */
  async createPaymentUrl(dto: CreatePaymentUrlDto, clientIp: string): Promise<string> {
    const booking = await this.dataSource.getRepository(Booking).findOne({
      where: { id: dto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ID ${dto.bookingId} không tồn tại.`);
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(`Đơn đặt vé này không ở trạng thái chờ thanh toán.`);
    }

    const now = new Date();
    // VNPAY yêu cầu số tiền nhân với 100 (Không có dấu phân cách)
    const vnpAmount = Math.round(Number(dto.amount) * 100);
    const createDate = this.formatVnpDate(now);
    // Hạn thanh toán 10 phút, khớp với thời gian giữ chỗ
    const expireDate = this.formatVnpDate(new Date(now.getTime() + 10 * 60 * 1000));

    // Chuẩn hóa IP
    const cleanIp = clientIp.includes('::') ? '127.0.0.1' : clientIp;

    const vnpParams: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.config.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: booking.bookingCode, // Mã đơn hàng phía merchant
      vnp_OrderInfo: dto.orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: vnpAmount,
      vnp_ReturnUrl: dto.returnUrl || this.config.returnUrl,
      vnp_IpAddr: cleanIp,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    const { sortedParams, signData } = this.sortAndBuildSignData(vnpParams);
    const secureHash = this.hmacSHA512(this.config.hashSecret, signData);

    const redirectUrl = `${this.config.vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
    this.logger.log(`Tạo link thanh toán VNPAY thành công cho đơn ${booking.bookingCode}`);
    return redirectUrl;
  }

  /**
   * 2. XÁC THỰC VÀ XỬ LÝ KẾT QUẢ TỪ VNPAY IPN (WEBHOOK SERVER-TO-SERVER)
   */
  async processIpn(query: Record<string, any>): Promise<{ RspCode: string; Message: string }> {
    const secureHash = query['vnp_SecureHash'];
    delete query['vnp_SecureHash'];
    delete query['vnp_SecureHashType'];

    // 1. Kiểm tra chữ ký Checksum
    const { signData } = this.sortAndBuildSignData(query);
    const checkHash = this.hmacSHA512(this.config.hashSecret, signData);

    if (secureHash.toLowerCase() !== checkHash.toLowerCase()) {
      this.logger.error(`Sai mã checksum VNPAY IPN. Nhận: ${secureHash}, Tính: ${checkHash}`);
      return { RspCode: '97', Message: 'Checksum failed' };
    }

    const bookingCode = query['vnp_TxnRef'];
    const vnpAmount = Number(query['vnp_Amount']) / 100;
    const vnpResponseCode = query['vnp_ResponseCode'];
    const vnpTransactionNo = query['vnp_TransactionNo'];

    // 2. Mở Transaction kiểm tra & khóa dữ liệu
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Khóa bản ghi Booking bằng FOR UPDATE
      const booking = await queryRunner.manager.findOne(Booking, {
        where: { bookingCode },
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) {
        this.logger.warn(`Không tìm thấy đơn đặt vé có mã ${bookingCode}`);
        await queryRunner.rollbackTransaction();
        return { RspCode: '01', Message: 'Order not found' };
      }

      // Kiểm tra số tiền có khớp đơn hàng
      if (Math.round(booking.finalAmount) !== Math.round(vnpAmount)) {
        this.logger.error(`Số tiền không khớp! DB: ${booking.finalAmount}, VNPAY: ${vnpAmount}`);
        await queryRunner.rollbackTransaction();
        return { RspCode: '04', Message: 'Invalid amount' };
      }

      // Kiểm tra tính Idempotent (Đơn hàng đã được xử lý trước đó chưa)
      if (booking.status === BookingStatus.CONFIRMED) {
        await queryRunner.rollbackTransaction();
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      // 3. Nếu thanh toán thành công từ VNPAY (Code 00)
      if (vnpResponseCode === '00') {
        // Tìm và khóa các giường đang giữ của đơn này
        const tripSeats = await queryRunner.manager.find(TripSeat, {
          where: { tripId: booking.tripId, status: SeatStatus.HOLDING },
          relations: ['seat'],
          lock: { mode: 'pessimistic_write' },
        });

        const seatCodes: string[] = [];
        const ticketCodes: string[] = [];

        for (const ts of tripSeats) {
          // Chuyển giường sang BOOKED vĩnh viễn
          ts.status = SeatStatus.BOOKED;
          ts.holdExpiresAt = null;
          ts.holdSessionId = null;
          await queryRunner.manager.save(TripSeat, ts);

          seatCodes.push(ts.seat?.seatCode || 'N/A');

          // Tạo Vé điện tử chính thức
          const ticketCode = `TK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
          ticketCodes.push(ticketCode);

          const ticket = queryRunner.manager.create(Ticket, {
            ticketCode,
            bookingId: booking.id,
            tripId: booking.tripId,
            seatId: ts.seatId,
            price: ts.price,
          });
          await queryRunner.manager.save(Ticket, ticket);

          // Xóa lock trên Redis và bắn Socket.IO thông báo cho client
          await this.redisService.removeSeatLock(booking.tripId, ts.seatId);
          this.seatGateway.notifySeatBooked(booking.tripId, ts.seatId, ts.seat?.seatCode || '');
        }

        // Cập nhật trạng thái Booking sang CONFIRMED
        booking.status = BookingStatus.CONFIRMED;
        await queryRunner.manager.save(Booking, booking);

        // Lưu bản ghi giao dịch thành công
        const transaction = queryRunner.manager.create(Transaction, {
          bookingId: booking.id,
          transactionCode: vnpTransactionNo,
          gateway: PaymentGateway.VNPAY,
          amount: vnpAmount,
          status: TransactionStatus.SUCCESS,
          gatewayResponse: query,
          paidAt: new Date(),
        });
        await queryRunner.manager.save(Transaction, transaction);

        // Commit dữ liệu
        await queryRunner.commitTransaction();

        // 4. Lấy thông tin chuyến để gửi Email & SMS kèm mã QR
        const trip = await this.dataSource.getRepository(Trip).findOne({
          where: { id: booking.tripId },
        });

        await this.notificationService.sendTicketEmail({
          contactName: booking.contactName,
          contactPhone: booking.contactPhone,
          contactEmail: booking.contactEmail,
          bookingCode: booking.bookingCode,
          ticketCodes,
          seatCodes,
          tripCode: trip?.tripCode || 'TNT-EXPRESS',
          departureTime: trip?.departureTime || new Date(),
          pickupPointName: 'Điểm đón đã chọn',
          dropoffPointName: 'Điểm trả đã chọn',
          totalAmount: booking.finalAmount,
        });

        await this.notificationService.sendTicketSms({
          contactName: booking.contactName,
          contactPhone: booking.contactPhone,
          bookingCode: booking.bookingCode,
          ticketCodes,
          seatCodes,
          tripCode: trip?.tripCode || 'TNT-EXPRESS',
          departureTime: trip?.departureTime || new Date(),
          pickupPointName: 'Điểm đón đã chọn',
          dropoffPointName: 'Điểm trả đã chọn',
          totalAmount: booking.finalAmount,
        });

        this.logger.log(`Thanh toán VNPAY thành công cho đơn ${bookingCode}!`);
        return { RspCode: '00', Message: 'Confirm Success' };
      } else {
        // Khách hàng hủy thanh toán hoặc giao dịch thất bại tại cổng VNPAY
        const transaction = queryRunner.manager.create(Transaction, {
          bookingId: booking.id,
          transactionCode: vnpTransactionNo || `FAILED_${Date.now()}`,
          gateway: PaymentGateway.VNPAY,
          amount: vnpAmount,
          status: TransactionStatus.FAILED,
          gatewayResponse: query,
        });
        await queryRunner.manager.save(Transaction, transaction);
        await queryRunner.commitTransaction();

        this.logger.warn(`Thanh toán thất bại cho đơn ${bookingCode}. Mã lỗi VNPAY: ${vnpResponseCode}`);
        return { RspCode: '00', Message: 'Confirm Success' };
      }
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Lỗi trong quá trình xử lý VNPAY IPN:', err);
      return { RspCode: '99', Message: 'Unknown error' };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 3. XỬ LÝ RETURN URL (KHI KHÁCH ĐƯỢC CHUYỂN HƯỚNG VỀ SAU KHI THANH TOÁN)
   */
  verifyReturnUrl(query: Record<string, any>): {
    isSuccess: boolean;
    bookingCode: string;
    amount: number;
    transactionNo: string;
    message: string;
  } {
    const secureHash = query['vnp_SecureHash'];
    const queryCopy = { ...query };
    delete queryCopy['vnp_SecureHash'];
    delete queryCopy['vnp_SecureHashType'];

    const { signData } = this.sortAndBuildSignData(queryCopy);
    const checkHash = this.hmacSHA512(this.config.hashSecret, signData);

    const isMatch = secureHash && secureHash.toLowerCase() === checkHash.toLowerCase();
    const isSuccess = isMatch && query['vnp_ResponseCode'] === '00';

    return {
      isSuccess,
      bookingCode: query['vnp_TxnRef'] || '',
      amount: Number(query['vnp_Amount'] || 0) / 100,
      transactionNo: query['vnp_TransactionNo'] || '',
      message: isSuccess
        ? 'Giao dịch thành công. Vé đã được gửi qua Email/SMS của bạn.'
        : 'Giao dịch không thành công hoặc đã bị hủy.',
    };
  }
}
