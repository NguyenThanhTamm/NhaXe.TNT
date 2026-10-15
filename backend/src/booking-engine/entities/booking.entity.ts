import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { BookingItem } from './booking-item.entity';

export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethodEnum {
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  CASH = 'CASH',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_code', unique: true, length: 30 })
  bookingCode: string;

  @Column({ name: 'customer_name', length: 100 })
  customerName: string;

  @Column({ name: 'customer_phone', length: 15 })
  customerPhone: string;

  @Column({ name: 'customer_email', length: 100, nullable: true })
  customerEmail: string;

  @Column({ name: 'trip_id', type: 'uuid' })
  tripId: string;

  @Column({ name: 'pickup_point_id', type: 'uuid' })
  pickupPointId: string;

  @Column({ name: 'drop_point_id', type: 'uuid' })
  dropPointId: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatusEnum,
    default: PaymentStatusEnum.PENDING,
  })
  paymentStatus: PaymentStatusEnum;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethodEnum,
    default: PaymentMethodEnum.VNPAY,
  })
  paymentMethod: PaymentMethodEnum;

  @OneToMany(() => BookingItem, (item) => item.booking, { cascade: true })
  items: BookingItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
