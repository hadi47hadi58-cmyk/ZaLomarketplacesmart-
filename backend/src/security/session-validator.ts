import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SessionValidatorGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('رمز الجلسة مفقود 🔐');
    }

    const supabase = this.supabaseService.getClient();

    // Check session in PostgreSQL (Supabase)
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*, users(*)')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (error || !session) {
      throw new UnauthorizedException('جلسة غير صالحة أو تم تسجيل الخروج منها ❌');
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (now > expiresAt) {
      // Revoke expired session
      await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('id', session.id);

      throw new UnauthorizedException('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى ⏳');
    }

    // Update last activity
    await supabase
      .from('sessions')
      .update({ last_activity: now.toISOString() })
      .eq('id', session.id);

    // Attach user and session to request
    request.user = session.users;
    request.sessionInfo = session;

    return true;
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
    return null;
  }
}
