import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePaymentUrlDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  orderInfo: string; // Ví dụ: "Thanh toan ve xe giuong nam SG-DL ma TNT-123456"

  @IsString()
  @IsOptional()
  returnUrl?: string; // Tùy chọn override URL callback trả về app/web
}
