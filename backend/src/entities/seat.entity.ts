import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum DeckType {
  LOWER = 'LOWER', // Tầng dưới (A)
  UPPER = 'UPPER', // Tầng trên (B)
}

@Entity('seats')
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bus_id', type: 'uuid' })
  busId: string;

  @Column({ name: 'seat_code', length: 10 })
  seatCode: string; // Ví dụ: A01, A12, B01

  @Column({ type: 'enum', enum: DeckType, default: DeckType.LOWER })
  deck: DeckType;

  @Column({ name: 'row_num', type: 'int' })
  rowNum: number;

  @Column({ name: 'col_num', type: 'int' })
  colNum: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
