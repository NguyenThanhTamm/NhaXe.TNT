import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { ReservationService } from '../services/reservation.service';
import { ReserveSeatDto } from '../dtos/reserve-seat.dto';
import { PaymentWebhookDto } from '../dtos/payment-webhook.dto';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  /**
   * API 1: Người dùng chọn giường và giữ chỗ 10 phút
   * POST /reservations/hold
   */
  @Post('hold')
  @HttpCode(HttpStatus.OK)
  async holdSeat(@Body(new ValidationPipe({ transform: true })) dto: ReserveSeatDto) {
    return await this.reservationService.holdSeat(dto);
  }

  /**
   * API 2: Lấy sơ đồ giường của chuyến đi
   * GET /reservations/trips/:tripId/seats
   */
  @Get('trips/:tripId/seats')
  async getTripSeats(@Param('tripId') tripId: string) {
    return await this.reservationService.getTripSeats(tripId);
  }

  /**
   * API 3: Webhook nhận kết quả thanh toán từ VNPay / MoMo
   * POST /reservations/webhook/payment
   */
  @Post('webhook/payment')
  @HttpCode(HttpStatus.OK)
  async handlePaymentWebhook(
    @Body(new ValidationPipe({ transform: true })) dto: PaymentWebhookDto,
  ) {
    return await this.reservationService.processPaymentWebhook(dto);
  }
}
