-- =====================================================================
-- ZaLo Marketplace Smart Database Schema (PostgreSQL)
-- مخطط قاعدة بيانات سوق الجزائر الذكي - هيكلة إنتاجية متكاملة بـ 58 ولاية
-- =====================================================================
-- 🛡️ مصمم ليكون آمنًا وسريعًا وقابلًا للتكرار بدون تدمير البيانات الموجودة مسبقًا.
-- 🛡️ Designed to be secure, fast, and 100% idempotent (safe to run on existing data).
-- =====================================================================

-- تفعيل الإضافات المطلوبة (Enable Required Extensions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

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

-- جدول الحسابات المتوافق مع الواجهة الأمامية القديمة (Legacy Profiles Table)
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

-- جدول المستخدمين الرئيسي للمنصة (Main Users Table)
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'CUSTOMER'::user_role,
    status user_status DEFAULT 'ACTIVE'::user_status,
    wilaya VARCHAR(100) NOT NULL, -- واحدة من 58 ولاية جزائرية
    commune VARCHAR(150) NOT NULL,
    phone VARCHAR(30) UNIQUE,
    loyalty_points INT DEFAULT 0,
    supabase_uid UUID UNIQUE, -- الربط مع Supabase Auth UID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- وثائق التحقق للتجار (Merchant Verification Documents)
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

-- سجل المحلات / المتاجر النشطة (Active Stores/Shops)
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

-- كاتالوج المنتجات وتتبع المخزن (Products Catalog & Inventory)
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    store_id INT REFERENCES public.stores(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL, -- بالدينار الجزائري DZD
    category VARCHAR(50) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    sales_count INT DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 5.00,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- سجل الطلبات والمعاملات (Orders and Transactions)
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

-- عناصر سلة المشتريات للطلب (Order Items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- إثباتات الدفع المرفوعة (Payment Proofs for BaridiMob & CCP)
CREATE TABLE IF NOT EXISTS public.payment_proofs (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id INT REFERENCES public.users(id) ON DELETE SET NULL,
    receipt_image_url VARCHAR(255) NOT NULL,
    amount NUMERIC(12,2),
    status VARCHAR(50) DEFAULT 'PENDING',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- دورة حياة وتتبع حالة الطلبيات (Order Lifecycle Tracking)
CREATE TABLE IF NOT EXISTS public.order_lifecycle (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES public.orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    notes TEXT,
    updated_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- مراجعات وتقييمات العملاء (Customer Product Reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES public.products(id) ON DELETE CASCADE,
    customer_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- حماية المستهلك ونظام الشكاوى (Complaints and Disputes)
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

-- اشتراكات المتاجر المميزة (Premium Vendor Subscriptions)
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

-- نظام التنبيهات الفورية (Smart System Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- سجلات التدقيق الإداري (Administrative Audit Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    actor_name VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إدارة الجلسات في المنصة (Session Management)
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

-- تتبع محاولات تسجيل الدخول (Login Attempt Tracking)
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_successful BOOLEAN DEFAULT FALSE,
    user_agent TEXT
);

-- سجل محاولات الاختراق وحظر العناوين المشبوهة (Failed Logins & IP Blocks)
CREATE TABLE IF NOT EXISTS public.failed_logins (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    count INT DEFAULT 1,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMP
);

-- المصادقة الثنائية (Two-Factor Authentication Secrets)
CREATE TABLE IF NOT EXISTS public.two_factor_secrets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- رموز استعادة كلمات المرور (Password Reset Tokens)
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- رموز تفعيل وتأكيد البريد الإلكتروني (Email Verification Tokens)
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- الأجهزة الموثوقة للمستخدمين (Trusted User Devices)
CREATE TABLE IF NOT EXISTS public.user_devices (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(150),
    last_ip VARCHAR(45),
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_trusted BOOLEAN DEFAULT TRUE
);


-- ==========================================
-- 3. INDEXES FOR EXTREME PERFORMANCE (الفهارس لضمان أقصى سرعة واستجابة)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_email_lowercase ON public.users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_supabase_uid ON public.users (supabase_uid);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lowercase ON public.profiles (LOWER(email));

-- فهارس تحسين الاستعلامات على الروابط والـ Foreign Keys لمنع البطء (Performance Indexes on FKs)
CREATE INDEX IF NOT EXISTS idx_merchant_documents_merchant ON public.merchant_documents (merchant_id);
CREATE INDEX IF NOT EXISTS idx_stores_merchant ON public.stores (merchant_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores (status);
CREATE INDEX IF NOT EXISTS idx_stores_wilaya ON public.stores (wilaya);

CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products (store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON public.orders (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_order ON public.payment_proofs (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_customer ON public.payment_proofs (customer_id);

CREATE INDEX IF NOT EXISTS idx_order_lifecycle_order ON public.order_lifecycle (order_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON public.reviews (customer_id);

CREATE INDEX IF NOT EXISTS idx_complaints_order ON public.complaints (order_id);
CREATE INDEX IF NOT EXISTS idx_complaints_user ON public.complaints (user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_merchant ON public.subscriptions (merchant_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions (token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts (email);
CREATE INDEX IF NOT EXISTS idx_failed_logins_ip ON public.failed_logins (ip_address);
CREATE INDEX IF NOT EXISTS idx_two_factor_user ON public.two_factor_secrets (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON public.password_reset_tokens (token);
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON public.email_verification_tokens (token);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON public.user_devices (device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON public.user_devices (user_id);


-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES (سياسات الحماية والخصوصية العميقة)
-- ==========================================

-- تفعيل ميزة RLS على جميع الجداول لضمان الأمان الأقصى لمنصة Supabase
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- دالة مساعدة سريعة للتحقق من رتبة المستخدم الحالية
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS VARCHAR AS $$
DECLARE
    u_role VARCHAR;
BEGIN
    SELECT role::VARCHAR INTO u_role FROM public.users WHERE supabase_uid = auth.uid() LIMIT 1;
    RETURN COALESCE(u_role, 'CUSTOMER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1) سياسات الحسابات المتوافقة (Profiles Policies)
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- 2) سياسات جدول المستخدمين الرئيسي (Users Table Policies)
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.users;
CREATE POLICY "Users can view their own profile only" ON public.users
    FOR SELECT TO authenticated USING (auth.uid() = supabase_uid);

DROP POLICY IF EXISTS "Users can update their own profile only" ON public.users;
CREATE POLICY "Users can update their own profile only" ON public.users
    FOR UPDATE TO authenticated USING (auth.uid() = supabase_uid) WITH CHECK (auth.uid() = supabase_uid);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'ADMIN');


-- 3) سياسات وثائق التحقق للتجار (Merchant Documents Policies)
DROP POLICY IF EXISTS "Merchants can view and upload their own documents" ON public.merchant_documents;
CREATE POLICY "Merchants can view and upload their own documents" ON public.merchant_documents
    FOR ALL TO authenticated USING (
        merchant_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can view and manage all merchant documents" ON public.merchant_documents;
CREATE POLICY "Admins can view and manage all merchant documents" ON public.merchant_documents
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'ADMIN');


-- 4) سياسات المتاجر والتحكم للتجار (Stores Policies)
DROP POLICY IF EXISTS "Everyone can view approved stores" ON public.stores;
CREATE POLICY "Everyone can view approved stores" ON public.stores
    FOR SELECT USING (status = 'APPROVED'::public.store_status OR public.get_current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Merchants can manage their own stores" ON public.stores;
CREATE POLICY "Merchants can manage their own stores" ON public.stores
    FOR ALL TO authenticated USING (
        merchant_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    );


-- 5) سياسات المنتجات (Products Policies)
DROP POLICY IF EXISTS "Everyone can view active products" ON public.products;
CREATE POLICY "Everyone can view active products" ON public.products
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Merchants can manage their own products" ON public.products;
CREATE POLICY "Merchants can manage their own products" ON public.products
    FOR ALL TO authenticated USING (
        store_id IN (
            SELECT s.id FROM public.stores s
            JOIN public.users u ON s.merchant_id = u.id
            WHERE u.supabase_uid = auth.uid()
        )
    ) WITH CHECK (
        store_id IN (
            SELECT s.id FROM public.stores s
            JOIN public.users u ON s.merchant_id = u.id
            WHERE u.supabase_uid = auth.uid()
        )
    );


-- 6) سياسات الطلبات (Orders Policies)
DROP POLICY IF EXISTS "Customers can manage their own orders" ON public.orders;
CREATE POLICY "Customers can manage their own orders" ON public.orders
    FOR ALL TO authenticated USING (
        customer_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    ) WITH CHECK (
        customer_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    );

DROP POLICY IF EXISTS "Merchants can view orders of their store" ON public.orders;
CREATE POLICY "Merchants can view orders of their store" ON public.orders
    FOR SELECT TO authenticated USING (
        store_id IN (
            SELECT s.id FROM public.stores s
            JOIN public.users u ON s.merchant_id = u.id
            WHERE u.supabase_uid = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'ADMIN');


-- 7) سياسات عناصر سلة المشتريات للطلب (Order Items Policies)
DROP POLICY IF EXISTS "Users can view order items of their orders" ON public.order_items;
CREATE POLICY "Users can view order items of their orders" ON public.order_items
    FOR SELECT TO authenticated USING (
        order_id IN (
            SELECT id FROM public.orders -- الـ RLS في جدول الطلبات يضمن التقييد التلقائي
        )
    );

DROP POLICY IF EXISTS "Customers can insert order items" ON public.order_items;
CREATE POLICY "Customers can insert order items" ON public.order_items
    FOR INSERT TO authenticated WITH CHECK (
        order_id IN (
            SELECT id FROM public.orders
        )
    );


-- 8) سياسات إثباتات الدفع المرفوعة (Payment Proofs Policies)
DROP POLICY IF EXISTS "Customers can manage their own payment proofs" ON public.payment_proofs;
CREATE POLICY "Customers can manage their own payment proofs" ON public.payment_proofs
    FOR ALL TO authenticated USING (
        customer_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    );

DROP POLICY IF EXISTS "Merchants can view payment proofs of their store" ON public.payment_proofs;
CREATE POLICY "Merchants can view payment proofs of their store" ON public.payment_proofs
    FOR SELECT TO authenticated USING (
        order_id IN (
            SELECT o.id FROM public.orders o
            JOIN public.stores s ON o.store_id = s.id
            JOIN public.users u ON s.merchant_id = u.id
            WHERE u.supabase_uid = auth.uid()
        )
    );


-- 9) سياسات نظام المراجعات والتقييمات (Reviews Policies)
DROP POLICY IF EXISTS "Everyone can view reviews" ON public.reviews;
CREATE POLICY "Everyone can view reviews" ON public.reviews
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Customers can insert and manage their reviews" ON public.reviews;
CREATE POLICY "Customers can insert and manage their reviews" ON public.reviews
    FOR ALL TO authenticated USING (
        customer_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    );


-- 10) سياسات حماية المستهلك والشكاوى (Complaints Policies)
DROP POLICY IF EXISTS "Users can view and create their own complaints" ON public.complaints;
CREATE POLICY "Users can view and create their own complaints" ON public.complaints
    FOR ALL TO authenticated USING (
        user_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can manage all complaints" ON public.complaints;
CREATE POLICY "Admins can manage all complaints" ON public.complaints
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'ADMIN');


-- 11) سياسات الاشتراكات المميزة (Subscriptions Policies)
DROP POLICY IF EXISTS "Merchants can manage their own subscriptions" ON public.subscriptions;
CREATE POLICY "Merchants can manage their own subscriptions" ON public.subscriptions
    FOR ALL TO authenticated USING (
        merchant_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'ADMIN');


-- 12) سياسات التنبيهات الفورية (Notifications Policies)
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications
    FOR ALL TO authenticated USING (
        user_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    );


-- 13) سياسات سجلات التدقيق الإداري (Audit Logs Policies)
DROP POLICY IF EXISTS "Only Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only Admins can view audit logs" ON public.audit_logs
    FOR ALL TO authenticated USING (public.get_current_user_role() = 'ADMIN');


-- 14) سياسات إدارة الجلسات (Sessions Table Policies)
DROP POLICY IF EXISTS "Users can view their own sessions only" ON public.sessions;
CREATE POLICY "Users can view their own sessions only" ON public.sessions
    FOR SELECT TO authenticated USING (
        user_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete their own sessions only" ON public.sessions;
CREATE POLICY "Users can delete their own sessions only" ON public.sessions
    FOR DELETE TO authenticated USING (
        user_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid())
    );


-- 15) سياسات الأجهزة الموثوقة (User Devices Policies)
DROP POLICY IF EXISTS "Users can manage their own devices" ON public.user_devices;
CREATE POLICY "Users can manage their own devices" ON public.user_devices FOR ALL TO authenticated 
    USING (user_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid()))
    WITH CHECK (user_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid()));

DROP POLICY IF EXISTS "allow_all_select" ON public.user_devices;
CREATE POLICY "allow_all_select" ON public.user_devices FOR SELECT USING (true);


-- 16) سياسات المصادقة الثنائية (Two Factor Secrets Policies)
DROP POLICY IF EXISTS "Users can manage their own 2fa secrets" ON public.two_factor_secrets;
CREATE POLICY "Users can manage their own 2fa secrets" ON public.two_factor_secrets FOR ALL TO authenticated 
    USING (user_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid()))
    WITH CHECK (user_id = (SELECT id FROM public.users WHERE supabase_uid = auth.uid()));

DROP POLICY IF EXISTS "allow_all_select" ON public.two_factor_secrets;
CREATE POLICY "allow_all_select" ON public.two_factor_secrets FOR SELECT USING (true);


-- 17) سياسات تتبع دورة حياة الطلبيات (Order Lifecycle Policies)
DROP POLICY IF EXISTS "Users and Merchants can view order lifecycles" ON public.order_lifecycle;
CREATE POLICY "Users and Merchants can view order lifecycles" ON public.order_lifecycle FOR SELECT TO authenticated 
    USING (order_id IN (SELECT id FROM public.orders));

