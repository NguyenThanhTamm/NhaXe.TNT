import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Trip } from './trip.entity';

export enum SeatStatusEnum {
  AVAILABLE = 'AVAILABLE',
  HOLDING = 'HOLDING',
  BOOKED = 'BOOKED',
}

@Entity('trip_seats')
@Unique(['tripId', 'seatCode'])
export class TripSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, (t) => t.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'seat_code', length: 10 })
  seatCode: string;

  @Column({ type: 'int' })
  floor: number; // 1 hoặc 2

  @Column({ name: 'row_num', type: 'int' })
  row: number;

  @Column({ name: 'col_num', type: 'int' })
  col: number; // 1: Trái, 2: Giữa, 3: Phải

  @Column({
    type: 'enum',
    enum: SeatStatusEnum,
    default: SeatStatusEnum.AVAILABLE,
  })
  status: SeatStatusEnum;

  @Column({ name: 'holding_expires_at', type: 'timestamptz', nullable: true })
  holdingExpiresAt: Date;
}
