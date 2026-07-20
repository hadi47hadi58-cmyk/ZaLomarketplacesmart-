import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { SupabaseService } from '../supabase/supabase.service';

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
  @ApiProperty({ description: 'اسم السلعة', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'سعر السلعة', required: false })
  @IsOptional()
  @IsNumber()
  price?: number;
}

@ApiTags('إدارة السلع والمنتجات - Products Catalogue')
@Controller('products')
export class ProductsController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  @ApiOperation({ summary: 'الحصول على قائمة السلع المتاحة بالمنصة' })
  async getAll() {
    const { data, error } = await this.supabaseService.getClient().from('products').select('*');
    if (error) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message };
    }
    return {
      status: HttpStatus.OK,
      message: 'تم جلب السلع المتوفرة بنجاح',
      data: data
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'الحصول على تفاصيل سلعة معينة' })
  async getOne(@Param('id') id: string) {
    const { data, error } = await this.supabaseService.getClient().from('products').select('*').eq('id', id).single();
    if (error) {
      return { status: HttpStatus.NOT_FOUND, message: 'السلعة غير موجودة' };
    }
    return { status: HttpStatus.OK, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إضافة منتج' })
  async create(@Body() dto: CreateProductDto, @Request() req) {
    const { data, error } = await this.supabaseService.getClient().from('products').insert([dto]).select().single();
    if (error) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message };
    }
    return { status: HttpStatus.CREATED, data };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تعديل سلعة' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const { data, error } = await this.supabaseService.getClient().from('products').update(dto).eq('id', id).select().single();
    if (error) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message };
    }
    return { status: HttpStatus.OK, data };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف منتج' })
  async remove(@Param('id') id: string) {
    const { error } = await this.supabaseService.getClient().from('products').delete().eq('id', id);
    if (error) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message };
    }
    return { status: HttpStatus.OK, message: 'تم الحذف بنجاح' };
  }
}
