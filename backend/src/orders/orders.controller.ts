import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'معرف المتجر' })
  storeId?: any;

  @ApiProperty({ description: 'اسم المنتج' })
  @IsNotEmpty()
  @IsString()
  productName: string;

  @ApiProperty({ description: 'الكمية المطلوبة' })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'رقم ولاية الشحن (1-69)' })
  @IsNotEmpty()
  shippingWilaya: number | string;

  @ApiProperty({ description: 'إجمالي المبلغ' })
  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ description: 'اسم الزبون' })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'رقم هاتف الزبون' })
  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  @ApiProperty({ description: 'عنوان التوصيل' })
  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ description: 'طريقة الدفع', required: false })
  paymentMethod?: string;
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
    const wilayaNumber = parseInt(dto.shippingWilaya.toString(), 10) || 16;
    const payload = {
      customer_id: req.user?.userId || 'anonymous',
      store_id: dto.storeId || 'direct',
      product_name: dto.productName,
      quantity: dto.quantity || 1,
      shipping_wilaya: wilayaNumber,
      total_amount: dto.totalAmount,
      customer_name: dto.customerName,
      customer_phone: dto.customerPhone,
      delivery_address: dto.deliveryAddress,
      address: dto.deliveryAddress,
      wilaya: wilayaNumber.toString(),
      payment_method: dto.paymentMethod || 'cod',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Actual DB insertion via Supabase Service Client first
    const { data, error } = await this.supabaseService.getClient().from('orders').insert([payload]).select().single();
    
    // Strict error check - no fake response allowed
    if (error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'فشل حفظ الطلبية في قاعدة البيانات: ' + error.message
      };
    }

    return {
      status: HttpStatus.CREATED,
      success: true,
      message: 'تم تسجيل الطلبية بنجاح في قاعدة البيانات',
      data
    };
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
