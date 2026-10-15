import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

interface CacheItem {
  value: string;
  expiresAt: number; // Timestamp mili-giây
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isRedisAvailable = false;

  // IN-MEMORY FALLBACK CACHE (Sử dụng khi máy dev không bật Redis hoặc Redis gặp sự cố)
  private readonly memoryCache = new Map<string, CacheItem>();

  onModuleInit() {
    this.initRedisClient();
  }

  private initRedisClient() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;

    try {
      this.client = new Redis({
        host,
        port,
        password,
        // Giới hạn retry để không spam log và không treo tiến trình khi Redis offline
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // Dừng retry sau 3 lần thất bại
          }
          return 1000;
        },
        connectTimeout: 2000,
      });

      this.client.on('connect', () => {
        this.isRedisAvailable = true;
        this.logger.log(`[RedisService] Kết nối thành công tới Redis (${host}:${port})`);
      });

      this.client.on('error', (err) => {
        if (this.isRedisAvailable) {
          this.logger.warn(`[RedisService] Mất kết nối Redis. Chuyển sang In-Memory Fallback.`);
        }
        this.isRedisAvailable = false;
      });
    } catch (err) {
      this.isRedisAvailable = false;
      this.logger.warn(
        `[RedisService] Không thể kết nối Redis. Đang sử dụng In-Memory Cache Fallback để hệ thống tiếp tục hoạt động.`,
      );
    }
  }

  onModuleDestroy() {
    if (this.client) {
      try {
        this.client.disconnect();
      } catch (e) {
        // Bỏ qua lỗi khi disconnect
      }
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  private getSeatKey(tripId: string, seatId: string): string {
    return `trip:${tripId}:seat:${seatId}`;
  }

  // ===========================================================================
  // 1. KHÓA 1 GHẾ (ACQUIRE SINGLE SEAT LOCK)
  // ===========================================================================
  async acquireSeatLock(
    tripId: string,
    seatId: string,
    sessionId: string,
    ttlSeconds = 600,
  ): Promise<boolean> {
    const key = this.getSeatKey(tripId, seatId);

    if (this.isRedisAvailable && this.client) {
      try {
        const result = await this.client.set(key, sessionId, 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } catch (err) {
        this.logger.warn(`[Redis Fallback] Lỗi redis command, chuyển sang memory cache`);
      }
    }

    // Fallback: In-Memory Map
    const now = Date.now();
    const existing = this.memoryCache.get(key);
    if (existing && existing.expiresAt > now) {
      return false; // Đã bị giữ
    }

    this.memoryCache.set(key, {
      value: sessionId,
      expiresAt: now + ttlSeconds * 1000,
    });
    return true;
  }

  // ===========================================================================
  // 2. GIẢI PHÓNG KHÓA 1 GHẾ (RELEASE SINGLE SEAT LOCK)
  // ===========================================================================
  async releaseSeatLock(tripId: string, seatId: string, sessionId: string): Promise<boolean> {
    const key = this.getSeatKey(tripId, seatId);

    if (this.isRedisAvailable && this.client) {
      try {
        const luaScript = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        const result = await this.client.eval(luaScript, 1, key, sessionId);
        return result === 1;
      } catch (err) {
        this.logger.warn(`[Redis Fallback] Lỗi release redis, fallback in-memory`);
      }
    }

    // Fallback In-Memory
    const existing = this.memoryCache.get(key);
    if (existing && existing.value === sessionId) {
      this.memoryCache.delete(key);
      return true;
    }
    return false;
  }

  // ===========================================================================
  // 3. KHÓA ĐỒNG THỜI NHIỀU GHẾ NGUYÊN TỬ (ALL-OR-NOTHING MULTI-SEAT LOCK)
  // ===========================================================================
  async acquireMultiSeatLock(
    tripId: string,
    seatCodes: string[],
    holdToken: string,
    ttlSeconds = 600,
  ): Promise<{ success: boolean; conflictSeatCode?: string }> {
    const keys = seatCodes.map((code) => `trip:${tripId}:seat:${code}`);

    if (this.isRedisAvailable && this.client) {
      try {
        const luaScript = `
          for i = 1, #KEYS do
            if redis.call('EXISTS', KEYS[i]) == 1 then
              return KEYS[i]
            end
          end
          for i = 1, #KEYS do
            redis.call('SET', KEYS[i], ARGV[1], 'EX', ARGV[2])
          end
          return "OK"
        `;
        const result = await this.client.eval(luaScript, keys.length, ...keys, holdToken, ttlSeconds);
        if (result === 'OK') {
          return { success: true };
        } else {
          const failedCode = String(result).split(':').pop();
          return { success: false, conflictSeatCode: failedCode };
        }
      } catch (err) {
        this.logger.warn(`[Redis Fallback] Lỗi multi-lock redis, fallback in-memory`);
      }
    }

    // Fallback: In-Memory Atomic Check
    const now = Date.now();
    for (const code of seatCodes) {
      const k = `trip:${tripId}:seat:${code}`;
      const item = this.memoryCache.get(k);
      if (item && item.expiresAt > now) {
        return { success: false, conflictSeatCode: code };
      }
    }

    // Khóa toàn bộ
    for (const code of seatCodes) {
      const k = `trip:${tripId}:seat:${code}`;
      this.memoryCache.set(k, {
        value: holdToken,
        expiresAt: now + ttlSeconds * 1000,
      });
    }

    return { success: true };
  }

  // ===========================================================================
  // 4. GIẢI PHÓNG ĐỒNG THỜI NHIỀU GHẾ
  // ===========================================================================
  async releaseMultiSeatLock(
    tripId: string,
    seatCodes: string[],
    holdToken: string,
  ): Promise<void> {
    const keys = seatCodes.map((code) => `trip:${tripId}:seat:${code}`);

    if (this.isRedisAvailable && this.client) {
      try {
        const luaScript = `
          for i = 1, #KEYS do
            if redis.call('GET', KEYS[i]) == ARGV[1] then
              redis.call('DEL', KEYS[i])
            end
          end
          return "OK"
        `;
        await this.client.eval(luaScript, keys.length, ...keys, holdToken);
        return;
      } catch (err) {
        this.logger.warn(`[Redis Fallback] Lỗi release multi-lock redis`);
      }
    }

    // Fallback In-Memory
    for (const key of keys) {
      const existing = this.memoryCache.get(key);
      if (existing && existing.value === holdToken) {
        this.memoryCache.delete(key);
      }
    }
  }

  // ===========================================================================
  // 5. QUẢN LÝ PHIÊN GIỮ CHỖ (HOLD SESSION)
  // ===========================================================================
  async saveHoldSession(
    holdToken: string,
    data: { tripId: string; seatCodes: string[]; customerPhone: string; expiresAt: string },
    ttlSeconds = 600,
  ): Promise<void> {
    const key = `hold_session:${holdToken}`;

    if (this.isRedisAvailable && this.client) {
      try {
        await this.client.set(key, JSON.stringify(data), 'EX', ttlSeconds);
        return;
      } catch (err) {
        this.logger.warn(`[Redis Fallback] Lỗi save session redis`);
      }
    }

    // Fallback In-Memory
    this.memoryCache.set(key, {
      value: JSON.stringify(data),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async getHoldSession(holdToken: string): Promise<any | null> {
    const key = `hold_session:${holdToken}`;

    if (this.isRedisAvailable && this.client) {
      try {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (err) {
        this.logger.warn(`[Redis Fallback] Lỗi get session redis`);
      }
    }

    // Fallback In-Memory
    const item = this.memoryCache.get(key);
    if (!item || item.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    return JSON.parse(item.value);
  }

  async removeSeatLock(tripId: string, seatId: string): Promise<void> {
    const key = this.getSeatKey(tripId, seatId);

    if (this.isRedisAvailable && this.client) {
      try {
        await this.client.del(key);
      } catch (err) {
        // Bỏ qua
      }
    }

    this.memoryCache.delete(key);
  }
}
