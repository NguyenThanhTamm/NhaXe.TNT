import { Global, Module } from '@nestjs/common';
import { SeatGateway } from './seat.gateway';

@Global()
@Module({
  providers: [SeatGateway],
  exports: [SeatGateway],
})
export class SeatGatewayModule {}
