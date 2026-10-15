import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { VnpayService } from './vnpay.service';
import { CreatePaymentUrlDto } from './dtos/create-payment-url.dto';

@Controller('vnpay')
export class VnpayController {
  constructor(private readonly vnpayService: VnpayService) {}

  /**
   * API 1: Tạo đường link thanh toán VNPAY (Redirect URL)
   * POST /vnpay/create-payment-url
   */
  @Post('create-payment-url')
  @HttpCode(HttpStatus.OK)
  async createPaymentUrl(
    @Body(new ValidationPipe({ transform: true })) dto: CreatePaymentUrlDto,
    @Req() req: Request,
  ) {
    // Trích xuất IP khách hàng
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const paymentUrl = await this.vnpayService.createPaymentUrl(dto, clientIp);
    return {
      success: true,
      message: 'Tạo URL thanh toán VNPAY thành công',
      paymentUrl,
    };
  }

  /**
   * API 2: Nhận kết quả IPN Webhook Server-to-Server từ VNPAY
   * GET /vnpay/vnpay_ipn
   * Lưu ý: Cổng VNPAY gọi bằng phương thức HTTP GET kèm Query parameters
   */
  @Get('vnpay_ipn')
  @HttpCode(HttpStatus.OK)
  async handleVnpayIpn(@Query() query: Record<string, any>) {
    return await this.vnpayService.processIpn(query);
  }

  /**
   * API 3: URL Khách hàng được chuyển hướng về sau khi thanh toán trên cổng VNPAY
   * GET /vnpay/vnpay_return
   */
  @Get('vnpay_return')
  handleVnpayReturn(@Query() query: Record<string, any>) {
    const result = this.vnpayService.verifyReturnUrl(query);
    return {
      status: result.isSuccess ? 'SUCCESS' : 'FAILED',
      bookingCode: result.bookingCode,
      amount: result.amount,
      transactionNo: result.transactionNo,
      message: result.message,
    };
  }
}