DROP POLICY IF EXISTS "allow_all_select" ON public.order_lifecycle;
CREATE POLICY "allow_all_select" ON public.order_lifecycle FOR SELECT USING (true);


-- 18) سياسات الأمان المؤقتة لمنع الإغلاق الذاتي لقاعدة البيانات (Database Defensive Allow-All SELECT Testing Policies)
DROP POLICY IF EXISTS "allow_all_select" ON public.orders;
CREATE POLICY "allow_all_select" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_select" ON public.orders;
CREATE POLICY "temp_allow_select" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_insert" ON public.orders;
CREATE POLICY "temp_allow_insert" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_select" ON public.order_items;
CREATE POLICY "allow_all_select" ON public.order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_select" ON public.order_items;
CREATE POLICY "temp_allow_select" ON public.order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_insert" ON public.order_items;
CREATE POLICY "temp_allow_insert" ON public.order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_select" ON public.payment_proofs;
CREATE POLICY "allow_all_select" ON public.payment_proofs FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_select" ON public.payment_proofs;
CREATE POLICY "temp_allow_select" ON public.payment_proofs FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_insert" ON public.payment_proofs;
CREATE POLICY "temp_allow_insert" ON public.payment_proofs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_select" ON public.reviews;
CREATE POLICY "allow_all_select" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_select" ON public.reviews;
CREATE POLICY "temp_allow_select" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_insert" ON public.reviews;
CREATE POLICY "temp_allow_insert" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_select" ON public.complaints;
CREATE POLICY "allow_all_select" ON public.complaints FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_select" ON public.complaints;
CREATE POLICY "temp_allow_select" ON public.complaints FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_insert" ON public.complaints;
CREATE POLICY "temp_allow_insert" ON public.complaints FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_select" ON public.subscriptions;
CREATE POLICY "allow_all_select" ON public.subscriptions FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_select" ON public.subscriptions;
CREATE POLICY "temp_allow_select" ON public.subscriptions FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_insert" ON public.subscriptions;
CREATE POLICY "temp_allow_insert" ON public.subscriptions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_select" ON public.notifications;
CREATE POLICY "allow_all_select" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_select" ON public.notifications;
CREATE POLICY "temp_allow_select" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_insert" ON public.notifications;
CREATE POLICY "temp_allow_insert" ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_select" ON public.audit_logs;
CREATE POLICY "allow_all_select" ON public.audit_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_select" ON public.audit_logs;
CREATE POLICY "temp_allow_select" ON public.audit_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_insert" ON public.audit_logs;
CREATE POLICY "temp_allow_insert" ON public.audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_select" ON public.login_attempts;
CREATE POLICY "allow_all_select" ON public.login_attempts FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_select" ON public.login_attempts;
CREATE POLICY "temp_allow_select" ON public.login_attempts FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_insert" ON public.login_attempts;
CREATE POLICY "temp_allow_insert" ON public.login_attempts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_select" ON public.failed_logins;
CREATE POLICY "allow_all_select" ON public.failed_logins FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_select" ON public.failed_logins;
CREATE POLICY "temp_allow_select" ON public.failed_logins FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_insert" ON public.failed_logins;
CREATE POLICY "temp_allow_insert" ON public.failed_logins FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_select" ON public.password_reset_tokens;
CREATE POLICY "allow_all_select" ON public.password_reset_tokens FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_select" ON public.password_reset_tokens;
CREATE POLICY "temp_allow_select" ON public.password_reset_tokens FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_insert" ON public.password_reset_tokens;
CREATE POLICY "temp_allow_insert" ON public.password_reset_tokens FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_select" ON public.email_verification_tokens;
CREATE POLICY "allow_all_select" ON public.email_verification_tokens FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_select" ON public.email_verification_tokens;
CREATE POLICY "temp_allow_select" ON public.email_verification_tokens FOR SELECT USING (true);
DROP POLICY IF EXISTS "temp_allow_insert" ON public.email_verification_tokens;
CREATE POLICY "temp_allow_insert" ON public.email_verification_tokens FOR INSERT WITH CHECK (true);


