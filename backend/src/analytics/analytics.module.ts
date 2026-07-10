import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AuditService],
  exports: [AnalyticsController],
})
export class AnalyticsModule {}
