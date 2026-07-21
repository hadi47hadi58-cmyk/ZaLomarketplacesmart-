import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private supabaseService: SupabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // payload is the decoded JWT
    const supabase = this.supabaseService.getClient();
    
    // In a more robust setup, we could check if user exists in the database
    // For now, we trust the JWT signed by Supabase
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('رمز غير صالح');
    }

    return {
      supabase_uid: payload.sub,
      email: payload.email,
      role: payload.app_metadata?.role || payload.user_metadata?.role || 'CUSTOMER',
    };
  }
}
