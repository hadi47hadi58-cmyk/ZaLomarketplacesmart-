import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [OrdersController],
  providers: [AuditService],
  exports: [OrdersController],
})
export class OrdersModule {}
