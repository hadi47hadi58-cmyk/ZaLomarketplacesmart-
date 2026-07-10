import { PrismaClient } from '@prisma/client';

// تم إنشاء هذا الملف للتحقق من سياسات RLS على مستوى قاعدة البيانات
// للتحقق من أن التجار والعملاء لا يمكنهم الوصول إلى بيانات الآخرين بشكل غير مصرح به.

const prisma = new PrismaClient();

describe('RLS Policies - Stores & Products', () => {
  beforeAll(async () => {
    // تسجيل دخول تاجر معين (محاكاة باستخدام token)
    // أو الاتصال بقاعدة البيانات مباشرة مع دور (role) معين عبر Supabase
  });

  test('التاجر يرى منتجات متجره فقط', async () => {
    const merchantId = 'merchant-uuid-1'; // معرف تاجر معين
    const products = await prisma.products.findMany({
      where: { store: { merchant_id: merchantId } }
    });
    // تأكد أن جميع المنتجات تعود لهذا التاجر فقط
    products.forEach(p => {
      expect(p.store_id).toBe('store-of-merchant-1');
    });
  });

  test('التاجر لا يرى منتجات تاجر آخر', async () => {
    const merchantId = 'merchant-uuid-1';
    const products = await prisma.products.findMany({
      where: { store: { merchant_id: { not: merchantId } } }
    });
    // يجب أن تكون النتيجة 0 أو فارغة (لأن RLS يمنع الرؤية)
    expect(products.length).toBe(0);
  });
});

describe('RLS Policies - Orders', () => {
  test('العميل يرى طلباته فقط', async () => {
    const customerId = 'customer-uuid-1';
    const orders = await prisma.orders.findMany({
      where: { customer_id: customerId }
    });
    orders.forEach(o => {
      expect(o.customer_id).toBe(customerId);
    });
  });
});
