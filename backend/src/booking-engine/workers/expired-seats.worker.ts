import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource, LessThan } from 'typeorm';
import { TripSeat, SeatStatusEnum } from '../entities/trip-seat.entity';
import { RedisService } from '../../redis/redis.service';
import { SeatGateway } from '../../gateways/seat.gateway';

@Injectable()
export class ExpiredSeatsWorker {
  private readonly logger = new Logger(ExpiredSeatsWorker.name);
  private isRunning = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly seatGateway: SeatGateway,
  ) {}

  /**
   * API 4: BACKGROUND CRON JOB
   * Chạy mỗi 30 giây để quét và reset toàn bộ ghế hết hạn giữ (HOLDING quá hạn) về lại AVAILABLE
   */
  @Cron('*/30 * * * * *')
  async cleanExpiredHoldingSeats() {
    // Ngăn chặn chồng lấn nếu job trước chưa chạy xong
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;

    try {
      const now = new Date();

      // 1. Tìm tất cả các ghế đang ở trạng thái HOLDING và đã quá hạn
      const expiredSeats = await this.dataSource.getRepository(TripSeat).find({
        where: {
          status: SeatStatusEnum.HOLDING,
          holdingExpiresAt: LessThan(now),
        },
      });

      if (expiredSeats.length === 0) {
        return;
      }

      this.logger.log(
        `[WORKER] Phát hiện ${expiredSeats.length} ghế quá hạn 10 phút. Bắt đầu giải phóng...`,
      );

      // 2. Mở Transaction cập nhật hàng loạt về AVAILABLE
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        for (const seat of expiredSeats) {
          seat.status = SeatStatusEnum.AVAILABLE;
          seat.holdingExpiresAt = null;
          await queryRunner.manager.save(TripSeat, seat);
        }

        await queryRunner.commitTransaction();

        // 3. Xóa các key lock trên Redis và bắn WebSocket thông báo ghế đã mở lại
        for (const seat of expiredSeats) {
          const redisKey = `trip:${seat.tripId}:seat:${seat.seatCode}`;
          await this.redisService.getClient().del(redisKey);

          this.seatGateway.notifySeatReleased(
            seat.tripId,
            seat.id,
            seat.seatCode,
          );
        }

        this.logger.log(
          `[WORKER] Đã giải phóng thành công ${expiredSeats.length} ghế về trạng thái AVAILABLE.`,
        );
      } catch (err) {
        await queryRunner.rollbackTransaction();
        this.logger.error('[WORKER] Lỗi trong quá trình cập nhật DB:', err);
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error('[WORKER] Lỗi quét ghế hết hạn:', error);
    } finally {
      this.isRunning = false;
    }
  }
}
