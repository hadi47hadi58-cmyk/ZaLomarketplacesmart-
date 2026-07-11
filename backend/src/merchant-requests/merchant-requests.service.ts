import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MerchantRequestsService {
  constructor(
    private supabaseService: SupabaseService,
    private auditService: AuditService,
  ) {}

  // 1. تقديم طلب جديد (يستخدمه العميل)
  async createRequest(
    supabaseUid: string,
    data: { storeName: string; phone: string; commercialRegister?: string; taxNumber?: string; description?: string }
  ) {
    const supabase = this.supabaseService.getClient();

    // منع تقديم طلب مكرر معلق
    const { data: existing, error: checkError } = await supabase
      .from('merchant_requests')
      .select('id')
      .eq('user_id', supabaseUid)
      .eq('status', 'pending')
      .maybeSingle();

    if (checkError) {
      throw new ForbiddenException('خطأ في الاتصال بقاعدة البيانات أثناء التحقق من طلباتك السابقة');
    }

    if (existing) {
      throw new ForbiddenException('لديك طلب شراكة قيد المراجعة بالفعل');
    }

    const { data: newRequest, error: insertError } = await supabase
      .from('merchant_requests')
      .insert({
        user_id: supabaseUid,
        store_name: data.storeName,
        phone: data.phone,
        commercial_register: data.commercialRegister || null,
        tax_number: data.taxNumber || null,
        description: data.description || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !newRequest) {
      throw new ForbiddenException(insertError?.message || 'تعذر تسجيل طلب الشراكة الجديد');
    }

    this.auditService.log(
      'System/User',
      'MERCHANT_REQUEST_SUBMIT',
      `تقديم طلب ترقية تاجر لمتجر: ${data.storeName}`
    );

    return newRequest;
  }

  // 2. جلب الطلبات (المدير يرى الكل، العميل يرى خاصة)
  async getRequests(supabaseUid: string, userRole: string) {
    const supabase = this.supabaseService.getClient();

    if (userRole === 'ADMIN') {
      const { data, error } = await supabase
        .from('merchant_requests')
        .select('*, users:user_id(email, phone, name)')
        .order('created_at', { ascending: false });

      if (error) {
        throw new ForbiddenException('فشل جلب قائمة طلبات التجار للمشرفين');
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from('merchant_requests')
        .select('*')
        .eq('user_id', supabaseUid)
        .order('created_at', { ascending: false });

      if (error) {
        throw new ForbiddenException('فشل جلب قائمة طلباتك الشخصية');
      }
      return data;
    }
  }

  // 3. تفعيل التاجر (يستخدمه المدير فقط)
  async approveRequest(requestId: string, adminUser: any) {
    const supabase = this.supabaseService.getClient();

    const { data: request, error: fetchError } = await supabase
      .from('merchant_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchError || !request) {
      throw new NotFoundException('طلب الترقية غير موجود');
    }

    if (request.status !== 'pending') {
      throw new ForbiddenException('تم معالجة هذا الطلب مسبقاً');
    }

    // 1. ترقية دور المستخدم في جدول users العام إلى MERCHANT
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ role: 'MERCHANT' })
      .eq('supabase_uid', request.user_id);

    if (userUpdateError) {
      throw new ForbiddenException('تعذر تحديث رتبة المستخدم في قاعدة البيانات');
    }

    // 2. تحديث بيانات المستخدم في نظام الهوية الموحد (الـ metadata) إن وجد
    await supabase.auth.admin.updateUserById(request.user_id, {
      user_metadata: { role: 'MERCHANT' }
    }).catch(() => {
      // تجاهل الفشل إذا لم تكن صلاحيات أدمن الـ auth متوفرة محلياً بالكامل
    });

    // 2b. إبطال الجلسات وإجبار التاجر على إعادة تسجيل الدخول لتحديث التوكن الأمني JWT بالصلاحيات الجديدة
    try {
      // أ: حذف جميع الجلسات من جدول الجلسات المخصص في قاعدة البيانات PostgreSQL
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_uid', request.user_id)
        .maybeSingle();

      if (dbUser) {
        await supabase
          .from('sessions')
          .delete()
          .eq('user_id', dbUser.id);
        console.log(`[Session Invalidation] Purged active sessions from PostgreSQL for user: ${dbUser.id}`);
      }

      // ب: تسجيل الخروج الموحد من نظام Supabase Auth الرئيسي عالمياً
      await supabase.auth.admin.signOut(request.user_id, 'global');
      console.log(`[Session Invalidation] Revoked active Supabase Auth sessions globally for user: ${request.user_id}`);
    } catch (e) {
      console.warn('[Session Invalidation] Warning while revoking active user sessions:', e.message);
    }

    // 3. تحديث حالة الطلب إلى مقبول
    const { data: updatedRequest, error: updateError } = await supabase
      .from('merchant_requests')
      .update({ status: 'approved', admin_notes: 'تم التفعيل والمصادقة بواسطة الإدارة' })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      throw new ForbiddenException('تعذر تحديث حالة طلب الترقية إلى مقبول');
    }

    this.auditService.log(
      adminUser.name || 'Admin',
      'MERCHANT_REQUEST_APPROVE',
      `الموافقة وتفعيل طلب المتجر: ${request.store_name} للمستخدم ذو المعرف: ${request.user_id}`
    );

    return updatedRequest;
  }

  // 4. رفض الطلب (يستخدمه المدير)
  async rejectRequest(requestId: string, adminNotes: string, adminUser: any) {
    const supabase = this.supabaseService.getClient();

    const { data: request, error: fetchError } = await supabase
      .from('merchant_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchError || !request) {
      throw new NotFoundException('طلب الترقية غير موجود');
    }

    if (request.status !== 'pending') {
      throw new ForbiddenException('تم معالجة هذا الطلب مسبقاً');
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('merchant_requests')
      .update({ status: 'rejected', admin_notes: adminNotes || 'تم الرفض لعدم مطابقة الشروط' })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      throw new ForbiddenException('تعذر رفض طلب الترقية');
    }

    this.auditService.log(
      adminUser.name || 'Admin',
      'MERCHANT_REQUEST_REJECT',
      `رفض طلب ترقية المتجر: ${request.store_name}. السبب: ${adminNotes}`
    );

    return updatedRequest;
  }
}
