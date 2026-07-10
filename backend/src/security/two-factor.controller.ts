import { Controller, Post, Body, UseGuards, Request, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { SupabaseService } from '../supabase/supabase.service';
import { SessionValidatorGuard } from './session-validator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Enable2faDto {
  @ApiProperty({ description: 'الرمز السداسي للتحقق من سلامة الإعداد', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'المفتاح السري المستلم في إعداد المصادقة', example: 'MZXW6YTBOI' })
  @IsString()
  @IsNotEmpty()
  secret: string;
}

export class Verify2faDto {
  @ApiProperty({ description: 'الرمز السداسي للمصادقة الثنائية النشط', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'البريد الإلكتروني للتحقق من الهوية والوصول للمفتاح السري', example: 'zinzinochop@gmail.com' })
  @IsString()
  @IsNotEmpty()
  email: string;
}

@ApiTags('المصادقة الثنائية - Two Factor Authentication (2FA)')
@Controller('security/2fa')
export class TwoFactorController {
  constructor(
    private readonly twoFactorService: TwoFactorService,
    private readonly supabaseService: SupabaseService
  ) {}

  @Post('setup')
  @UseGuards(SessionValidatorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إنشاء مفتاح سري ومسار للباركود لإعداد الـ 2FA' })
  async setup(@Request() req) {
    const user = req.user;
    const { secret, otpauthUrl } = this.twoFactorService.generateSecret(user.email);

    return {
      message: 'تم توليد مفتاح التحقق الثنائي بنجاح 🛡️',
      secret,
      otpauthUrl,
    };
  }

  @Post('enable')
  @UseGuards(SessionValidatorGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تأكيد الرمز السداسي وتفعيل الـ 2FA للحساب بشكل رسمي' })
  async enable(@Request() req, @Body() dto: Enable2faDto) {
    const user = req.user;

    const isValid = this.twoFactorService.verifyToken(dto.secret, dto.code);
    if (!isValid) {
      throw new BadRequestException('رمز التحقق السداسي غير صحيح، يرجى إعادة المحاولة بدقة ❌');
    }

    // Save secret to database
    const supabase = this.supabaseService.getClient();
    
    // Check if 2fa secret exists
    const { data: existing } = await supabase
      .from('two_factor_secrets')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('two_factor_secrets')
        .update({ secret: dto.secret, is_enabled: true })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('two_factor_secrets')
        .insert({
          user_id: user.id,
          secret: dto.secret,
          is_enabled: true,
          backup_codes: Array.from({ length: 5 }, () => Math.floor(100000 + Math.random() * 900000).toString()),
        });
    }

    return {
      success: true,
      message: 'تم تفعيل المصادقة الثنائية بنجاح! حسابك الآن في أقصى درجات الأمان والتحصين 🛡️✨',
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'التحقق من رمز الـ 2FA المدخل من قبل المستخدم عند تسجيل الدخول' })
  async verify(@Body() dto: Verify2faDto) {
    const supabase = this.supabaseService.getClient();

    // Get user id by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', dto.email)
      .single();

    if (userError || !user) {
      throw new BadRequestException('المستخدم غير موجود بالمنصة ❌');
    }

    // Get 2fa secret
    const { data: secrets, error: secretsError } = await supabase
      .from('two_factor_secrets')
      .select('secret, is_enabled')
      .eq('user_id', user.id)
      .single();

    if (secretsError || !secrets || !secrets.is_enabled) {
      throw new BadRequestException('المصادقة الثنائية غير مفعلة لهذا الحساب مسبقاً 🛡️');
    }

    const isValid = this.twoFactorService.verifyToken(secrets.secret, dto.code);
    if (!isValid) {
      throw new BadRequestException('رمز المصادقة الثنائية المدخل غير صحيح ❌');
    }

    return {
      success: true,
      message: 'تم التحقق من الرمز بنجاح! أهلاً بك من جديد 🔐',
    };
  }
}
