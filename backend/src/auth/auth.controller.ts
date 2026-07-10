import { Controller, Post, Get, Body, HttpCode, HttpStatus, SetMetadata, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SessionCleanupService } from './session-cleanup.service';

// Auth DTO Definitions
export class RegisterDto {
  @ApiProperty({ description: 'الاسم الثلاثي للمستخدم', example: 'عبد الهادي نجم الدين' })
  @IsString()
  @IsNotEmpty({ message: 'الاسم مطلوب' })
  name: string;

  @ApiProperty({ description: 'البريد الإلكتروني الفريد', example: 'zinzinochop@gmail.com' })
  @IsEmail({}, { message: 'بريد إلكتروني غير صالح' })
  email: string;

  @ApiProperty({ description: 'كلمة مرور قوية وحصينة', example: 'securePassword123' })
  @MinLength(6, { message: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' })
  password: string;

  @ApiProperty({ description: 'نوع الدور الوظيفي للمستخدم بحساب المنصة', enum: ['CUSTOMER', 'MERCHANT', 'ADMIN'], example: 'CUSTOMER' })
  @IsEnum(['CUSTOMER', 'MERCHANT', 'ADMIN'])
  role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

  @ApiProperty({ description: 'ولاية الإقامة أو النشاط من بين الـ 58 ولاية', example: 'الجزائر' })
  @IsNotEmpty({ message: 'الولاية مطلوبة' })
  wilaya: string;

  @ApiProperty({ description: 'البلدية أو المقاطعة', example: 'المرسى' })
  @IsNotEmpty({ message: 'البلدية مطلوبة' })
  commune: string;

  @ApiProperty({ description: 'رقم الهاتف للتواصل المباشر', example: '0555123456', required: false })
  @IsOptional()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ description: 'البريد الإلكتروني للتبليغ ودراسة السلة', example: 'zinzinochop@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'كلمة المرور المسجلة', example: 'securePassword123' })
  @IsNotEmpty()
  password: string;
}

@ApiTags('التوثيق والتحقق من الهوية - Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cleanupService: SessionCleanupService
  ) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'فحص سلامة الجلسات وعمليات التنظيف (System Health & Session Pruning Status)' })
  @ApiResponse({ status: 200, description: 'تم استرداد بيانات السلامة وعدد الجلسات بنجاح' })
  async health() {
    return this.cleanupService.getSystemHealth();
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تشغيل يدوي فوري لتطهير وتنظيف الجلسات المنتهية والزومبي' })
  @ApiResponse({ status: 200, description: 'تم التطهير والتنظيف الفوري بنجاح' })
  async triggerManualCleanup() {
    const stats = await this.cleanupService.cleanupExpiredSessions();
    const health = await this.cleanupService.getSystemHealth();
    return {
      message: '🧹 تم تشغيل وتطهير الجلسات المنتهية والصلاحيات المتروكة يدوياً بنجاح!',
      stats,
      health
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إنشاء حساب مستخدم جديد (مستهلك، تاجر، مشرف)' })
  @ApiResponse({ status: 201, description: 'تم تسجيل الحساب بنجاح، مرحباً بك في عائلة ZaLo ✨' })
  @ApiResponse({ status: 400, description: 'البيانات غير صالحة أو البريد الإلكتروني مسجل مسبقاً' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الدخول واستخراج وثيقة الوصول الآمنة JWT Token' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الدخول بنجاح، جاري نقل البيانات لجوالك' })
  @ApiResponse({ status: 401, description: 'البريد الإلكتروني أو كلمة المرور خاطئة' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الخروج وإبطال جلسة العمل الحالية' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الخروج وإبطال الرمز بنجاح' })
  @ApiResponse({ status: 401, description: 'غير مصرح بالدخول أو الرمز غير صالح' })
  async logout(@Request() req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { message: 'رمز الوصول غير موجود بالترويسة' };
    }
    const token = authHeader.split(' ')[1];
    return this.authService.logout(token);
  }
}
