import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [OrdersController],
  exports: [OrdersController],
})
export class OrdersModule {}
