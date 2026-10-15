import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { TripQueryService } from '../services/trip-query.service';
import { SearchTripsDto } from '../dtos/search-trips.dto';

@Controller('api/v1/trips')
export class TripsController {
  constructor(private readonly tripQueryService: TripQueryService) {}

  /**
   * API 1: Tìm kiếm chuyến xe
   * GET /api/v1/trips/search?fromCity=Sài Gòn&toCity=Đà Lạt&departureDate=2026-10-15
   */
  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchTrips(
    @Query(new ValidationPipe({ transform: true })) dto: SearchTripsDto,
  ) {
    return await this.tripQueryService.searchTrips(dto);
  }

  /**
   * API 2: Lấy sơ đồ giường của chuyến xe (Phân tầng 1 và tầng 2)
   * GET /api/v1/trips/:tripId/seats
   */
  @Get(':tripId/seats')
  @HttpCode(HttpStatus.OK)
  async getTripSeats(@Param('tripId') tripId: string) {
    return await this.tripQueryService.getTripSeats(tripId);
  }
}
