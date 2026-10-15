import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { HoldSeatDto } from '../dtos/hold-seat.dto';
import { TripSeat, SeatStatusEnum } from '../entities/trip-seat.entity';
import { Trip } from '../entities/trip.entity';
import { RedisService } from '../../redis/redis.service';
import { SeatGateway } from '../../gateways/seat.gateway';

@Injectable()
export class SeatHoldService {
  private readonly logger = new Logger(SeatHoldService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly seatGateway: SeatGateway,
  ) {}

  /**
   * API 3: CỐT LÕI - GIỮ CHỖ CHỐNG DOUBLE BOOKING BẰNG REDIS VÀ POSTGRESQL PESSIMISTIC LOCK
   */
  async holdSeats(dto: HoldSeatDto) {
    const { tripId, seatCodes, customerPhone } = dto;
    const holdDurationMinutes = 10;
    const ttlSeconds = holdDurationMinutes * 60; // 600 giây

    // Sắp xếp mã ghế theo thứ tự từ điển để tránh tình trạng Deadlock giữa 2 transaction
    const sortedSeatCodes = [...new Set(seatCodes)].sort();

    // Sinh mã token phiên giữ chỗ duy nhất
    const holdToken = `HOLD_${uuidv4()}`;

    // 1. ATOMIC LOCK TRÊN REDIS (Lớp phòng thủ 1 - All or Nothing)
    // Sử dụng LUA Script để đảm bảo hoặc khóa được TẤT CẢ các ghế, hoặc không khóa ghế nào
    const redisLockResult = await this.redisService.acquireMultiSeatLock(
      tripId,
      sortedSeatCodes,
      holdToken,
      ttlSeconds,
    );

    if (!redisLockResult.success) {
      throw new ConflictException(
        `Ghế [${redisLockResult.conflictSeatCode}] vừa có người chọn, vui lòng chọn ghế khác!`,
      );
    }

    // 2. MỞ DATABASE TRANSACTION VỚI PESSIMISTIC WRITE (Lớp phòng thủ 2)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Khóa dòng các ghế cần giữ bằng SELECT ... FOR UPDATE
      const dbSeats = await queryRunner.manager.find(TripSeat, {
        where: {
          tripId,
          seatCode: In(sortedSeatCodes),
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (dbSeats.length !== sortedSeatCodes.length) {
        throw new NotFoundException('Một hoặc nhiều mã ghế không tồn tại trên chuyến xe này.');
      }

      const now = new Date();

      // Kiểm tra trạng thái thực tế từng ghế trong DB
      for (const seat of dbSeats) {
        const isBooked = seat.status === SeatStatusEnum.BOOKED;
        const isHoldingValid =
          seat.status === SeatStatusEnum.HOLDING &&
          seat.holdingExpiresAt &&
          new Date(seat.holdingExpiresAt) > now;

        if (isBooked || isHoldingValid) {
          // Bất kỳ ghế nào không khả dụng -> Rollback DB và giải phóng Redis Lock
          await this.redisService.releaseMultiSeatLock(tripId, sortedSeatCodes, holdToken);
          throw new ConflictException(
            `Ghế [${seat.seatCode}] vừa có người chọn, vui lòng chọn ghế khác!`,
          );
        }
      }

      // 3. CẬP NHẬT TRẠNG THÁI TRONG DB THÀNH 'HOLDING' KÈM THỜI GIAN HẾT HẠN
      const holdingExpiresAt = new Date(Date.now() + ttlSeconds * 1000);

      for (const seat of dbSeats) {
        seat.status = SeatStatusEnum.HOLDING;
        seat.holdingExpiresAt = holdingExpiresAt;
        await queryRunner.manager.save(TripSeat, seat);
      }

      // 4. LƯU SESSION GIỮ CHỖ VÀO REDIS
      await this.redisService.saveHoldSession(
        holdToken,
        {
          tripId,
          seatCodes: sortedSeatCodes,
          customerPhone,
          expiresAt: holdingExpiresAt.toISOString(),
        },
        ttlSeconds,
      );

      // Commit Transaction cơ sở dữ liệu
      await queryRunner.commitTransaction();

      // 5. BẮN SOCKET THÔNG BÁO TỚI CÁC USER KHÁC ĐANG MỞ APP
      sortedSeatCodes.forEach((code) => {
        const seatObj = dbSeats.find((s) => s.seatCode === code);
        if (seatObj) {
          this.seatGateway.notifySeatHeld(tripId, seatObj.id, code, holdingExpiresAt);
        }
      });

      this.logger.log(
        `Giữ chỗ thành công ${sortedSeatCodes.join(', ')} cho khách ${customerPhone}. Token: ${holdToken}`,
      );

      return {
        success: true,
        message: `Đã giữ thành công các ghế [${sortedSeatCodes.join(', ')}] trong 10 phút.`,
        data: {
          holdToken,
          tripId,
          seatCodes: sortedSeatCodes,
          customerPhone,
          holdingExpiresAt,
          expiresInSeconds: ttlSeconds,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // Đảm bảo không để sót lock rác trên Redis nếu gặp lỗi
      await this.redisService.releaseMultiSeatLock(tripId, sortedSeatCodes, holdToken);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
