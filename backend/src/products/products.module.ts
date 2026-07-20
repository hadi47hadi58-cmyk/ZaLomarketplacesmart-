import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ProductsController],
  exports: [ProductsController],
})
export class ProductsModule {}
