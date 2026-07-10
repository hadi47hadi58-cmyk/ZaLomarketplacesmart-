import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class CsrfProtectionInterceptor implements NestInterceptor {
  private readonly CSRF_HEADER_NAME = 'x-csrf-token';
  private readonly CSRF_COOKIE_NAME = 'csrf-token';

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    const method = request.method.toUpperCase();

    // Generate token if not exists or on safe requests (GET/HEAD)
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      let csrfToken = request.cookies ? request.cookies[this.CSRF_COOKIE_NAME] : null;
      if (!csrfToken) {
        csrfToken = crypto.randomBytes(24).toString('hex');
        if (response.cookie) {
          response.cookie(this.CSRF_COOKIE_NAME, csrfToken, {
            httpOnly: false, // Must be readable by client-side JS to put in header
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });
        }
      }
      return next.handle();
    }

    // Protect mutative requests (POST, PUT, DELETE, PATCH)
    const clientToken = request.headers[this.CSRF_HEADER_NAME] || (request.body ? request.body._csrf : null);
    const serverToken = request.cookies ? request.cookies[this.CSRF_COOKIE_NAME] : null;

    if (!clientToken || !serverToken || clientToken !== serverToken) {
      throw new ForbiddenException('حماية CSRF: رمز الأمان غير صالح أو مفقود 🛡️');
    }

    return next.handle();
  }
}
