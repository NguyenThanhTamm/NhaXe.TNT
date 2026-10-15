import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentGateway } from '../entities/transaction.entity';

export class PaymentWebhookDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  transactionCode: string;

  @IsEnum(PaymentGateway)
  @IsNotEmpty()
  gateway: PaymentGateway;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  status: 'SUCCESS' | 'FAILED'; // Trạng thái thanh toán từ cổng

  @IsOptional()
  rawPayload?: any; // Toàn bộ payload từ VNPay/MoMo
}
