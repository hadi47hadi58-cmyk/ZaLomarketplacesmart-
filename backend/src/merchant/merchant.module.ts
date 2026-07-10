import { Module } from '@nestjs/common';
import { MerchantController } from './merchant.controller';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [MerchantController],
  providers: [AuditService],
  exports: [MerchantController],
})
export class MerchantModule {}
