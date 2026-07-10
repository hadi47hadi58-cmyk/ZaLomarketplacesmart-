import { Controller, Get, Post, Body, Query, UseGuards, Request, Param, Patch, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SetMetadata } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { IsNotEmpty, IsNumber, IsString, IsArray, IsEnum, Min, ValidateNested, IsInt, IsPositive, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ 
    description: 'المعرف الفريد للمنتج المراد شراؤه بقاعدة البيانات', 
    example: 1001,
    type: Number 
  })
  @IsNotEmpty({ message: 'يجب تقديم معرف المنتج الفريد' })
  @IsInt({ message: 'معرف المنتج يجب أن يكون رقماً صحيحاً' })
  @IsPositive({ message: 'معرف المنتج يجب أن يكون رقماً موجباً' })
  productId: number;

  @ApiProperty({ 
    description: 'الاسم الكامل للسلعة للتوثيق والفوترة', 
    example: 'ساعات أنكر اللاسلكية Soundcore X' 
  })
  @IsNotEmpty({ message: 'يجب إدخال اسم السلعة' })
  @IsString({ message: 'اسم السلعة يجب أن يكون نصاً صالحاً' })
  @MaxLength(100, { message: 'اسم السلعة طويل جداً، الحد الأقصى 100 حرف' })
  productName: string;

  @ApiProperty({ 
    description: 'سعر القطعة الواحدة بالدينار الجزائري (DZD)', 
    example: 7900,
    minimum: 0
  })
  @IsNotEmpty({ message: 'يجب تحديد سعر القطعة' })
  @IsNumber({}, { message: 'سعر القطعة يجب أن يكون قيمة عددية' })
  @Min(0, { message: 'لا يمكن أن يكون السعر سالباً' })
  price: number;

  @ApiProperty({ 
    description: 'الكمية المطلوبة من هذه السلعة بطلب الشراء', 
    example: 1,
    minimum: 1
  })
  @IsNotEmpty({ message: 'يجب تحديد الكمية المطلوبة' })
  @IsInt({ message: 'الكمية المطلوبة يجب أن تكون عدداً صحيحاً' })
  @Min(1, { message: 'الحد الأدنى للكمية المطلوبة هو قطعة واحدة (1)' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ 
    description: 'قائمة السلع والمنتجات المضافة لسلة التسوق للعميل', 
    type: [OrderItemDto] 
  })
  @IsArray({ message: 'يجب تقديم المنتجات في شكل مصفوفة صالحة' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ 
    description: 'عنوان التوصيل بالتفصيل الممل (مثل: حي المستقبل، مبنى 12، الطابق 2)', 
    example: 'حي المستقبل، مبنى 12، الطابق 2' 
  })
  @IsNotEmpty({ message: 'عنوان التوصيل مطلوب لجدولة شركة الشحن' })
  @IsString({ message: 'عنوان التوصيل يجب أن يكون نصاً صالحاً' })
  @MaxLength(250, { message: 'العنوان طويل جداً، يرجى التلخيص بحد أقصى 250 حرف' })
  address: string;

  @ApiProperty({ 
    description: 'ولاية التسليم بالجزائر', 
    example: 'الجزائر' 
  })
  @IsNotEmpty({ message: 'يجب تحديد ولاية التوصيل لتعيين سعر الشحن المناسب' })
  @IsString({ message: 'الولاية يجب أن تكون نصاً صحيحاً' })
  wilaya: string;

  @ApiProperty({ 
    description: 'البلدية أو المقاطعة الفرعية التابعة للولاية المختارة', 
    example: 'المرسى' 
  })
  @IsNotEmpty({ message: 'يجب إدخال اسم البلدية بدقة' })
  @IsString({ message: 'البلدية يجب أن تكون نصاً صالحاً' })
  commune: string;

  @ApiProperty({ 
    description: 'طريقة الدفع المعتمدة لهذا الطلب', 
    enum: ['COD', 'BARIDIMOB', 'CCP'], 
    example: 'COD' 
  })
  @IsEnum(['COD', 'BARIDIMOB', 'CCP'], { message: 'طريقة الدفع يجب أن تكون إما COD (الدفع عند الاستلام)، BARIDIMOB (بريدي موب)، أو CCP (الحساب البريدي الجاري)' })
  paymentMethod: 'COD' | 'BARIDIMOB' | 'CCP';

  @ApiProperty({ 
    description: 'رقم هاتف المستلم للتواصل والتنسيق أثناء تسليم الطلب', 
    example: '0770123456', 
    required: false 
  })
  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً صالحاً' })
  phone?: string;
}

