import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [AuditService],
  exports: [SubscriptionsController],
})
export class SubscriptionsModule {}
