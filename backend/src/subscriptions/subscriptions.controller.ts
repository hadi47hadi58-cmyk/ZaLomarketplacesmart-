import { Controller, Get, Post, Body, UseGuards, Request, HttpStatus, Patch, Param, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SetMetadata } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { IsNotEmpty, IsEnum, IsNumber, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'اسم خطة الاشتراك المتاحة', enum: ['STARTER_COMPACT', 'SMART_ENTERPRISE'], example: 'SMART_ENTERPRISE' })
  @IsEnum(['STARTER_COMPACT', 'SMART_ENTERPRISE'])
  planName: 'STARTER_COMPACT' | 'SMART_ENTERPRISE';

  @ApiProperty({ description: 'المبلغ المدفوع بالدينار', example: 4500 })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'اسم ملف الحوالة / لقطة الدفع ومحتواها للتدقيق', example: 'BaridiMob_ccp_proof.png' })
  @IsNotEmpty()
  @IsString()
  paymentReceiptUrl: string;
}

@ApiTags('تراخيص واشتراكات المتاجر - Merchant Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  private subscriptions: any[] = [
    { id: 8001, merchantId: 2, merchantName: 'أحمد بن زكري', planName: 'SMART_ENTERPRISE', status: 'ACTIVE', price: 4500.00, paymentReceiptUrl: 'BaridiMob-Proof-Hadi.png', startDate: new Date(Date.now() - 86400000 * 3).toISOString(), endDate: new Date(Date.now() + 86400000 * 27).toISOString() }
  ];

  constructor(private auditService: AuditService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'استطلاع تفاصيل وحالة خطة الترخيص السنوية/الشهرية للتاجر الحالي' })
  async getMySubscription(@Request() req) {
    if (req.user.role === 'ADMIN') {
      return this.subscriptions;
    }
    const sub = this.subscriptions.find(s => s.merchantId === req.user.id);
    if (!sub) {
      return {
        planName: 'FREE_TRIAL',
        status: 'ACTIVE',
        message: 'الحساب قيد باقة الاستكشاف المجانية (حد أقصى للرفع)'
      };
    }
    return sub;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تقديم طلب ترخيص جديد مع رفع إثبات دفع المرسل CCP / BaridiMob' })
  async subscribe(@Body() dto: CreateSubscriptionDto, @Request() req) {
    const existing = this.subscriptions.find(s => s.merchantId === req.user.id && s.status === 'PENDING');
    if (existing) {
      return { message: 'لديك طلب ترقية حالي قيد المراجعة والتدقيق المالي.' };
    }

    const newSub = {
      id: 8000 + this.subscriptions.length + 1,
      merchantId: req.user.id,
      merchantName: req.user.name,
      planName: dto.planName,
      status: 'PENDING',
      price: dto.price,
      paymentReceiptUrl: dto.paymentReceiptUrl,
      startDate: null,
      endDate: null
    };

    this.subscriptions.push(newSub);

    this.auditService.log(
      req.user.name,
      'SUBSCRIPTION_REQUEST',
      `تقديم طلب اشتراك في الباقة ${dto.planName} بمبلغ ${dto.price} DZD مع رفع وصل الحوالة البريدية ${dto.paymentReceiptUrl}`
    );

    return {
      status: HttpStatus.CREATED,
      message: 'وصل إثبات الدفع خاصتك قيد المراجعة الآن، سيتم تبليغك وتفعيل الباقة فور تطابق الرقم البريدي! 🪙',
      data: newSub
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['ADMIN'])
  @Patch(':id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'التصديق على حوالات CCP/BaridiMob وتفعيل اشتراك البائع (للمشرفين فقط)' })
  async approve(@Param('id') id: string, @Request() req) {
    const sub = this.subscriptions.find(s => s.id === parseInt(id));
    if (!sub) {
      throw new ForbiddenException('رقم طلب الترقية غير مقيد بقائمة الدراسة');
    }
    sub.status = 'ACTIVE';
    sub.startDate = new Date().toISOString();
    sub.endDate = new Date(Date.now() + 86400000 * 30).toISOString(); // 30 Days expiration cycle

    this.auditService.log(
      req.user.name,
      'SUBSCRIPTION_APPROVE',
      `تفعيل ترخيص التاجر (${sub.merchantName}) للخطة ${sub.planName} بعد مطابقة حوالته بنجاح`
    );

    return {
      message: 'تم تفعيل باقة الاشتراك المميزة للتاجر، مبروك الترخيص! 🚀',
      data: sub
    };
  }
}
