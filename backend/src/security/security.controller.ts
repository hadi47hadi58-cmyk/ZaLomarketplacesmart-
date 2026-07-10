import { Controller, Get, Delete, Param, UseGuards, Request, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SessionValidatorGuard } from './session-validator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('إدارة أجهزة وأمان الحساب - User Security & Devices')
@Controller('security')
export class SecurityController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('devices')
  @UseGuards(SessionValidatorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'جلب جميع الأجهزة المسجلة والمصرح لها بالدخول للحساب' })
  async getDevices(@Request() req) {
    const user = req.user;
    const supabase = this.supabaseService.getClient();

    const { data: devices, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_login', { ascending: false });

    if (error) {
      throw new BadRequestException('فشل استرجاع قائمة الأجهزة الموثوقة ❌');
    }

    return {
      success: true,
      devices,
    };
  }

  @Delete('devices/:id')
  @UseGuards(SessionValidatorGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إلغاء الترخيص وحذف جهاز مسجل مسبقاً (سحب الثقة)' })
  async revokeDevice(@Request() req, @Param('id') deviceId: number) {
    const user = req.user;
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceId)
      .eq('user_id', user.id);

    if (error) {
      throw new BadRequestException('تعذر إلغاء ترخيص الجهاز، يرجى المحاولة لاحقاً.');
    }

    return {
      success: true,
      message: 'تم إلغاء الثقة في الجهاز وحذفه من قائمة الأجهزة الموثقة بنجاح 🛡️🗑️',
    };
  }

  @Get('logs')
  @UseGuards(SessionValidatorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'جلب سجلات الأمان والعمليات الأمنية الأخيرة المنجزة بالحساب' })
  async getSecurityLogs(@Request() req) {
    const user = req.user;
    const supabase = this.supabaseService.getClient();

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('actor_name', user.email)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new BadRequestException('عذراً، فشل جلب سجل الأمان للحساب.');
    }

    return {
      success: true,
      logs,
    };
  }
}
