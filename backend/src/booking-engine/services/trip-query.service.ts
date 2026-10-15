import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SearchTripsDto } from '../dtos/search-trips.dto';
import { Trip, TripStatusEnum } from '../entities/trip.entity';
import { TripSeat, SeatStatusEnum } from '../entities/trip-seat.entity';

@Injectable()
export class TripQueryService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * API 1: Tìm kiếm chuyến xe phù hợp và đếm số giường trống
   */
  async searchTrips(dto: SearchTripsDto) {
    const { fromCity, toCity, departureDate } = dto;

    const startOfDay = new Date(`${departureDate}T00:00:00.000Z`);
    const endOfDay = new Date(`${departureDate}T23:59:59.999Z`);

    // Dùng QueryBuilder để JOIN các bảng liên quan
    const trips = await this.dataSource
      .getRepository(Trip)
      .createQueryBuilder('trip')
      .innerJoinAndSelect('trip.route', 'route')
      .innerJoinAndSelect('route.originStation', 'origin')
      .innerJoinAndSelect('route.destinationStation', 'destination')
      .innerJoinAndSelect('trip.bus', 'bus')
      .where('LOWER(origin.city) LIKE LOWER(:fromCity)', { fromCity: `%${fromCity}%` })
      .andWhere('LOWER(destination.city) LIKE LOWER(:toCity)', { toCity: `%${toCity}%` })
      .andWhere('trip.departureTime BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
      .andWhere('trip.status = :status', { status: TripStatusEnum.SCHEDULED })
      .orderBy('trip.departureTime', 'ASC')
      .getMany();

    const now = new Date();

    // Duyệt qua từng chuyến để tính số lượng giường còn trống thực tế
    const results = await Promise.all(
      trips.map(async (trip) => {
        // Đếm các ghế AVAILABLE hoặc HOLDING nhưng đã quá hạn giữ
        const availableSeatsCount = await this.dataSource
          .getRepository(TripSeat)
          .createQueryBuilder('ts')
          .where('ts.tripId = :tripId', { tripId: trip.id })
          .andWhere(
            '(ts.status = :available OR (ts.status = :holding AND ts.holdingExpiresAt < :now))',
            {
              available: SeatStatusEnum.AVAILABLE,
              holding: SeatStatusEnum.HOLDING,
              now,
            },
          )
          .getCount();

        return {
          tripId: trip.id,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          price: Number(trip.price),
          availableSeatsCount,
          route: {
            originStation: trip.route.originStation.name,
            originCity: trip.route.originStation.city,
            destinationStation: trip.route.destinationStation.name,
            destinationCity: trip.route.destinationStation.city,
            distanceKm: Number(trip.route.distanceKm),
            durationMinutes: trip.route.estimatedDurationMinutes,
          },
          bus: {
            plateNumber: trip.bus.plateNumber,
            busType: trip.bus.busType,
            totalFloors: trip.bus.totalFloors,
            totalSeats: trip.bus.floorSeatsCount * trip.bus.totalFloors,
          },
        };
      }),
    );

    return {
      success: true,
      totalTrips: results.length,
      departureDate,
      fromCity,
      toCity,
      data: results,
    };
  }

  /**
   * API 2: Lấy sơ đồ toàn bộ giường phân tầng 1 và tầng 2
   */
  async getTripSeats(tripId: string) {
    const trip = await this.dataSource.getRepository(Trip).findOne({
      where: { id: tripId },
      relations: ['route', 'bus'],
    });

    if (!trip) {
      throw new NotFoundException(`Không tìm thấy chuyến xe có mã ${tripId}`);
    }

    const seats = await this.dataSource.getRepository(TripSeat).find({
      where: { tripId },
      order: {
        floor: 'ASC',
        row: 'ASC',
        col: 'ASC',
      },
    });

    const now = new Date();
    const floor1Seats: any[] = [];
    const floor2Seats: any[] = [];

    let countAvailable = 0;
    let countHolding = 0;
    let countBooked = 0;

    for (const seat of seats) {
      // Đánh giá trạng thái thực tế: nếu HOLDING mà quá hạn -> tính là AVAILABLE
      let actualStatus = seat.status;
      if (
        seat.status === SeatStatusEnum.HOLDING &&
        seat.holdingExpiresAt &&
        new Date(seat.holdingExpiresAt) < now
      ) {
        actualStatus = SeatStatusEnum.AVAILABLE;
      }

      if (actualStatus === SeatStatusEnum.AVAILABLE) countAvailable++;
      else if (actualStatus === SeatStatusEnum.HOLDING) countHolding++;
      else if (actualStatus === SeatStatusEnum.BOOKED) countBooked++;

      const seatItem = {
        id: seat.id,
        seatCode: seat.seatCode,
        floor: seat.floor,
        row: seat.row,
        col: seat.col, // 1: Trái, 2: Giữa, 3: Phải
        status: actualStatus,
        price: Number(trip.price),
        holdingExpiresAt: actualStatus === SeatStatusEnum.HOLDING ? seat.holdingExpiresAt : null,
      };

      if (seat.floor === 1) {
        floor1Seats.push(seatItem);
      } else {
        floor2Seats.push(seatItem);
      }
    }

    return {
      success: true,
      tripId: trip.id,
      plateNumber: trip.bus?.plateNumber,
      departureTime: trip.departureTime,
      summary: {
        totalSeats: seats.length,
        available: countAvailable,
        holding: countHolding,
        booked: countBooked,
      },
      layout: {
        floor1: {
          label: 'Tầng Dưới (Dãy A)',
          seats: floor1Seats,
        },
        floor2: {
          label: 'Tầng Trên (Dãy B)',
          seats: floor2Seats,
        },
      },
    };
  }
}
