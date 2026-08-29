import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export interface RateLimitOptions {
  limit: number;
  ttlSeconds: number;
  message?: string;
}

export const RATE_LIMIT_KEY = 'rate_limit';
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

interface RequestRecord {
  timestamps: number[];
}

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private static store = new Map<string, RequestRecord>();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    ) || { limit: 60, ttlSeconds: 60, message: 'Too many requests. Please try again later.' };

    const request = context.switchToHttp().getRequest<Request>();
    const clientIp =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      request.socket.remoteAddress ||
      'unknown-ip';

    const key = `${request.path}:${clientIp}`;
    const now = Date.now();
    const windowStart = now - options.ttlSeconds * 1000;

    let record = RateLimiterGuard.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      RateLimiterGuard.store.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= options.limit) {
      const oldestInWindow = record.timestamps[0];
      const retryAfterSeconds = Math.ceil((oldestInWindow + options.ttlSeconds * 1000 - now) / 1000);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: options.message || `Too many requests. Please try again in ${Math.max(1, retryAfterSeconds)}s.`,
          retryAfter: retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.timestamps.push(now);
    return true;
  }
}
