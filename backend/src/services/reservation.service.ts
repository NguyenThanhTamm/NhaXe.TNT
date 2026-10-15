import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { SeatGateway } from '../gateways/seat.gateway';
import { ReserveSeatDto } from '../dtos/reserve-seat.dto';
import { PaymentWebhookDto } from '../dtos/payment-webhook.dto';
import { TripSeat, SeatStatus } from '../entities/trip-seat.entity';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { Ticket } from '../entities/ticket.entity';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { Seat } from '../entities/seat.entity';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly seatGateway: SeatGateway,
  ) {}

  /**
   * 1. GIỮ GHẾ TẠM THỜI TRONG 10 PHÚT (RESERVE / HOLD SEAT)
   */
  async holdSeat(dto: ReserveSeatDto, userId?: string) {
    const { tripId, seatId } = dto;
    const holdDurationMinutes = 10;
    const holdDurationSeconds = holdDurationMinutes * 60;

    // A. Khóa nhanh tầng Redis bằng SET NX EX (Tránh tải DB nếu có nghìn user cùng tranh 1 ghế)
    const tempSessionId = `hold_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const acquiredLock = await this.redisService.acquireSeatLock(
      tripId,
      seatId,
      tempSessionId,
      holdDurationSeconds,
    );

    if (!acquiredLock) {
      throw new ConflictException(
        'Ghế này hiện đang có người khác giữ chỗ hoặc đã được đặt. Vui lòng chọn ghế khác!',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // B. Kiểm tra và khóa dòng trong PostgreSQL (Pessimistic Lock)
      const tripSeat = await queryRunner.manager.findOne(TripSeat, {
        where: { tripId, seatId },
        relations: ['seat'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!tripSeat) {
        throw new NotFoundException('Không tìm thấy thông tin giường trên chuyến xe này.');
      }

      // Kiểm tra trạng thái thực tế
      const now = new Date();
      const isAlreadyBooked = tripSeat.status === SeatStatus.BOOKED;
      const isCurrentlyHolding =
        tripSeat.status === SeatStatus.HOLDING &&
        tripSeat.holdExpiresAt &&
        tripSeat.holdExpiresAt > now;

      if (isAlreadyBooked || isCurrentlyHolding) {
        // Nhả lock Redis nếu DB báo ghế không hợp lệ
        await this.redisService.releaseSeatLock(tripId, seatId, tempSessionId);
        throw new ConflictException('Ghế này không còn khả dụng.');
      }

      // C. Cập nhật trạng thái ghế sang HOLDING
      const holdExpiresAt = new Date(Date.now() + holdDurationSeconds * 1000);
      tripSeat.status = SeatStatus.HOLDING;
      tripSeat.holdSessionId = tempSessionId;
      tripSeat.holdExpiresAt = holdExpiresAt;
      await queryRunner.manager.save(TripSeat, tripSeat);

      // D. Tạo đơn đặt chỗ ở trạng thái PENDING_PAYMENT
      const bookingCode = `TNT-${Math.floor(100000 + Math.random() * 900000)}`;
      const booking = queryRunner.manager.create(Booking, {
        bookingCode,
        userId: userId || null,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail || null,
        tripId,
        pickupPointId: dto.pickupPointId,
        dropoffPointId: dto.dropoffPointId,
        totalAmount: tripSeat.price,
        discountAmount: 0,
        finalAmount: tripSeat.price,
        status: BookingStatus.PENDING_PAYMENT,
        holdExpiresAt,
      });

      const savedBooking = await queryRunner.manager.save(Booking, booking);
      await queryRunner.commitTransaction();

      // E. Bắn WebSocket thông báo đến tất cả các client đang xem chuyến này
      this.seatGateway.notifySeatHeld(
        tripId,
        seatId,
        tripSeat.seat.seatCode,
        holdExpiresAt,
      );

      return {
        success: true,
        message: `Đã giữ giường ${tripSeat.seat.seatCode} thành công trong ${holdDurationMinutes} phút để thanh toán.`,
        bookingId: savedBooking.id,
        bookingCode: savedBooking.bookingCode,
        seatCode: tripSeat.seat.seatCode,
        amount: savedBooking.finalAmount,
        holdExpiresAt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.redisService.releaseSeatLock(tripId, seatId, tempSessionId);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 2. XỬ LÝ THANH TOÁN THÀNH CÔNG TỪ CỔNG THANH TOÁN (WEBHOOK IPN)
   */
  async processPaymentWebhook(dto: PaymentWebhookDto) {
    const { bookingId, transactionCode, gateway, amount, status, rawPayload } = dto;

    if (status !== 'SUCCESS') {
      this.logger.warn(`Giao dịch ${transactionCode} không thành công: ${status}`);
      return { success: false, message: 'Thanh toán không thành công' };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let tripIdToNotify = '';
    let seatIdToNotify = '';
    let seatCodeToNotify = '';

    try {
      // A. Khóa bản ghi Booking bằng FOR UPDATE để chống IPN gọi lặp 2 lần
      const booking = await queryRunner.manager.findOne(Booking, {
        where: { id: bookingId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) {
        throw new NotFoundException(`Booking ID ${bookingId} không tồn tại.`);
      }

      // Idempotency: Nếu đã xác nhận rồi thì bỏ qua
      if (booking.status === BookingStatus.CONFIRMED) {
        await queryRunner.rollbackTransaction();
        return { success: true, message: 'Đơn hàng này đã được xác nhận trước đó.' };
      }

      // B. Khóa bản ghi giường TripSeat
      const tripSeat = await queryRunner.manager.findOne(TripSeat, {
        where: { tripId: booking.tripId, status: SeatStatus.HOLDING },
        relations: ['seat'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!tripSeat) {
        throw new BadRequestException('Không tìm thấy thông tin ghế đang giữ của đơn đặt này.');
      }

      tripIdToNotify = tripSeat.tripId;
      seatIdToNotify = tripSeat.seatId;
      seatCodeToNotify = tripSeat.seat?.seatCode || '';

      // C. Cập nhật trạng thái ghế sang BOOKED (Đã đặt)
      tripSeat.status = SeatStatus.BOOKED;
      tripSeat.holdExpiresAt = null;
      tripSeat.holdSessionId = null;
      await queryRunner.manager.save(TripSeat, tripSeat);

      // D. Cập nhật trạng thái Booking sang CONFIRMED
      booking.status = BookingStatus.CONFIRMED;
      await queryRunner.manager.save(Booking, booking);

      // E. Tạo Vé điện tử (Ticket) với Unique Constraint đảm bảo 1 ghế chỉ có 1 vé
      const ticketCode = `TK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const ticket = queryRunner.manager.create(Ticket, {
        ticketCode,
        bookingId: booking.id,
        tripId: tripSeat.tripId,
        seatId: tripSeat.seatId,
        price: booking.finalAmount,
      });
      await queryRunner.manager.save(Ticket, ticket);

      // F. Ghi nhận giao dịch thanh toán
      const transaction = queryRunner.manager.create(Transaction, {
        bookingId: booking.id,
        transactionCode,
        gateway,
        amount,
        status: TransactionStatus.SUCCESS,
        gatewayResponse: rawPayload || {},
        paidAt: new Date(),
      });
      await queryRunner.manager.save(Transaction, transaction);

      // G. Commit Transaction cơ sở dữ liệu
      await queryRunner.commitTransaction();

      // H. Dọn sạch Lock Redis & Thông báo WebSocket tới toàn bộ người dùng
      await this.redisService.removeSeatLock(tripIdToNotify, seatIdToNotify);
      this.seatGateway.notifySeatBooked(tripIdToNotify, seatIdToNotify, seatCodeToNotify);

      this.logger.log(`Xuất vé thành công: Booking ${booking.bookingCode}, Giường: ${seatCodeToNotify}`);

      return {
        success: true,
        message: 'Thanh toán và xuất vé thành công',
        ticketCode,
        bookingCode: booking.bookingCode,
        seatCode: seatCodeToNotify,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Lỗi khi xử lý payment webhook:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 3. LẤY SƠ ĐỒ VÀ TRẠNG THÁI GIƯỜNG CỦA MỘT CHUYẾN XE
   */
  async getTripSeats(tripId: string) {
    const tripSeats = await this.dataSource.getRepository(TripSeat).find({
      where: { tripId },
      relations: ['seat'],
      order: {
        seat: {
          deck: 'ASC',
          rowNum: 'ASC',
          colNum: 'ASC',
        },
      },
    });

    const now = new Date();

    // Map lại trạng thái theo thời gian thực (nếu ghế holding bị quá hạn thì hiển thị là AVAILABLE)
    return tripSeats.map((ts) => {
      let currentStatus = ts.status;
      if (ts.status === SeatStatus.HOLDING && ts.holdExpiresAt && ts.holdExpiresAt < now) {
        currentStatus = SeatStatus.AVAILABLE;
      }

      return {
        id: ts.id,
        seatId: ts.seatId,
        seatCode: ts.seat.seatCode,
        deck: ts.seat.deck,
        row: ts.seat.rowNum,
        col: ts.seat.colNum,
        price: ts.price,
        status: currentStatus,
        holdExpiresAt: currentStatus === SeatStatus.HOLDING ? ts.holdExpiresAt : null,
      };
    });
  }
}
