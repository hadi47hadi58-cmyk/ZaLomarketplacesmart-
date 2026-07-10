/**
 * ZaLo Smart - Login Unit & Integration Tests (login.spec.ts)
 * اختبارات وحدة وتكامل تسجيل الدخول واستصدار الرموز الأمنية
 */

import { AuthService } from '../backend/src/auth/auth.service';
import { LoginDto } from '../backend/src/auth/auth.controller';

describe('AuthService - Login Tests', () => {
  let authService: AuthService;
  let mockJwtService: any;
  let mockAuditService: any;

  beforeEach(() => {
    mockJwtService = {
      sign: jest.fn().mockReturnValue('valid_jwt_token'),
    };
    mockAuditService = {
      log: jest.fn(),
    };
    authService = new AuthService(mockJwtService as any, mockAuditService as any);
  });

  describe('User Login Flow', () => {
    it('should authenticate pre-configured merchant successfully', async () => {
      const loginDto: LoginDto = {
        email: 'merchant@zalo.dz',
        password: 'securePassword123', // matching standard fallback check
      };

      const result = await authService.login(loginDto);

      expect(result).toBeDefined();
      expect(result.user.email).toBe('merchant@zalo.dz');
      expect(result.user.role).toBe('MERCHANT');
      expect(result.accessToken).toBe('valid_jwt_token');
      expect(result.access_token).toBe('valid_jwt_token');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'أحمد بن زكري',
        'USER_LOGIN',
        expect.stringContaining('MERCHANT')
      );
    });

    it('should throw an UnauthorizedException on incorrect password', async () => {
      const loginDto: LoginDto = {
        email: 'admin@zalo.dz',
        password: 'wrong_password_123',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(
        'البريد الإلكتروني للزبون أو كلمة الباسورد خاطئة، يرجى المحاولة بحكمة'
      );
    });

    it('should throw an UnauthorizedException on non-existent email', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@zalo.dz',
        password: 'password123',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(
        'البريد الإلكتروني للزبون أو كلمة الباسورد خاطئة، يرجى المحاولة بحكمة'
      );
    });
  });
});
