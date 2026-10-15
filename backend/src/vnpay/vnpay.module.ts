import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VnpayService } from './vnpay.service';
import { VnpayController } from './vnpay.controller';
import { Booking } from '../entities/booking.entity';
import { TripSeat } from '../entities/trip-seat.entity';
import { Ticket } from '../entities/ticket.entity';
import { Transaction } from '../entities/transaction.entity';
import { Trip } from '../entities/trip.entity';
import { SeatGateway } from '../gateways/seat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, TripSeat, Ticket, Transaction, Trip]),
  ],
  controllers: [VnpayController],
  providers: [VnpayService],
  exports: [VnpayService],
})
export class VnpayModule {}
