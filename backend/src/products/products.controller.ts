import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'اسم السلعة', example: 'Galaxy A07' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'وصف السلعة بالتفصيل', example: 'هاتف ذكي ببطارية قوية 6000 مللي أمبير' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'سعر السلعة بالدينار الجزائري (DZD)', example: 22000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'فئة السلعة', example: 'هواتف' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ description: 'الكمية المتوفرة في المخزن', example: 15 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ description: 'رابط صورة السلعة', example: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateProductDto {
  @ApiProperty({ description: 'اسم السلعة', example: 'Galaxy A07 Pro', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'وصف السلعة بالتفصيل', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'سعر السلعة بالدينار الجزائري (DZD)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ description: 'فئة السلعة', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'الكمية المتوفرة في المخزن', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({ description: 'رابط صورة السلعة', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

@ApiTags('إدارة السلع والمنتجات - Products Catalogue')
@Controller('products')
export class ProductsController {
  private products = [
    { id: 1, name: "Galaxy A07", price: 22000, category: "هواتف", description: "هاتف ذكي ببطارية قوية 6000 مللي أمبير، شاشة قياس 6.5 بوصة، مع سعة تخزين 64 جيجابايت وكاميرا خلفية مزدوجة بدقة 50 ميجابكسل للتقاط أهم تفاصيل يومك الصيفي ببلدية المنيعة.", stock: 15, imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80" },
    { id: 2, name: "Honor X6C", price: 29000, category: "هواتف", description: "تصميم عصري رياضي بملمس ناعم، يدعم اتصال فائق الجودة وقوة تحمل ضد السقوط، مثالي للاستخدام الشاق ومكالمات البائعين والبريد الإلكتروني للعمل اليومي بالجزائر.", stock: 8, imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80" },
    { id: 3, name: "بنك طاقة شاحن أنكر 20K", price: 6500, category: "إلكترونيات", description: "شاحن لاسلكي سريع بسعة 20,000 مللي أمبير مع منافذ شحن سريعة متعددة لتغذية هاتفك في الحالات الاستثنائية.", stock: 20, imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80" },
    { id: 4, name: "فحمات فرامل سيارة بوش", price: 4500, category: "قطع غيار", description: "فرامل سيارة أصلية مصنوعة خصيصاً لتحمل الاحتكاك الشديد والحرارة العالية لضمان سلامتك وسلامة عائلتك على الطريق.", stock: 12, imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80" },
    { id: 5, name: "علبة تمور دقلة نور تولقة", price: 1500, category: "مواد غذائية", description: "تمور طبيعية بكر ممتازة تم قطفها وتغليفها محلياً بعناية فائقة لتنير مائدتك الجزائرية بصحة وعافية تامة.", stock: 50, imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80" },
    { id: 6, name: "سترة صوفية شتوية صحراوية", price: 5500, category: "ملابس", description: "جاكيت من الصوف الحر الفاخر يوفر الدفء المثالي لليالي الصحراء الباردة في ولايات الجنوب وكل بلديات المنيعة.", stock: 5, imageUrl: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80" }
  ];

  @Get()
  @ApiOperation({ summary: 'الحصول على قائمة السلع المتاحة بالمنصة' })
  @ApiResponse({ status: 200, description: 'تم جلب قائمة السلع بنجاح' })
  async getAll() {
    return {
      status: HttpStatus.OK,
      message: 'تم جلب السلع المتوفرة بنجاح',
      data: this.products
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'الحصول على تفاصيل سلعة معينة عبر معرفها الفريد' })
  @ApiResponse({ status: 200, description: 'تم جلب تفاصيل السلعة بنجاح' })
  async getOne(@Param('id') id: string) {
    const product = this.products.find(p => p.id === parseInt(id));
    if (!product) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'السلعة المطلوبة غير موجودة بالمنصة'
      };
    }
    return {
      status: HttpStatus.OK,
      data: product
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إضافة منتج أو سلعة جديدة للمتجر (خاص بالبائع)' })
  async create(@Body() dto: CreateProductDto, @Request() req) {
    const newProduct = {
      id: this.products.length + 1,
      name: dto.name,
      price: dto.price,
      category: dto.category,
      description: dto.description,
      stock: dto.stock,
      imageUrl: dto.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
    };
    this.products.push(newProduct);
    return {
      status: HttpStatus.CREATED,
      message: 'تمت إضافة السلعة بنجاح إلى كتالوج المتجر',
      data: newProduct
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تعديل تفاصيل سلعة حالية بالمتجر (خاص بالبائع)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = this.products.find(p => p.id === parseInt(id));
    if (!product) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'السلعة المطلوب تعديلها غير موجودة'
      };
    }
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.category !== undefined) product.category = dto.category;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.imageUrl !== undefined) product.imageUrl = dto.imageUrl;

    return {
      status: HttpStatus.OK,
      message: 'تم تحديث بيانات السلعة بنجاح',
      data: product
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف منتج من كتالوج المتجر نهائياً (خاص بالبائع)' })
  async remove(@Param('id') id: string) {
    const index = this.products.findIndex(p => p.id === parseInt(id));
    if (index === -1) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'السلعة المطلوب حذفها غير موجودة'
      };
    }
    this.products.splice(index, 1);
    return {
      status: HttpStatus.OK,
      message: 'تم حذف السلعة بنجاح من كتالوج المعروضات'
    };
  }
}
