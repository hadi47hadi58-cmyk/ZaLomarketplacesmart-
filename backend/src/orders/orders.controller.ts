import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  storeId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  deliveryWilaya: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'الحالة الجديدة للطلبية' })
  @IsNotEmpty()
  @IsString()
  status: string;
}

@ApiTags('إدارة الطلبيات والمبيعات - Orders & Sales')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على الطلبيات' })
  async getMyOrders(@Request() req) {
    let query = this.supabaseService.getClient().from('orders').select('*');
    if (req.user.role === 'CUSTOMER') {
      query = query.eq('customer_id', req.user.userId);
    } else if (req.user.role === 'MERCHANT') {
      query = query.eq('store_id', req.user.storeId || 0); // Need store logic
    }
    const { data, error } = await query;
    if (error) return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message };
    return { status: HttpStatus.OK, data };
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إنشاء طلبية جديدة' })
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    const payload = {
      customer_id: req.user.userId,
      store_id: dto.storeId,
      total_amount: dto.totalAmount,
      customer_name: dto.customerName,
      customer_phone: dto.customerPhone,
      delivery_wilaya: dto.deliveryWilaya,
      delivery_address: dto.deliveryAddress,
      status: 'PENDING'
    };
    const { data, error } = await this.supabaseService.getClient().from('orders').insert([payload]).select().single();
    if (error) return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message };
    return { status: HttpStatus.CREATED, data };
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث حالة الطلبية' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto, @Request() req) {
    const { data, error } = await this.supabaseService.getClient().from('orders').update({ status: dto.status }).eq('id', id).select().single();
    if (error) return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message };
    return { status: HttpStatus.OK, data };
  }
}
