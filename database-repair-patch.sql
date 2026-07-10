-- =========================================================================
-- ZaLo Marketplace Ultimate Database Repair & Initialization Patch
-- رقعة الإصلاح الشاملة وتأسيس قاعدة البيانات لسوق الجزائر الذكي
-- =========================================================================
-- 🛡️ 100% Idempotent, safe to run multiple times, handles missing tables,
--    updates RLS policies, fixes admin access whitelists, and sets up indexes.
-- =========================================================================

-- تفعيل الإضافات المطلوبة (Enable Required Extensions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUMS AND CUSTOM TYPES (الأنواع المخصصة للمنصة)
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('CUSTOMER', 'MERCHANT', 'ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_status') THEN
        CREATE TYPE store_status AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'DISPUTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('COD', 'BARIDIMOB', 'CCP');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sub_plan') THEN
        CREATE TYPE sub_plan AS ENUM ('STARTER_COMPACT', 'SMART_ENTERPRISE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sub_status') THEN
        CREATE TYPE sub_status AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM ('PENDING', 'RESOLVED', 'CLOSED');
    END IF;
END$$;

-- ==========================================
-- 2. TABLES CREATION (إنشاء الجداول بشكل آمن)
-- ==========================================

-- جدول الحسابات المتوافق مع الواجهة الأمامية القديمة
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    name VARCHAR(150),
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(30),
    wilaya VARCHAR(100),
    commune VARCHAR(150),
    role VARCHAR(50) DEFAULT 'customer',
    status VARCHAR(50) DEFAULT 'active',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول المستخدمين الرئيسي للمنصة
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'CUSTOMER'::user_role,
    status user_status DEFAULT 'ACTIVE'::user_status,
    wilaya VARCHAR(100) NOT NULL,
    commune VARCHAR(150) NOT NULL,
    phone VARCHAR(30) UNIQUE,
    loyalty_points INT DEFAULT 0,
    supabase_uid UUID UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- وثائق التحقق للتجار
CREATE TABLE IF NOT EXISTS public.merchant_documents (
    id SERIAL PRIMARY KEY,
    merchant_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    national_id_card_url VARCHAR(255),
    commercial_register_code VARCHAR(100),
    commercial_register_pdf_url VARCHAR(255),
    payment_receipt_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    notes TEXT
);

