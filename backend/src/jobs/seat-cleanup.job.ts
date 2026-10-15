import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, LessThan } from 'typeorm';
import { TripSeat, SeatStatus } from '../entities/trip-seat.entity';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { SeatGateway } from '../gateways/seat.gateway';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SeatCleanupJob {
  private readonly logger = new Logger(SeatCleanupJob.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly seatGateway: SeatGateway,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Chạy định kỳ mỗi phút: Quét và giải phóng các giường bị giữ quá 10 phút mà không thanh toán
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredSeats() {
    const now = new Date();

    // 1. Tìm các ghế HOLDING đã quá hạn
    const expiredSeats = await this.dataSource.getRepository(TripSeat).find({
      where: {
        status: SeatStatus.HOLDING,
        holdExpiresAt: LessThan(now),
      },
      relations: ['seat'],
    });

    if (expiredSeats.length === 0) {
      return;
    }

    this.logger.log(`Phát hiện ${expiredSeats.length} ghế quá hạn 10 phút. Bắt đầu giải phóng...`);

    for (const ts of expiredSeats) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Cập nhật lại ghế về AVAILABLE
        ts.status = SeatStatus.AVAILABLE;
        ts.holdExpiresAt = null;
        ts.holdSessionId = null;
        await queryRunner.manager.save(TripSeat, ts);

        // Hủy đơn đặt vé quá hạn
        await queryRunner.manager.update(
          Booking,
          {
            tripId: ts.tripId,
            status: BookingStatus.PENDING_PAYMENT,
            holdExpiresAt: LessThan(now),
          },
          { status: BookingStatus.EXPIRED },
        );

        await queryRunner.commitTransaction();

        // Xóa lock còn sót trên Redis
        await this.redisService.removeSeatLock(ts.tripId, ts.seatId);

        // Bắn WebSocket báo cho tất cả người dùng trong phòng là ghế này đã mở lại
        this.seatGateway.notifySeatReleased(
          ts.tripId,
          ts.seatId,
          ts.seat?.seatCode || 'A',
        );

        this.logger.log(`Đã mở lại giường ${ts.seat?.seatCode} trên chuyến ${ts.tripId}`);
      } catch (err) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Lỗi khi giải phóng ghế ${ts.id}:`, err);
      } finally {
        await queryRunner.release();
      }
    }
  }
}
