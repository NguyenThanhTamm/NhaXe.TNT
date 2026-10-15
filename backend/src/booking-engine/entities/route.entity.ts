import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Station } from './station.entity';
import { Trip } from './trip.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'origin_station_id', type: 'uuid' })
  originStationId: string;

  @ManyToOne(() => Station, (s) => s.originRoutes)
  @JoinColumn({ name: 'origin_station_id' })
  originStation: Station;

  @Column({ name: 'destination_station_id', type: 'uuid' })
  destinationStationId: string;

  @ManyToOne(() => Station, (s) => s.destinationRoutes)
  @JoinColumn({ name: 'destination_station_id' })
  destinationStation: Station;

  @Column({ name: 'distance_km', type: 'decimal', precision: 6, scale: 2 })
  distanceKm: number;

  @Column({ name: 'estimated_duration_minutes', type: 'int' })
  estimatedDurationMinutes: number;

  @Column({ name: 'base_price', type: 'decimal', precision: 12, scale: 2 })
  basePrice: number;

  @OneToMany(() => Trip, (trip) => trip.route)
  trips: Trip[];
}
