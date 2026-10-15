import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  VersionColumn,
  Unique,
} from 'typeorm';
import { Trip } from './trip.entity';
import { Seat } from './seat.entity';

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE', // Ghế trống, có thể chọn
  HOLDING = 'HOLDING',     // Đang được giữ trong 10 phút chờ thanh toán
  BOOKED = 'BOOKED',       // Đã thanh toán, vé đã xuất
  LOCKED = 'LOCKED',       // Bị khóa bởi nhà xe
}

@Entity('trip_seats')
@Unique(['tripId', 'seatId'])
export class TripSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'seat_id', type: 'uuid' })
  seatId: string;

  @ManyToOne(() => Seat, { eager: true })
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ name: 'hold_session_id', nullable: true })
  holdSessionId: string;

  @Column({ name: 'hold_expires_at', type: 'timestamptz', nullable: true })
  holdExpiresAt: Date;

  @VersionColumn({ default: 0 })
  version: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
