import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { VnpayPaymentService } from '../services/vnpay-payment.service';

export class CreatePaymentBodyDto {
  bookingId: string;
  amount: number;
  orderInfo?: string;
}

@Controller('api/v1/vnpay')
export class VnpayPaymentController {
  constructor(private readonly vnpayService: VnpayPaymentService) {}

  /**
   * 1. API Tạo URL thanh toán VNPAY (Redirect URL)
   * POST /api/v1/vnpay/create-payment-url
   */
  @Post('create-payment-url')
  @HttpCode(HttpStatus.OK)
  async createPaymentUrl(@Body() body: CreatePaymentBodyDto, @Req() req: Request) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const paymentUrl = await this.vnpayService.createPaymentUrl(
      body.bookingId,
      body.amount,
      body.orderInfo || '',
      clientIp,
    );

    return {
      success: true,
      message: 'Tạo URL thanh toán VNPAY thành công',
      paymentUrl,
    };
  }

  /**
   * 2. API Nhận kết quả IPN Webhook Server-to-Server từ VNPAY
   * GET /api/v1/vnpay/vnpay_ipn
   */
  @Get('vnpay_ipn')
  @HttpCode(HttpStatus.OK)
  async handleVnpayIpn(@Query() query: Record<string, any>) {
    return await this.vnpayService.handleVnpayIpn(query);
  }

  /**
   * 3. API Điều hướng trình duyệt khách hàng sau khi thanh toán xong
   * GET /api/v1/vnpay/return
   */
  @Get('return')
  handleVnpayReturn(@Query() query: Record<string, any>) {
    return this.vnpayService.verifyReturnUrl(query);
  }
}
