import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SearchTripsDto {
  @IsString()
  @IsNotEmpty()
  fromCity: string; // Ví dụ: Sài Gòn hoặc TP.HCM

  @IsString()
  @IsNotEmpty()
  toCity: string; // Ví dụ: Đà Lạt

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'departureDate phải có định dạng YYYY-MM-DD' })
  departureDate: string; // Ví dụ: 2026-10-15
}
