import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { Seat } from './entities/seat.entity';
import { TripSeat } from './entities/trip-seat.entity';
import { Booking } from './entities/booking.entity';
import { Ticket } from './entities/ticket.entity';
import { Transaction } from './entities/transaction.entity';
import { ReservationService } from './services/reservation.service';
import { ReservationController } from './controllers/reservation.controller';
import { SeatGateway } from './gateways/seat.gateway';
import { SeatCleanupJob } from './jobs/seat-cleanup.job';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trip,
      Seat,
      TripSeat,
      Booking,
      Ticket,
      Transaction,
    ]),
  ],
  controllers: [ReservationController],
  providers: [ReservationService, SeatCleanupJob],
  exports: [ReservationService],
})
export class ReservationModule {}
