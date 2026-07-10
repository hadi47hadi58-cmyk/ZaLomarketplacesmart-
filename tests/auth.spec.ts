/**
 * ZaLo Smart - Authentication Unit Tests (auth.spec.ts)
 * اختبارات وحدة التوثيق والتحقق من الهوية لحسابات المستخدمين والتجار والمشرفين
 */

import { AuthService } from '../backend/src/auth/auth.service';
import { RegisterDto } from '../backend/src/auth/auth.controller';

describe('AuthService - Unit Tests', () => {
  let authService: AuthService;
  let mockJwtService: any;
  let mockAuditService: any;

  beforeEach(() => {
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mocked_jwt_token_for_zalo_security'),
    };
    mockAuditService = {
      log: jest.fn(),
    };
    authService = new AuthService(mockJwtService as any, mockAuditService as any);
  });

  describe('User Registration', () => {
    it('should successfully register a new customer', async () => {
      const registerDto: RegisterDto = {
        name: 'سفيان الجزائري',
        email: 'sofiane@zalo.dz',
        password: 'securePassword123',
        role: 'CUSTOMER',
        wilaya: 'البليدة',
        commune: 'أولاد يعيش',
        phone: '0661223344',
      };

      const result = await authService.register(registerDto);

      expect(result).toBeDefined();
      expect(result.user.email).toBe('sofiane@zalo.dz');
      expect(result.user.role).toBe('CUSTOMER');
      expect(result.accessToken).toBe('mocked_jwt_token_for_zalo_security');
      expect(result.access_token).toBe('mocked_jwt_token_for_zalo_security');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'سفيان الجزائري',
        'USER_SIGNUP',
        expect.stringContaining('CUSTOMER')
      );
    });

    it('should throw a ConflictException if the email already exists', async () => {
      const registerDto: RegisterDto = {
        name: 'عبد الهادي نجم الدين',
        email: 'zinzinochop@gmail.com', // Pre-existing email in service
        password: 'anotherPassword',
        role: 'CUSTOMER',
        wilaya: 'الجزائر',
        commune: 'المرسى',
      };

      await expect(authService.register(registerDto)).rejects.toThrow(
        'البريد الإلكتروني المدخل مستعمل مسبقاً بالمنصة'
      );
    });
  });
});
