import { Controller, Get, Post, Body, UseGuards, Request, HttpStatus, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SetMetadata } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateComplaintDto {
  @ApiProperty({ description: 'رقم الفاتورة أو الأوردر المعلق المشكوك بضمانه', example: 5001 })
  @IsNumber()
  orderId: number;

  @ApiProperty({ description: 'تفاصيل المشكلة ونصوص الدعم الفني', example: 'لم أستلم شحنة سماعات أنكر حتى اللحظة' })
  @IsNotEmpty()
  @IsString()
  message: string;
}

@ApiTags('حماية المستهلك وحل النزاعات التجارية - Disputes & Complaints')
@Controller('complaints')
export class ComplaintsController {
  private complaints: any[] = [
    { id: 7001, orderId: 5001, userId: 1, userName: "عبد الهادي نجم الدين", message: "تأخر الموصل قليلاً بالرغم من اتصالي به، أرجو تبليغه ليكون أسرع في أحياء المرسى.", status: "PENDING", timestamp: Date.now() - 3600000 * 2, adminResponse: null }
  ];

  constructor(private auditService: AuditService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تتبع الشكاوى أو الطعون المفروضة من قبل المستخدم' })
  async getMyComplaints(@Request() req) {
    if (req.user.role === 'ADMIN') {
      return this.complaints;
    }
    return this.complaints.filter(c => c.userId === req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إنشاء تذكرة شكوى رسمية للقسم القانوني بالمنصة' })
  async create(@Body() dto: CreateComplaintDto, @Request() req) {
    const newComplaint = {
      id: 7000 + this.complaints.length + 1,
      orderId: dto.orderId,
      userId: req.user.id,
      userName: req.user.name,
      message: dto.message,
      status: 'PENDING',
      timestamp: Date.now(),
      adminResponse: null
    };

    this.complaints.unshift(newComplaint);

    this.auditService.log(
      req.user.name,
      'RAISE_COMPLAINT',
      `تقديم شكوى نزاع رسمي بخصوص الطلبية رقم: ${dto.orderId} بدواعي: ${dto.message.substring(0, 40)}...`
    );

    return {
      status: HttpStatus.CREATED,
      message: 'تم إيصال شكواك المبررة لقسم حماية المستهلك بالإدارة، وسنرد عليك في أقرب فرصة! 🛡️',
      data: newComplaint
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['ADMIN'])
  @Patch(':id/resolve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إرسال رد رسمي وحل النزاع القانوني بالتذكرة' })
  async resolve(@Param('id') id: string, @Body('response') response: string, @Request() req) {
    const comp = this.complaints.find(c => c.id === parseInt(id));
    if (!comp) {
      return { message: 'التذكرة المطلوبة غير مسجلة' };
    }
    comp.status = 'RESOLVED';
    comp.adminResponse = response;

    this.auditService.log(
      req.user.name,
      'RESOLVE_COMPLAINT',
      `حل وإغلاق النزاع رقم ${comp.id} مع إمضاء رد إداري تواصل بخصوص المشغل`
    );

    return {
      message: 'تم حل النزاع وإغلاق تذكرة الشكوى بنجاح وإشعار الزبون',
      data: comp
    };
  }
}