@ApiTags('إدارة الطلبات والدفع وتتبع التوصيل - Orders & Payments & Shipping')
@Controller('orders')
export class OrdersController {
  private orders: any[] = [
    { id: 5001, customerId: 1, customerName: "عبد الهادي نجم الدين", storeId: 101, storeName: "متجر النور للإلكترونيات", status: "SHIPPING", totalAmount: 10100.00, paymentMethod: "COD", paymentStatus: "PENDING", deliveryFee: 400.0, address: "حي المستقبل، المقابل للدائرة، الطابق الأول", wilaya: "الجزائر", commune: "المرسى", trackingNumber: "DZ-COD-5001-ZALO", timestamp: Date.now() - 3600000 * 4 },
    { id: 5002, customerId: 1, customerName: "عبد الهادي نجم الدين", storeId: 102, storeName: "أخضر بازار للمنتجات الطبيعية", status: "DELIVERED", totalAmount: 3300.00, paymentMethod: "BARIDIMOB", paymentStatus: "CONFIRMED", deliveryFee: 400.0, address: "شارع المجاهدين الشق الأول، هضبة المرسى", wilaya: "الجزائر", commune: "المرسى", trackingNumber: "DZ-BMOB-5002-ZALO", timestamp: Date.now() - 3600000 * 48 }
  ];

  constructor(private auditService: AuditService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على قائمة الطلبيات الخاصة بالمستخدم الحالي' })
  async getMyOrders(@Request() req) {
    if (req.user.role === 'ADMIN') {
      return this.orders;
    }
    if (req.user.role === 'MERCHANT') {
      // Returning orders that belong to the merchant's store (simulated store id 101)
      return this.orders.filter(o => o.storeId === 101);
    }
    return this.orders.filter(o => o.customerId === req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إتمام Checkout وتأسيس طلب شراء جديد بالجزائر' })
  async create(@Body() dto: CreateOrderDto, @Request() req) {
    const subtotal = dto.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 400; // Standard Algerian Wilaya Shipping Fee DZD
    const grandTotal = subtotal + deliveryFee;

    const randomId = Math.floor(Math.random() * 9000) + 1000;
    const paymentSuffix = dto.paymentMethod === 'COD' ? 'COD' : dto.paymentMethod === 'BARIDIMOB' ? 'BMOB' : 'CCP';

    const newOrder = {
      id: 5000 + this.orders.length + 1,
      customerId: req.user.id,
      customerName: req.user.name,
      storeId: 101, // Mock multiple vendor division
      storeName: "متجر النور للإلكترونيات",
      status: "PENDING",
      totalAmount: grandTotal,
      paymentMethod: dto.paymentMethod,
      paymentStatus: dto.paymentMethod === 'COD' ? 'PENDING' : 'PAID', // CCP / BaridiMob auto confirmation simulator
      deliveryFee: deliveryFee,
      address: dto.address,
      wilaya: dto.wilaya,
      commune: dto.commune,
      trackingNumber: `DZ-${paymentSuffix}-${randomId}-ZALO`,
      timestamp: Date.now()
    };

    this.orders.unshift(newOrder);

    this.auditService.log(
      req.user.name,
      'PLACE_ORDER',
      `تم تسجيل طلب شراء جديد برقم تتبع ${newOrder.trackingNumber} وإجمالي ${newOrder.totalAmount} DZD باستخدام الدفع بـ: ${newOrder.paymentMethod}`
    );

    return {
      status: HttpStatus.CREATED,
      message: 'تم إرسال طلب الشراء الخاص بك بنجاح وجاري إعلام البائع ومصلحة التوطيد للتوصيل! 📦',
      order: newOrder
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['MERCHANT', 'ADMIN'])
  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث حالة تتبع التوصيل والطلب (قيد التجهيز، جاري الشحن، تم التسليم)' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req) {
    const order = this.orders.find(o => o.id === parseInt(id));
    if (!order) {
      throw new ForbiddenException('الطلب غير متوفر بجدول البيانات');
    }
    const oldStatus = order.status;
    order.status = status;

    if (status === 'DELIVERED') {
      order.paymentStatus = 'CONFIRMED';
    }

    this.auditService.log(
      req.user.name,
      'UPDATE_ORDER_STATUS',
      `تم ترقية الطلب رقم ${order.id} من حالة ${oldStatus} إلى حالة التوصيل الحالية: ${status}`
    );

    return {
      message: 'تم تحديث حالة الشحنة والطلب بنجاح وإشعار المستفيد',
      order
    };
  }
}

import { ForbiddenException } from '@nestjs/common';
