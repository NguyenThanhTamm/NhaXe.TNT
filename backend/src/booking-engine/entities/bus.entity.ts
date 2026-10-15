import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Trip } from './trip.entity';

export enum BusTypeEnum {
  GIUONG_NAM_36 = 'GIUONG_NAM_36',
  GIUONG_NAM_40 = 'GIUONG_NAM_40',
  LIMOUSINE_22 = 'LIMOUSINE_22',
  LIMOUSINE_34 = 'LIMOUSINE_34',
}

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plate_number', unique: true, length: 20 })
  plateNumber: string;

  @Column({
    name: 'bus_type',
    type: 'enum',
    enum: BusTypeEnum,
    default: BusTypeEnum.GIUONG_NAM_36,
  })
  busType: BusTypeEnum;

  @Column({ name: 'total_floors', type: 'int', default: 2 })
  totalFloors: number;

  @Column({ name: 'floor_seats_count', type: 'int' })
  floorSeatsCount: number;

  @OneToMany(() => Trip, (trip) => trip.bus)
  trips: Trip[];
}
