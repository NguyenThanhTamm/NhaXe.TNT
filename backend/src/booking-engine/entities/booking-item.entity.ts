import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Booking } from './booking.entity';
import { TripSeat } from './trip-seat.entity';

@Entity('booking_items')
export class BookingItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @ManyToOne(() => Booking, (b) => b.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'trip_seat_id', type: 'uuid', unique: true })
  tripSeatId: string;

  @OneToOne(() => TripSeat)
  @JoinColumn({ name: 'trip_seat_id' })
  tripSeat: TripSeat;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;
}
