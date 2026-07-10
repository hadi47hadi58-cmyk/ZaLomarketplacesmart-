import { Controller, Get, Param, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupabaseService } from '../supabase/supabase.service';

@ApiTags('نظام تتبع وإثبات شحنات الولاية - Delivery Courier Tracking')
@Controller('delivery')
export class DeliveryController {
  private trackingData = {
    'DZ-COD-5001-ZALO': { trackingNumber: 'DZ-COD-5001-ZALO', status: 'SHIPPING', courierName: 'Yassir Express dzd', estimatedDays: 2, currentWilaya: 'الجزائر', lastUpdate: 'مر من مركز فرز رويبة الرئيسي' },
    'DZ-BMOB-5002-ZALO': { trackingNumber: 'DZ-BMOB-5002-ZALO', status: 'DELIVERED', courierName: 'توصيل يالدين Yalidine', estimatedDays: 0, currentWilaya: 'الجزائر', lastUpdate: 'تم التسليم من طرف وكيل ولاية المرسى الفيدرالي ومصادقة الدفع' }
  };

  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'تتبع مسار شحنة معينة ومعرفة الموقع والناقل في الـ 58 ولاية' })
  async trackParcel(@Param('trackingNumber') trackingNumber: string) {
    // 1. Try fetching from the real database first
    try {
      const supabase = this.supabaseService.getClient();
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, order_lifecycle(*)')
        .eq('tracking_number', trackingNumber)
        .maybeSingle();

      if (!error && order) {
        const courierName = order.payment_method === 'BARIDIMOB' ? 'توصيل يالدين Yalidine' : 'Yassir Express dzd';
        const currentWilaya = order.delivery_wilaya || 'الجزائر';
        
        let lastUpdateText = 'قيد المراجعة والتحقق والفرز المبدئي بالمنصة';
        if (order.order_lifecycle && order.order_lifecycle.length > 0) {
          const sortedLifecycle = [...order.order_lifecycle].sort(
            (a: any, b: any) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
          );
          if (sortedLifecycle[0] && sortedLifecycle[0].notes) {
            lastUpdateText = sortedLifecycle[0].notes;
          }
        } else {
          if (order.status === 'SHIPPING' || order.status === 'in_shipping') {
            lastUpdateText = 'مر من مركز فرز رويبة الرئيسي وجاري الشحن للولاية';
          } else if (order.status === 'DELIVERED' || order.status === 'delivered') {
            lastUpdateText = 'تم التسليم والتحصيل ومصادقة الدفع بنجاح';
          } else if (order.status === 'out_for_delivery') {
            lastUpdateText = 'خرجت مع السائق للتوصيل الفعلي للعنوان المختار';
          }
        }

        const data = {
          trackingNumber: order.tracking_number,
          status: order.status,
          courierName: courierName,
          estimatedDays: (order.status === 'DELIVERED' || order.status === 'delivered') ? 0 : 2,
          currentWilaya: currentWilaya,
          lastUpdate: lastUpdateText,
          orderId: order.id,
          totalAmount: order.total_amount,
          createdAt: order.created_at
        };

        return {
          status: HttpStatus.OK,
          message: 'تم استحضار إحداثيات الشحنة وتفاصيل الناقل التوزيعي بنجاح من قاعدة البيانات',
          data
        };
      }
    } catch (err) {
      // Log error and fallback to mock data
      console.error('Error fetching tracking details from DB:', err);
    }

    // 2. Fallback to mock data
    const data = this.trackingData[trackingNumber];
    if (!data) {
      throw new HttpException('رمز الشحنة المدخل غير متوفر بنظام تتبع البريد السريع الإلكتروني', HttpStatus.NOT_FOUND);
    }
    return {
      status: HttpStatus.OK,
      message: 'تم استحضار إحداثيات الشحنة وتفاصيل الناقل التوزيعي بنجاح',
      data
    };
  }
}
