import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { AuditService } from '../audit/audit.service';
import { SessionCleanupService } from './session-cleanup.service';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.SUPABASE_JWT_SECRET,
      signOptions: { expiresIn: '7d' }, // Session expires in 7 days
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuditService, SessionCleanupService],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
