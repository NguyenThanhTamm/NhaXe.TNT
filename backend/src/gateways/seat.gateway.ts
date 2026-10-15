import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SeatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SeatGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Người dùng mở màn hình chọn ghế của chuyến nào thì tham gia vào room của chuyến đó
   * Payload: { tripId: string }
   */
  @SubscribeMessage('join_trip')
  handleJoinTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    const roomName = `trip_${data.tripId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room ${roomName}`);
    return { event: 'joined_trip', tripId: data.tripId };
  }

  @SubscribeMessage('leave_trip')
  handleLeaveTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    const roomName = `trip_${data.tripId}`;
    client.leave(roomName);
    this.logger.log(`Client ${client.id} left room ${roomName}`);
  }

  /**
   * Bắn sự kiện tới tất cả người dùng trong chuyến xe: Ghế đang được giữ 10 phút
   */
  notifySeatHeld(tripId: string, seatId: string, seatCode: string, holdExpiresAt: Date) {
    const roomName = `trip_${tripId}`;
    this.server.to(roomName).emit('seat_status_changed', {
      tripId,
      seatId,
      seatCode,
      status: 'HOLDING',
      holdExpiresAt,
      message: `Giường ${seatCode} đang được giữ chỗ`,
    });
  }

  /**
   * Bắn sự kiện tới tất cả người dùng trong chuyến xe: Ghế đã được thanh toán thành công (Khóa vĩnh viễn)
   */
  notifySeatBooked(tripId: string, seatId: string, seatCode: string) {
    const roomName = `trip_${tripId}`;
    this.server.to(roomName).emit('seat_status_changed', {
      tripId,
      seatId,
      seatCode,
      status: 'BOOKED',
      message: `Giường ${seatCode} đã được đặt thành công`,
    });
  }

  /**
   * Bắn sự kiện ghế hết hạn giữ chỗ và quay lại trạng thái trống (Available)
   */
  notifySeatReleased(tripId: string, seatId: string, seatCode: string) {
    const roomName = `trip_${tripId}`;
    this.server.to(roomName).emit('seat_status_changed', {
      tripId,
      seatId,
      seatCode,
      status: 'AVAILABLE',
      message: `Giường ${seatCode} đã mở lại, bạn có thể chọn`,
    });
  }
}