-- سجل المحلات / المتاجر النشطة
CREATE TABLE IF NOT EXISTS public.stores (
    id SERIAL PRIMARY KEY,
    merchant_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    phone VARCHAR(30) NOT NULL,
    whatsapp VARCHAR(30),
    wilaya VARCHAR(100) NOT NULL,
    commune VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status store_status DEFAULT 'PENDING_APPROVAL'::store_status,
    rating NUMERIC(3,2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- كاتالوج المنتجات وتتبع المخزن
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    store_id INT REFERENCES public.stores(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    sales_count INT DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 5.00,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- سجل الطلبات والمعاملات
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES public.users(id) ON DELETE SET NULL,
    store_id INT REFERENCES public.stores(id) ON DELETE SET NULL,
    status order_status DEFAULT 'PENDING'::order_status,
    total_amount NUMERIC(12,2) NOT NULL,
    delivery_fee NUMERIC(8,2) DEFAULT 400.00,
    payment_method payment_method NOT NULL DEFAULT 'COD'::payment_method,
    payment_status payment_status DEFAULT 'PENDING'::payment_status,
    delivery_address TEXT NOT NULL,
    delivery_wilaya VARCHAR(100) NOT NULL,
    delivery_commune VARCHAR(150) NOT NULL,
    tracking_number VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- عناصر سلة المشتريات للطلب
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- إثباتات الدفع المرفوعة
CREATE TABLE IF NOT EXISTS public.payment_proofs (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id INT REFERENCES public.users(id) ON DELETE SET NULL,
    receipt_image_url VARCHAR(255) NOT NULL,
    amount NUMERIC(12,2),
    status VARCHAR(50) DEFAULT 'PENDING',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- دورة حياة وتتبع حالة الطلبيات
CREATE TABLE IF NOT EXISTS public.order_lifecycle (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES public.orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    notes TEXT,
    updated_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- مراجعات وتقييمات العملاء
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES public.products(id) ON DELETE CASCADE,
    customer_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- حماية المستهلك ونظام الشكاوى
CREATE TABLE IF NOT EXISTS public.complaints (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status ticket_status DEFAULT 'PENDING'::ticket_status,
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- اشتراكات المتاجر المميزة
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id SERIAL PRIMARY KEY,
    merchant_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    plan_name sub_plan NOT NULL,
    status sub_status DEFAULT 'PENDING'::sub_status,
    price NUMERIC(10,2) NOT NULL,
    payment_receipt_url VARCHAR(255) NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- نظام التنبيهات الفورية
CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- سجلات التدقيق الإداري
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    actor_name VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إدارة الجلسات في المنصة
CREATE TABLE IF NOT EXISTS public.sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- تتبع محاولات تسجيل الدخول
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_successful BOOLEAN DEFAULT FALSE,
    user_agent TEXT
);

-- سجل محاولات الاختراق وحظر العناوين المشبوهة
CREATE TABLE IF NOT EXISTS public.failed_logins (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    count INT DEFAULT 1,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMP
);

-- المصادقة الثنائية
CREATE TABLE IF NOT EXISTS public.two_factor_secrets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- رموز استعادة كلمات المرور
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- رموز تفعيل وتأكيد البريد الإلكتروني
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- الأجهزة الموثوقة للمستخدمين
CREATE TABLE IF NOT EXISTS public.user_devices (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    device_name VARCHAR(100),
    device_fingerprint VARCHAR(255) NOT NULL,
    is_trusted BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================================
-- 3. AUTOMATED ROLE-BASED TRIGGER WITH ADMIN WHITELIST (التحقق الآمن للمدراء والتجار والزبائن)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    inferred_role public.user_role;
    user_name VARCHAR(150);
    user_wilaya VARCHAR(100);
    user_commune VARCHAR(150);
    user_phone VARCHAR(30);
    meta_type TEXT;
BEGIN
    -- 1. استخراج الاسم من البيانات الوصفية أو استخدام بادئة البريد الإلكتروني تلقائيًا
    user_name := COALESCE(
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'full_name',
        SPLIT_PART(new.email, '@', 1)
    );

    -- 2. استخراج بيانات العنوان والهاتف
    user_wilaya := COALESCE(new.raw_user_meta_data->>'wilaya', 'Alger');
    user_commune := COALESCE(new.raw_user_meta_data->>'commune', 'Alger Center');
    user_phone := COALESCE(new.raw_user_meta_data->>'phone', new.phone);

    -- 3. تحديد نوع التسجيل لاستخراج الدور الوظيفي للحساب
    meta_type := LOWER(COALESCE(
        new.raw_user_meta_data->>'type',
        new.raw_user_meta_data->>'role',
        ''
    ));

    -- 4. تحديد الصلاحية تلقائيًا وبشكل صارم بناء على القائمة البيضاء للمشرفين
    IF new.email IN (
        'hadi47hadi58@gmail.com',
        'zinzinochop@gmail.com',
        'zinochop2024@gmail.com',
        'admin@zalo.dz',
        'admin@zalo.com',
        'manager@zalo.dz',
        'manager@zalo.com'
    ) OR new.email LIKE '%@zalo-admin.com' THEN
        inferred_role := 'ADMIN'::public.user_role;
    ELSIF meta_type = 'merchant' OR (new.raw_user_meta_data->>'is_merchant')::boolean = TRUE THEN
        inferred_role := 'MERCHANT'::public.user_role;
    ELSE
        inferred_role := 'CUSTOMER'::public.user_role;
    END IF;

    -- 5. إدراج البيانات في جدول المستخدمين الرئيسي
    INSERT INTO public.users (
        name,
        email,
        password_hash,
        role,
        status,
        wilaya,
        commune,
        phone,
        supabase_uid
    ) VALUES (
        user_name,
        new.email,
        'OAUTH_OR_EXTERNAL_SESSION',
        inferred_role,
        'ACTIVE'::public.user_status,
        user_wilaya,
        user_commune,
        user_phone,
        new.id
    )
    ON CONFLICT (email) DO UPDATE 
    SET 
        supabase_uid = EXCLUDED.supabase_uid,
        role = EXCLUDED.role,
        updated_at = NOW()
    WHERE public.users.supabase_uid IS NULL;

    -- 6. نسخ البيانات في جدول Profiles للتوافق التام مع الواجهة الأمامية القديمة
    BEGIN
        INSERT INTO public.profiles (
            id,
            name,
            email,
            phone,
            wilaya,
            commune,
            role,
            status,
            "createdAt",
            "updatedAt"
        ) VALUES (
            new.id,
            user_name,
            new.email,
            user_phone,
            user_wilaya,
            user_commune,
            LOWER(inferred_role::text),
            'active',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET
            role = LOWER(EXCLUDED.role),
            "updatedAt" = NOW();
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Profiles table not updated: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ربط محفز الحسابات الجديد بجدول مصادقة Supabase الداخلي
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- =====================================================================
-- 4. RETROACTIVE ROLE CONVERSION (ترقية الحسابات الحالية للرتب الإدارية الصحيحة فوراً)
-- =====================================================================

UPDATE public.users 
SET role = 'ADMIN'::public.user_role 
WHERE email IN (
    'hadi47hadi58@gmail.com',
    'zinzinochop@gmail.com',
    'zinochop2024@gmail.com',
    'admin@zalo.dz',
    'admin@zalo.com',
    'manager@zalo.dz',
    'manager@zalo.com'
) OR email LIKE '%@zalo-admin.com';

UPDATE public.profiles 
SET role = 'admin' 
WHERE email IN (
    'hadi47hadi58@gmail.com',
    'zinzinochop@gmail.com',
    'zinochop2024@gmail.com',
    'admin@zalo.dz',
    'admin@zalo.com',
    'manager@zalo.dz',
    'manager@zalo.com'
) OR email LIKE '%@zalo-admin.com';


-- =====================================================================
-- 5. ROW LEVEL SECURITY REPAIRS & UUID COMPATIBILITY (تصحيح سياسات الأمان ومكافحة الإغلاق)
-- =====================================================================

-- تفعيل الـ RLS على الجداول الأساسية لمنع الاختراق
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lifecycle ENABLE ROW LEVEL SECURITY;

-- 1. سياسات جدول Profiles
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update their own profiles" ON public.profiles;
CREATE POLICY "Allow users to update their own profiles" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- 2. سياسات جدول Users
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update their own users" ON public.users;
CREATE POLICY "Allow users to update their own users" ON public.users FOR UPDATE TO authenticated USING (supabase_uid = auth.uid());

-- 3. سياسات جدول Stores
DROP POLICY IF EXISTS "Allow public view stores" ON public.stores;
CREATE POLICY "Allow public view stores" ON public.stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow merchants to insert stores" ON public.stores;
CREATE POLICY "Allow merchants to insert stores" ON public.stores FOR INSERT TO authenticated 
WITH CHECK (
    merchant_id IN (SELECT id FROM public.users WHERE supabase_uid = auth.uid()) 
    OR public.get_current_user_role() = 'ADMIN'
);

DROP POLICY IF EXISTS "Allow merchants to update stores" ON public.stores;
CREATE POLICY "Allow merchants to update stores" ON public.stores FOR UPDATE TO authenticated 
USING (
    merchant_id IN (SELECT id FROM public.users WHERE supabase_uid = auth.uid()) 
    OR public.get_current_user_role() = 'ADMIN'
);

-- 4. سياسات جدول Products
DROP POLICY IF EXISTS "Allow public view products" ON public.products;
CREATE POLICY "Allow public view products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow merchants to manage products" ON public.products;
CREATE POLICY "Allow merchants to manage products" ON public.products FOR ALL TO authenticated 
USING (
    store_id IN (
        SELECT s.id FROM public.stores s
        JOIN public.users u ON s.merchant_id = u.id
        WHERE u.supabase_uid = auth.uid()
    )
    OR public.get_current_user_role() = 'ADMIN'
);

-- 5. سياسات جدول Orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT TO authenticated 
USING (
    customer_id IN (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    OR store_id IN (
        SELECT s.id FROM public.stores s
        JOIN public.users u ON s.merchant_id = u.id
        WHERE u.supabase_uid = auth.uid()
    )
    OR public.get_current_user_role() = 'ADMIN'
);

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT TO authenticated 
WITH CHECK (
    customer_id IN (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
);

DROP POLICY IF EXISTS "Merchants can update orders of their store" ON public.orders;
CREATE POLICY "Merchants can update orders of their store" ON public.orders FOR UPDATE TO authenticated 
USING (
    store_id IN (
        SELECT s.id FROM public.stores s
        JOIN public.users u ON s.merchant_id = u.id
        WHERE u.supabase_uid = auth.uid()
    )
    OR public.get_current_user_role() = 'ADMIN'
);

-- 6. سياسات جدول Payment Proofs
DROP POLICY IF EXISTS "Users and merchants can view payment proofs" ON public.payment_proofs;
CREATE POLICY "Users and merchants can view payment proofs" ON public.payment_proofs FOR SELECT TO authenticated 
USING (
    customer_id IN (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    OR order_id IN (
        SELECT o.id FROM public.orders o
        JOIN public.stores s ON o.store_id = s.id
        JOIN public.users u ON s.merchant_id = u.id
        WHERE u.supabase_uid = auth.uid()
    )
    OR public.get_current_user_role() = 'ADMIN'
);

DROP POLICY IF EXISTS "Users can insert payment proofs" ON public.payment_proofs;
CREATE POLICY "Users can insert payment proofs" ON public.payment_proofs FOR INSERT TO authenticated 
WITH CHECK (
    customer_id IN (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
);

-- 7. سياسات جدول User Devices
DROP POLICY IF EXISTS "Users can manage their own devices" ON public.user_devices;
CREATE POLICY "Users can manage their own devices" ON public.user_devices FOR ALL TO authenticated 
USING (user_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid()))
WITH CHECK (user_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid()));

-- 8. سياسات جدول Two Factor Secrets
DROP POLICY IF EXISTS "Users can manage their own 2fa secrets" ON public.two_factor_secrets;
CREATE POLICY "Users can manage their own 2fa secrets" ON public.two_factor_secrets FOR ALL TO authenticated 
USING (user_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid()))
WITH CHECK (user_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid()));

-- 9. سياسات جدول Order Lifecycle
DROP POLICY IF EXISTS "Users and Merchants can view order lifecycles" ON public.order_lifecycle;
CREATE POLICY "Users and Merchants can view order lifecycles" ON public.order_lifecycle FOR SELECT TO authenticated 
USING (
    order_id IN (SELECT id FROM public.orders)
);


-- =====================================================================
-- 6. MISSING PERFORMANCE INDEXES (تحسين سرعة الاستجابة وعمليات البحث الفوري)
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_users_email_lowercase ON public.users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_email_lowercase ON public.profiles (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_supabase_uid_hash ON public.users USING hash (supabase_uid);
CREATE INDEX IF NOT EXISTS idx_stores_merchant_status ON public.stores (merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_products_store_active ON public.products (store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON public.orders (customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON public.orders (store_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON public.reviews (product_id, rating);
CREATE INDEX IF NOT EXISTS idx_complaints_order_status ON public.complaints (order_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_merchant_status ON public.subscriptions (merchant_id, status);


-- =====================================================================
-- 7. SECURE SECURITY DEFINERS (تعزيز أمان الدوال المعرّفة برتبة الأمان)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS VARCHAR AS $$
DECLARE
    u_role VARCHAR;
BEGIN
    SELECT role::VARCHAR INTO u_role FROM public.users WHERE supabase_uid = auth.uid() LIMIT 1;
    RETURN COALESCE(u_role, 'CUSTOMER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- =====================================================================
-- 8. SYSTEM STABILITY LOGGER (تسجيل تدقيق الاستقرار)
-- =====================================================================

INSERT INTO public.audit_logs (actor_name, action, details)
VALUES (
    'System Audit & Ultimate Repair Patch', 
    'DATABASE_COMPREHENSIVE_REPAIR_V2', 
    'تم تحديث رقعة الإصلاح وإضافة التحقق الكامل لجدول payment_proofs وترقية المشرفين والقائمة البيضاء بنجاح.'
)
ON CONFLICT DO NOTHING;
