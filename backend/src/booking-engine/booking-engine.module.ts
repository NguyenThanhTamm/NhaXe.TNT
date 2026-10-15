import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Station } from './entities/station.entity';
import { Route } from './entities/route.entity';
import { Bus } from './entities/bus.entity';
import { Trip } from './entities/trip.entity';
import { TripSeat } from './entities/trip-seat.entity';
import { Booking } from './entities/booking.entity';
import { BookingItem } from './entities/booking-item.entity';

import { PaymentTransaction } from './entities/payment-transaction.entity';

import { TripQueryService } from './services/trip-query.service';
import { SeatHoldService } from './services/seat-hold.service';
import { VnpayPaymentService } from './services/vnpay-payment.service';
import { ExpiredSeatsWorker } from './workers/expired-seats.worker';
import { TripsController } from './controllers/trips.controller';
import { BookingsController } from './controllers/bookings.controller';
import { VnpayPaymentController } from './controllers/vnpay.controller';
import { SeatGateway } from '../gateways/seat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Station,
      Route,
      Bus,
      Trip,
      TripSeat,
      Booking,
      BookingItem,
      PaymentTransaction,
    ]),
  ],
  controllers: [TripsController, BookingsController, VnpayPaymentController],
  providers: [
    TripQueryService,
    SeatHoldService,
    VnpayPaymentService,
    ExpiredSeatsWorker,
  ],
  exports: [TripQueryService, SeatHoldService, VnpayPaymentService],
})
export class BookingEngineModule {}
