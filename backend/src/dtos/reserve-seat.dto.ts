import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ReserveSeatDto {
  @IsUUID()
  @IsNotEmpty()
  tripId: string;

  @IsUUID()
  @IsNotEmpty()
  seatId: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsUUID()
  @IsNotEmpty()
  pickupPointId: string;

  @IsUUID()
  @IsNotEmpty()
  dropoffPointId: string;
}
