import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { DataSource } from 'typeorm';
import { Booking, PaymentStatusEnum } from '../entities/booking.entity';
import { BookingItem } from '../entities/booking-item.entity';
import { TripSeat, SeatStatusEnum } from '../entities/trip-seat.entity';
import {
  PaymentTransaction,
  PaymentMethod,
  TransactionStatus,
} from '../entities/payment-transaction.entity';
import { RedisService } from '../../redis/redis.service';
import { SeatGateway } from '../../gateways/seat.gateway';

export interface VnpayConfig {
  tmnCode: string;
  hashSecret: string;
  vnpUrl: string;
  returnUrl: string;
}

@Injectable()
export class VnpayPaymentService {
  private readonly logger = new Logger(VnpayPaymentService.name);
  private readonly config: VnpayConfig;

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly seatGateway: SeatGateway,
  ) {
    // 1. Đọc cấu hình từ biến môi trường
    this.config = {
      tmnCode: process.env.VNP_TMN_CODE || 'DEMO_TNT_TMN',
      hashSecret: process.env.VNP_HASH_SECRET || 'SECRET_KEY_VNPAY_1234567890ABCDEF',
      vnpUrl: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/api/v1/vnpay/return',
    };
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
   * Sắp xếp từ điển (Alphabetical Order) và chuẩn hóa chuỗi dữ liệu ký
   * Tuân thủ đặc tả kỹ thuật VNPAY v2.1.0
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
   * Băm dữ liệu HMAC-SHA512 với chuỗi bí mật vnp_HashSecret
   */
  private hmacSHA512(key: string, data: string): string {
    return crypto.createHmac('sha512', key).update(Buffer.from(data, 'utf-8')).digest('hex');
  }

  /**
   * 2. HÀM TẠO LINK THANH TOÁN (createPaymentUrl)
   * @param bookingId Mã UUID của đơn đặt vé trong CSDL
   * @param amount Số tiền vé (VNĐ)
   * @param orderInfo Nội dung thanh toán (vd: "Thanh toan ve xe giuong nam Ma: FUTA-88239")
   * @param clientIp Địa chỉ IP của thiết bị khách hàng
   */
  async createPaymentUrl(
    bookingId: string,
    amount: number,
    orderInfo: string,
    clientIp: string,
  ): Promise<string> {
    const booking = await this.dataSource.getRepository(Booking).findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Không tìm thấy đơn đặt vé ${bookingId}`);
    }

    if (booking.paymentStatus === PaymentStatusEnum.PAID) {
      throw new BadRequestException('Đơn đặt vé này đã được thanh toán trước đó.');
    }

    const now = new Date();
    // VNPAY quy định: số tiền phải nhân 100 (không có phần thập phân)
    const vnpAmount = Math.round(Number(amount) * 100);
    const createDate = this.formatVnpDate(now);
    // Hạn thanh toán 10 phút, khớp hoàn hảo với Redis holding TTL
    const expireDate = this.formatVnpDate(new Date(now.getTime() + 10 * 60 * 1000));

    // Chuẩn hóa IP
    const cleanIp =
      clientIp.includes('::') || clientIp === 'localhost' ? '127.0.0.1' : clientIp;

    const vnpParams: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.config.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: booking.bookingCode, // Mã đơn hàng phía Merchant gửi sang
      vnp_OrderInfo: orderInfo || `Thanh toan ve xe Tam Nguyen Thanh Ma: ${booking.bookingCode}`,
      vnp_OrderType: 'other',
      vnp_Amount: vnpAmount,
      vnp_ReturnUrl: this.config.returnUrl,
      vnp_IpAddr: cleanIp,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // 1. Sắp xếp tham số A-Z và tạo chuỗi ký
    const { signData } = this.sortAndBuildSignData(vnpParams);

    // 2. Tính mã băm HMAC-SHA512
    const secureHash = this.hmacSHA512(this.config.hashSecret, signData);

    // 3. Trả về URL hoàn chỉnh
    const paymentUrl = `${this.config.vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
    this.logger.log(`Tạo link thanh toán VNPAY cho đơn ${booking.bookingCode} thành công.`);
    return paymentUrl;
  }

  /**
   * 3. WEBHOOK / IPN HANDLER (vnpayIpn)
   * Nhận request GET từ server VNPAY gửi về server-to-server
   */
  async handleVnpayIpn(query: Record<string, any>): Promise<{ RspCode: string; Message: string }> {
    const secureHash = query['vnp_SecureHash'];
    const queryCopy = { ...query };
    delete queryCopy['vnp_SecureHash'];
    delete queryCopy['vnp_SecureHashType'];

    // Bước 1: Xác thực chữ ký số (Checksum Verification)
    const { signData } = this.sortAndBuildSignData(queryCopy);
    const checkHash = this.hmacSHA512(this.config.hashSecret, signData);

    if (!secureHash || secureHash.toLowerCase() !== checkHash.toLowerCase()) {
      this.logger.error(`Sai mã chữ ký VNPAY IPN! Nhận: ${secureHash}, Tính: ${checkHash}`);
      return { RspCode: '97', Message: 'Checksum failed' };
    }

    const bookingCode = query['vnp_TxnRef'];
    const vnpAmount = Number(query['vnp_Amount']) / 100; // Chia lại 100 ra VNĐ
    const vnpResponseCode = query['vnp_ResponseCode'];
    const vnpTransactionNo = query['vnp_TransactionNo'];

    // Bước 2: Mở Database Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2.1. Khóa bản ghi Booking bằng SELECT ... FOR UPDATE
      const booking = await queryRunner.manager.findOne(Booking, {
        where: { bookingCode },
        relations: ['items', 'items.tripSeat'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) {
        this.logger.warn(`Không tìm thấy đơn hàng mã ${bookingCode}`);
        await queryRunner.rollbackTransaction();
        return { RspCode: '01', Message: 'Order not found' };
      }

      // 2.2. Kiểm tra số tiền có khớp đơn hàng
      if (Math.round(Number(booking.totalAmount)) !== Math.round(vnpAmount)) {
        this.logger.error(`Số tiền không khớp! DB: ${booking.totalAmount}, VNPAY: ${vnpAmount}`);
        await queryRunner.rollbackTransaction();
        return { RspCode: '04', Message: 'Invalid amount' };
      }

      // 2.3. Kiểm tra tính Idempotent (Đơn hàng đã được xác nhận chưa)
      if (booking.paymentStatus === PaymentStatusEnum.PAID) {
        await queryRunner.rollbackTransaction();
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      // Bước 3: Kiểm tra mã phản hồi vnp_ResponseCode === '00' (Thành công)
      if (vnpResponseCode === '00') {
        // A. Cập nhật bảng bookings -> payment_status = 'PAID'
        booking.paymentStatus = PaymentStatusEnum.PAID;
        await queryRunner.manager.save(Booking, booking);

        // B. Lấy các ghế liên quan (qua booking_items hoặc các ghế HOLDING của chuyến)
        let seatsToBook: TripSeat[] = [];

        if (booking.items && booking.items.length > 0) {
          seatsToBook = booking.items.map((item) => item.tripSeat).filter(Boolean);
        } else {
          // Trường hợp booking tạo trước khi giữ ghế
          seatsToBook = await queryRunner.manager.find(TripSeat, {
            where: {
              tripId: booking.tripId,
              status: SeatStatusEnum.HOLDING,
            },
            lock: { mode: 'pessimistic_write' },
          });
        }

        // C. Cập nhật toàn bộ trip_seats sang 'BOOKED' & Xóa key lock trong Redis
        for (const seat of seatsToBook) {
          seat.status = SeatStatusEnum.BOOKED;
          seat.holdingExpiresAt = null;
          await queryRunner.manager.save(TripSeat, seat);

          // Xóa key lock trong Redis: trip:{tripId}:seat:{seatCode}
          const redisKey = `trip:${seat.tripId}:seat:${seat.seatCode}`;
          await this.redisService.getClient().del(redisKey);

          // Bắn WebSocket thông báo tới toàn bộ người dùng đang mở sơ đồ xe
          this.seatGateway.notifySeatBooked(seat.tripId, seat.id, seat.seatCode);
        }

        // D. Ghi nhận log vào bảng payment_transactions
        const transaction = queryRunner.manager.create(PaymentTransaction, {
          bookingId: booking.id,
          transactionNo: vnpTransactionNo || `VNP_${Date.now()}`,
          gateway: PaymentMethod.VNPAY,
          amount: vnpAmount,
          responseData: query,
          status: TransactionStatus.SUCCESS,
        });
        await queryRunner.manager.save(PaymentTransaction, transaction);

        // Commit toàn bộ thay đổi an toàn vào PostgreSQL
        await queryRunner.commitTransaction();

        this.logger.log(
          `[VNPAY IPN] Thanh toán THÀNH CÔNG cho đơn ${bookingCode}. Đã chuyển ${seatsToBook.length} ghế sang BOOKED.`,
        );

        // E. Trả về đúng format VNPAY yêu cầu
        return { RspCode: '00', Message: 'Confirm Success' };
      } else {
        // Giao dịch không thành công tại cổng VNPAY
        booking.paymentStatus = PaymentStatusEnum.FAILED;
        await queryRunner.manager.save(Booking, booking);

        const failedTransaction = queryRunner.manager.create(PaymentTransaction, {
          bookingId: booking.id,
          transactionNo: vnpTransactionNo || `VNP_FAIL_${Date.now()}`,
          gateway: PaymentMethod.VNPAY,
          amount: vnpAmount,
          responseData: query,
          status: TransactionStatus.FAILED,
        });
        await queryRunner.manager.save(PaymentTransaction, failedTransaction);

        await queryRunner.commitTransaction();
        this.logger.warn(`[VNPAY IPN] Giao dịch thất bại cho đơn ${bookingCode}. Mã lỗi: ${vnpResponseCode}`);

        return { RspCode: '00', Message: 'Confirm Success' };
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('[VNPAY IPN] Lỗi hệ thống trong transaction:', error);
      return { RspCode: '99', Message: 'Unknown error' };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 4. HÀM KIỂM TRA CHỮ KÝ RETURN URL (DÀNH CHO TRÌNH DUYỆT KHÁCH HÀNG REDIRECT VỀ)
   */
  verifyReturnUrl(query: Record<string, any>) {
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
      responseCode: query['vnp_ResponseCode'],
      message: isSuccess
        ? 'Thanh toán thành công. Chúc quý khách có chuyến đi thượng lộ bình an!'
        : 'Thanh toán không thành công hoặc giao dịch đã bị hủy.',
    };
  }
}
