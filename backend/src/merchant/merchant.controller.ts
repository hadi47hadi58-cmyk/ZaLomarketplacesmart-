import { Controller, Get, Post, Body, UseGuards, Request, HttpStatus, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SetMetadata } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { IsNotEmpty, IsString } from 'class-validator';

export class MerchantVerifyDto {
  @ApiProperty({ description: 'رقم السجل التجاري الإلكتروني للنشاط', example: '16/00-0984321B22' })
  @IsNotEmpty()
  @IsString()
  commercialRegisterCode: string;

  @ApiProperty({ description: 'رقم بطاقة التعريف الوطنية البيومترية NIN', example: '1102908347101' })
  @IsNotEmpty()
  @IsString()
  nationalIdNumber: string;

  @ApiProperty({ description: 'صورة وثيقة السجل التجاري المرفوعة', example: 'commercial-register-hadi.pdf' })
  @IsNotEmpty()
  @IsString()
  commercialRegisterFileUrl: string;

  @ApiProperty({ description: 'رابط صورة بطاقة التعريف المسحوبة بالكامل', example: 'biometric-nin-card-hadi.png' })
  @IsNotEmpty()
  @IsString()
  nationalIdCardFileUrl: string;
}

@ApiTags('توثيق ملف بائع معتمد - Merchant Verification Flow')
@Controller('merchant')
export class MerchantController {
  private verifications: any[] = [
    { id: 101, merchantId: 2, merchantName: 'أحمد بن زكري', commercialRegisterCode: '16/00-045321B19', nationalIdNumber: '1102380293810', commercialRegisterFileUrl: 'cr-98319.pdf', nationalIdCardFileUrl: 'nid-9823.png', isVerified: true, submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(), verifiedAt: new Date(Date.now() - 86400000 * 4).toISOString() }
  ];

  constructor(private auditService: AuditService) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تفقد حالة التحقق والملف المرفوع للتاجر الحالي' })
  async getStatus(@Request() req) {
    const record = this.verifications.find(v => v.merchantId === req.user.id);
    if (!record) {
      return {
        status: 'UNSUBMITTED',
        message: 'لم يتم تقديم وثائق المراجعة القانونية حتى الآن.'
      };
    }
    return {
      status: record.isVerified ? 'VERIFIED' : 'PENDING_REVIEW',
      data: record
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'رفع وتقديم مستندات الإثبات والتحقق للتاجر (صورة البطاقة، السجل التجاري)' })
  async submitDocuments(@Body() dto: MerchantVerifyDto, @Request() req) {
    const existing = this.verifications.find(v => v.merchantId === req.user.id);
    if (existing) {
      return { message: 'لقد قمت بإيداع ملفك سابقاً وهو رهن الدراسة والمصادقة حالياً.' };
    }

    const newRecord = {
      id: 100 + this.verifications.length + 1,
      merchantId: req.user.id,
      merchantName: req.user.name,
      commercialRegisterCode: dto.commercialRegisterCode,
      nationalIdNumber: dto.nationalIdNumber,
      commercialRegisterFileUrl: dto.commercialRegisterFileUrl,
      nationalIdCardFileUrl: dto.nationalIdCardFileUrl,
      isVerified: false,
      submittedAt: new Date().toISOString(),
      verifiedAt: null
    };

    this.verifications.push(newRecord);

    this.auditService.log(
      req.user.name,
      'MERCHANT_VERIFICATION_SUBMIT',
      `تقديم مستندات التاجر الرسمية (رقم السجل: ${dto.commercialRegisterCode}) للتدقيق القانوني والترخيص`
    );

    return {
      status: HttpStatus.CREATED,
      message: 'تم استقبال الأوراق والملفات بنجاح، ستتم المراجعة من طرف المشرفين للتصديق في بضع ساعات! 📑',
      data: newRecord
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['ADMIN'])
  @Patch('verify/:id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'التصديق على ملف تاجر وتحويل حسابه لـ موثق (خاص بالمشرفين)' })
  async approve(@Param('id') id: string, @Request() req) {
    const record = this.verifications.find(v => v.id === parseInt(id));
    if (!record) {
      return { message: 'السجل غير مسجل بمجموعة التدقيق' };
    }
    record.isVerified = true;
    record.verifiedAt = new Date().toISOString();

    this.auditService.log(
      req.user.name,
      'MERCHANT_VERIFICATION_APPROVE',
      `المصادقة على ملف تحقيق التاجر (${record.merchantName}) وترخيصه للبيع بحرية غير محدودة`
    );

    return {
      message: 'تم تفعيل وسم بائع معتمد وإشعار التاجر بنجاح 🛡️',
      data: record
    };
  }
}