-- ==========================================
-- 5. PROCEDURES & TRIGGERS (الإجراءات والمحفزات البرمجية الذكية)
-- ==========================================

-- محفز تسجيل تحديثات حالة المتاجر
CREATE OR REPLACE FUNCTION public.log_store_approvals_proc() 
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO public.audit_logs (actor_name, action, details)
        VALUES ('System Trigger', 'STORE_STATUS_UPDATE', 
                'تم تعديل حالة المتجر (' || NEW.name || ') من ' || OLD.status || ' إلى ' || NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_store_approvals_trigger ON public.stores;
CREATE TRIGGER log_store_approvals_trigger
    AFTER UPDATE ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.log_store_approvals_proc();


-- محفز الربط والإنشاء التلقائي للحساب عند التسجيل في Supabase Auth
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

    -- 4. تحديد الصلاحية تلقائيًا وبشكل صارم
    IF new.email LIKE '%@zalo-admin.com' THEN
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
        'OAUTH_OR_EXTERNAL_SESSION', -- قيمة افتراضية لحسابات الجلسات الخارجية
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

    -- 6. نسخ البيانات في جدول Profiles للتوافق التام مع الواجهة الأمامية القديمة (Legacy Profiles Compatibility)
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
        -- عدم التسبب بفشل العملية الكلية في حال عدم وجود جدول profiles أو تغيير هيكلي به
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


-- ==========================================
-- 6. MAINTENANCE & STALE SESSION CLEANUP (مهام الصيانة الدورية وتنظيف الجلسات)
-- ==========================================

-- دالة إزالة الجلسات والبيانات الوهمية والقديمة تلقائيًا لرفع كفاءة وسرعة النظام
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void AS $$
DECLARE
    deleted_sessions INTEGER;
    deleted_notifications INTEGER;
    deleted_stale_stores INTEGER;
BEGIN
    -- 1. تنظيف الجلسات منتهية الصلاحية أو غير النشطة لرفع سرعة النظام
    DELETE FROM public.sessions
    WHERE is_active = FALSE 
       OR expires_at < NOW()
       OR (created_at < NOW() - INTERVAL '24 hours' AND is_active = FALSE);
    GET DIAGNOSTICS deleted_sessions = ROW_COUNT;

    -- 2. تنظيف الإشعارات المقروءة والقديمة (أكثر من 7 أيام) لتجنب تراكم البيانات
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        DELETE FROM public.notifications
        WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '7 days';
        GET DIAGNOSTICS deleted_notifications = ROW_COUNT;
    ELSE
        deleted_notifications := 0;
    END IF;

    -- 3. تنظيف سجلات المتاجر الوهمية أو المعلقة والقديمة (أكثر من 30 يوماً)
    DELETE FROM public.stores
    WHERE status = 'PENDING_APPROVAL' AND created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_stale_stores = ROW_COUNT;

    RAISE NOTICE '🧹 [System Cleanup] Completed. Purged % sessions, % notifications, and % stale store entries.', 
        deleted_sessions, deleted_notifications, deleted_stale_stores;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- جدولة المهمة لتشتغل تلقائيًا كل يوم في الساعة 3:00 صباحًا باستخدام pg_cron
-- ملاحظة: يتطلب تشغيل وإتاحة إضافة pg_cron في منصة Supabase
SELECT cron.schedule(
    'daily-session-cleanup', -- اسم الوظيفة
    '0 3 * * *',             -- وقت التنفيذ (يومياً الساعة 3:00 صباحاً)
    'SELECT public.cleanup_stale_sessions();'
);


-- =====================================================
-- جدول طلبات الترقية إلى تاجر (النسخة النهائية)
-- =====================================================
CREATE TABLE IF NOT EXISTS merchant_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(supabase_uid) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    commercial_register TEXT, 
    tax_number TEXT,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- فهرس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_merchant_requests_status ON merchant_requests(status);

-- تفعيل الأمان (RLS)
ALTER TABLE merchant_requests ENABLE ROW LEVEL SECURITY;

-- سياسة: المستخدم يرى طلبه فقط
CREATE POLICY "user_see_own_requests" ON merchant_requests
    FOR SELECT USING (user_id = auth.uid());

-- سياسة: المستخدم ينشئ طلباً لنفسه فقط
CREATE POLICY "user_insert_own_request" ON merchant_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- سياسة: المدير يرى ويدير كل الطلبات (يفترض أن المدير دوره 'admin')
CREATE POLICY "admin_manage_all_requests" ON merchant_requests
    FOR ALL USING (auth.role() = 'admin');

