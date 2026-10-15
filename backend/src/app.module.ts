import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import * as dotenv from 'dotenv';
dotenv.config(); // Nạp biến môi trường ngay lập tức trước khi TypeORM khởi tạo

import { RedisModule } from './redis/redis.module';
import { NotificationModule } from './notification/notification.module';
import { SeatGatewayModule } from './gateways/seat-gateway.module';
import { BookingEngineModule } from './booking-engine/booking-engine.module';

@Module({
  imports: [
    // 1. Quản lý cấu hình môi trường toàn cục (đọc từ file .env)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Cron jobs scheduling cho background worker quét giải phóng ghế quá hạn
    ScheduleModule.forRoot(),

    // 3. Global Services: Redis, Notification & Real-time WebSockets
    RedisModule,
    NotificationModule,
    SeatGatewayModule,

    // 4. PostgreSQL Connection tới Supabase Cloud qua Transaction Pooler IPv4
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'aws-0-ap-northeast-2.pooler.supabase.com',
      port: parseInt(process.env.DB_PORT || '6543', 10),
      username: process.env.DB_USERNAME || 'postgres.lodikilazpvdlqtwhlfd',
      password: process.env.DB_PASSWORD || 'FynRvWNNlhnH6gHn',
      database: process.env.DB_DATABASE || 'postgres',
      autoLoadEntities: true,
      // BẮT BUỘC KHI KẾT NỐI SUPABASE: Bật SSL với rejectUnauthorized: false
      ssl: {
        rejectUnauthorized: false,
      },
      // Schema đã được tạo sẵn qua file SQL, không tự ý drop hay sync lại
      synchronize: false,
      logging: ['error', 'warn'],
      extra: {
        max: 15, // Giới hạn connection pool cho Supabase Pooler
        connectionTimeoutMillis: 10000,
      },
    }),

    // 5. Toàn bộ nghiệp vụ Đặt vé xe 3NF: Search, Sơ đồ tầng 1/tầng 2, Hold Seat chống Double Booking, Worker 30s & Cổng thanh toán VNPAY
    BookingEngineModule,
  ],
})
export class AppModule {}
