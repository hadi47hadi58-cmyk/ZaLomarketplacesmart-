import { Controller, Get, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';

@ApiTags('إدارة المستخدمين والحسابات - Users Profile')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'استدعاء بيانات الملف الشخصي للمستخدم الحالي ومكافآته' })
  @ApiResponse({ status: 200, description: 'تم استرجاع معلومات الحساب والولاء بنجاح' })
  async getProfile(@Request() req) {
    const user = await this.authService.findUserById(req.user.id);
    return {
      status: HttpStatus.OK,
      message: 'تم جلب معلوماتك الخاصة ومكافآت الولاء',
      data: user,
    };
  }
}
