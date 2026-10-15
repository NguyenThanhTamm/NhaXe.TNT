import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Route } from './route.entity';

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 50 })
  city: string; // Sài Gòn, Đà Lạt...

  @Column({ length: 255 })
  address: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Route, (route) => route.originStation)
  originRoutes: Route[];

  @OneToMany(() => Route, (route) => route.destinationStation)
  destinationRoutes: Route[];
}
