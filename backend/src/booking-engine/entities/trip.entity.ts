import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Route } from './route.entity';
import { Bus } from './bus.entity';
import { TripSeat } from './trip-seat.entity';

export enum TripStatusEnum {
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'route_id', type: 'uuid' })
  routeId: string;

  @ManyToOne(() => Route, (r) => r.trips)
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @Column({ name: 'bus_id', type: 'uuid' })
  busId: string;

  @ManyToOne(() => Bus, (b) => b.trips)
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  @Column({ name: 'departure_time', type: 'timestamptz' })
  departureTime: Date;

  @Column({ name: 'arrival_time', type: 'timestamptz' })
  arrivalTime: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: TripStatusEnum,
    default: TripStatusEnum.SCHEDULED,
  })
  status: TripStatusEnum;

  @OneToMany(() => TripSeat, (ts) => ts.trip)
  seats: TripSeat[];
}
