// ZaLo Enterprise Storage Helper - Supabase Integration
import { supabase } from './supabase-config.js';

/**
 * دالة رفع الملفات والمزامنة السحابية الشاملة
 * @param {File} file - الملف المراد رفعه
 * @param {string} bucket - اسم المجلد (logos, banners, products, documents, payments)
 * @param {string} table - الجدول المراد تحديثه (stores, products, merchant_requests)
 * @param {string} column - العمود المراد تحديثه (logo_url, banner_url, image_url, document_url)
 * @param {number|string} id - المعرف الرقمي للسجل (Store ID or Product ID)
 */
export async function uploadAndSyncMedia(file, bucket, table, column, id) {
    if (!supabase || !file) {
        console.warn("Supabase client or file not provided for uploadAndSyncMedia");
        return null;
    }
    try {
        const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9_.-]/g, '_') : 'file.jpg';
        const fileName = `${Date.now()}_${safeName}`;
        const filePath = id ? `${id}/${fileName}` : fileName;

        // 1. الرفع إلى Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.warn(`Storage upload to bucket '${bucket}' failed, trying fallback bucket 'media':`, uploadError);
            // Fallback bucket
            const { data: fbData, error: fbError } = await supabase.storage
                .from('media')
                .upload(filePath, file, { upsert: true });
            if (fbError) throw fbError;
        }

        // 2. الحصول على الرابط العام (Public URL) أو الرابط الموقع للملفات الخاصة
        let publicUrl = null;
        try {
            const { data: pubRes } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);
            if (pubRes) publicUrl = pubRes.publicUrl;
        } catch(e) {}

        if (!publicUrl) {
            const { data: fbPub } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);
            if (fbPub) publicUrl = fbPub.publicUrl;
        }

        if (!publicUrl) throw new Error("تعذر توليد رابط سحابي للملف المرفوع");

        // 3. التحديث الدائم في قاعدة البيانات إذا تم تمرير جدول ومعرف
        if (table && column && id) {
            const { error: dbError } = await supabase
                .from(table)
                .update({ [column]: publicUrl, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (dbError) {
                console.warn("DB update sync warning:", dbError);
            }
        }

        console.log(`✅ تم الرفع والمزامنة بنجاح إلى [${bucket}]: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error("❌ فشل النظام السحابي للرفع:", error.message || error);
        return null;
    }
}

// Export to window for global access
if (typeof window !== 'undefined') {
    window.uploadAndSyncMedia = uploadAndSyncMedia;
}
