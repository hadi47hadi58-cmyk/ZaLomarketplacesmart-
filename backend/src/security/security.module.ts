import { Module, Global } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorController } from './two-factor.controller';
import { DeviceFingerprintService } from './device-fingerprint.service';
import { SecurityController } from './security.controller';
import { SecurityLogsService } from './security-logs.service';
import { SessionValidatorGuard } from './session-validator';
import { SupabaseModule } from '../supabase/supabase.module';

@Global()
@Module({
  imports: [SupabaseModule],
  providers: [
    TwoFactorService,
    DeviceFingerprintService,
    SecurityLogsService,
    SessionValidatorGuard,
  ],
  controllers: [
    TwoFactorController,
    SecurityController,
  ],
  exports: [
    TwoFactorService,
    DeviceFingerprintService,
    SecurityLogsService,
    SessionValidatorGuard,
  ],
})
export class SecurityModule {}
