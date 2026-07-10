import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditService } from './audit/audit.service';
import { MerchantModule } from './merchant/merchant.module';
import { DeliveryModule } from './delivery/delivery.module';
import { SupabaseModule } from './supabase/supabase.module';
import { SecurityModule } from './security/security.module';
import { MerchantRequestsModule } from './merchant-requests/merchant-requests.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // Database connection using environment values with local memory fallback
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'zalo_admin',
      password: process.env.DB_PASSWORD || 'zalo_secure_pass',
      database: process.env.DB_NAME || 'zalo_marketplace_smart',
      autoLoadEntities: true,
      synchronize: true, // Auto aligns ORM entities with Postgres columns during runtime
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 15,  // Limit each IP to 15 requests per minute
    }]),
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    SubscriptionsModule,
    ComplaintsModule,
    AnalyticsModule,
    MerchantModule,
    DeliveryModule,
    SupabaseModule,
    SecurityModule,
    MerchantRequestsModule,
  ],
  providers: [
    AuditService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
  exports: [AuditService],
})
export class AppModule {}
