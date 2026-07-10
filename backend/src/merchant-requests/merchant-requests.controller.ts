import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { MerchantRequestsService } from './merchant-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('طلبات شراكة التجار - Merchant Upgrade Requests Flow')
@ApiBearerAuth()
@Controller('merchant-requests')
@UseGuards(JwtAuthGuard) // يتطلب تسجيل دخول موحد
export class MerchantRequestsController {
  constructor(private service: MerchantRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'تقديم طلب ترقية بائع جديد' })
  async create(@Request() req, @Body() body: any) {
    return this.service.createRequest(req.user.supabase_uid, body);
  }

  @Get()
  @ApiOperation({ summary: 'جلب طلبات الترقية (التجار يرون طلباتهم، والمدير يرى كل الطلبات)' })
  async findAll(@Request() req) {
    return this.service.getRequests(req.user.supabase_uid, req.user.role);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['ADMIN'])
  @ApiOperation({ summary: 'الموافقة على طلب ترقية وتغيير رتبة المستخدم إلى بائع (خاص بالإدارة)' })
  async approve(@Param('id') id: string, @Request() req) {
    return this.service.approveRequest(id, req.user);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['ADMIN'])
  @ApiOperation({ summary: 'رفض طلب ترقية بائع مع توضيح أسباب الرفض (خاص بالإدارة)' })
  async reject(@Param('id') id: string, @Body() body: { adminNotes: string }, @Request() req) {
    return this.service.rejectRequest(id, body.adminNotes, req.user);
  }
}
