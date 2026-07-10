import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';

interface RateLimitData {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimiter implements NestInterceptor {
  private static ipCache = new Map<string, RateLimitData>();
  private readonly LIMIT = 100; // Max requests per window
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';

    const now = Date.now();
    let clientData = RateLimiter.ipCache.get(ip);

    if (!clientData || now > clientData.resetTime) {
      clientData = {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      };
      RateLimiter.ipCache.set(ip, clientData);
    } else {
      clientData.count++;
      if (clientData.count > this.LIMIT) {
        const secondsLeft = Math.ceil((clientData.resetTime - now) / 1000);
        throw new HttpException(
          `لقد تجاوزت حد الطلبات المسموح به. يرجى المحاولة مرة أخرى بعد ${secondsLeft} ثانية ⏳`,
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    if (response && response.setHeader) {
      response.setHeader('X-RateLimit-Limit', this.LIMIT);
      response.setHeader('X-RateLimit-Remaining', Math.max(0, this.LIMIT - clientData.count));
      response.setHeader('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000));
    }

    return next.handle();
  }
}
