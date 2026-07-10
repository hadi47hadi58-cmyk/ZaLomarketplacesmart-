import { Module } from '@nestjs/common';
import { MerchantRequestsController } from './merchant-requests.controller';
import { MerchantRequestsService } from './merchant-requests.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [SupabaseModule],
  controllers: [MerchantRequestsController],
  providers: [MerchantRequestsService, AuditService],
  exports: [MerchantRequestsService],
})
export class MerchantRequestsModule {}
