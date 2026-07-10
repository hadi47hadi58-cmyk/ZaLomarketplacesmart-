import { Module } from '@nestjs/common';
import { ComplaintsController } from './complaints.controller';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [ComplaintsController],
  providers: [AuditService],
  exports: [ComplaintsController],
})
export class ComplaintsModule {}
