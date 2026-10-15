import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('tickets')
@Unique(['tripId', 'seatId']) // Cấm trùng ghế trên cùng 1 chuyến
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_code', unique: true, length: 30 })
  ticketCode: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @ManyToOne(() => Booking, (booking) => booking.tickets)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'trip_id', type: 'uuid' })
  tripId: string;

  @Column({ name: 'seat_id', type: 'uuid' })
  seatId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ name: 'is_boarded', default: false })
  isBoarded: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
