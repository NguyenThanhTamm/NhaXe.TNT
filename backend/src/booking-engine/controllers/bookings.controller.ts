import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { SeatHoldService } from '../services/seat-hold.service';
import { HoldSeatDto } from '../dtos/hold-seat.dto';

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly seatHoldService: SeatHoldService) {}

  /**
   * API 3: Giữ chỗ giường nằm (Atomic Multi-Seat Lock)
   * POST /api/v1/bookings/hold-seat
   * Body: { "tripId": "uuid", "seatCodes": ["A01", "A02"], "customerPhone": "0909123456" }
   */
  @Post('hold-seat')
  @HttpCode(HttpStatus.OK)
  async holdSeats(
    @Body(new ValidationPipe({ transform: true })) dto: HoldSeatDto,
  ) {
    return await this.seatHoldService.holdSeats(dto);
  }
}
