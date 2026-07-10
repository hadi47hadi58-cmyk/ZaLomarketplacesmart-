import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private supabaseService: SupabaseService) {
    super();
  }

  async validate(req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('لم يتم العثور على رمز الوصول الآمن في الترويسة 🔐');
    }
    const token = authHeader.split(' ')[1];
    const supabase = this.supabaseService.getClient();

    // 1. Verify token validity directly with Supabase Auth Engine
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new UnauthorizedException('رمز الوصول الآمن منتهي الصلاحية أو غير صالح');
    }

    // 2. Validate session existence in the sessions table as requested
    const { data: sessionExists, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('token', token)
      .maybeSingle();

    if (sessionError || !sessionExists) {
      throw new UnauthorizedException('الجلسة غير نشطة أو تم تسجيل الخروج مسبقاً 🔐');
    }

    // 3. Fetch public profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_uid', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new UnauthorizedException('لم يتم العثور على الحساب الشخصي المطابق للمعرف الفريد');
    }

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      name: profile.name,
      supabase_uid: user.id
    };
  }
}
