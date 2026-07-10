-- =====================================================================
-- ZaLo Marketplace Smart: Security & Performance Idempotent Migration
-- مهندس قاعدة البيانات الأقدم - نظام تفعيل الأمن والحماية القصوى وسرعة التجاوب
-- =====================================================================

-- 1. SCHEMA FIXES & SYNCHRONIZATION (تنظيف وضبط أسماء الحقول لتتوافق مع نظام الكود)
-- Ensure 'users' table columns are lowercase and formatted as requested (password_hash and loyalty_points)
DO $$
BEGIN
    -- Rename passwordHash to password_hash if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'passwordhash') THEN
        ALTER TABLE users RENAME COLUMN passwordhash TO password_hash;
    END IF;

    -- Rename loyaltyPoints to loyalty_points if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'loyaltypoints') THEN
        ALTER TABLE users RENAME COLUMN loyaltypoints TO loyalty_points;
    END IF;

    -- Double check that supabase_uid column exists on users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'supabase_uid') THEN
        ALTER TABLE users ADD COLUMN supabase_uid UUID UNIQUE;
    END IF;
END $$;


-- 2. ENABLE ROW LEVEL SECURITY (RLS) (تفعيل جدار الحماية والخصوصية على مستوى السطر لكل جدول)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;


-- 3. IDEMPOTENT POLICIES CREATION (إنشاء سياسات الوصول الأمن الذاتي للمستخدمين والتجار)

-- Users Table Policies
DROP POLICY IF EXISTS "Users can view their own profile only" ON users;
CREATE POLICY "Users can view their own profile only" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = supabase_uid);

DROP POLICY IF EXISTS "Users can update their own profile only" ON users;
CREATE POLICY "Users can update their own profile only" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = supabase_uid)
    WITH CHECK (auth.uid() = supabase_uid);

-- Sessions Table Policies
DROP POLICY IF EXISTS "Users can view their own sessions only" ON sessions;
CREATE POLICY "Users can view their own sessions only" ON sessions
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT id FROM users WHERE supabase_uid = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own sessions only" ON sessions;
CREATE POLICY "Users can delete their own sessions only" ON sessions
    FOR DELETE
    TO authenticated
    USING (user_id = (SELECT id FROM users WHERE supabase_uid = auth.uid()));


-- Products Table Policies (Allow merchants to manage their own products linked via store_id)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Stores policies
DROP POLICY IF EXISTS "Merchants can manage their own stores" ON stores;
CREATE POLICY "Merchants can manage their own stores" ON stores
    FOR ALL
    TO authenticated
    USING (
        merchant_id = (SELECT id FROM users WHERE supabase_uid = auth.uid())
    );

-- Products policies
DROP POLICY IF EXISTS "Everyone can view active products" ON products;
CREATE POLICY "Everyone can view active products" ON products
    FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Merchants can manage their own products" ON products;
CREATE POLICY "Merchants can manage their own products" ON products
    FOR ALL
    TO authenticated
    USING (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON s.merchant_id = u.id
            WHERE u.supabase_uid = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT s.id FROM stores s
            JOIN users u ON s.merchant_id = u.id
            WHERE u.supabase_uid = auth.uid()
        )
    );


-- 4. PERFORMANCE INDEXES (إنشاء الفهارس لضمان أداء خارق وسريع في استرجاع البيانات)
CREATE INDEX IF NOT EXISTS idx_users_email_lowercase ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_supabase_uid ON users (supabase_uid);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_id ON orders (id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_text ON sessions (token);
