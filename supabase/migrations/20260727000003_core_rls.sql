-- =====================================================================
-- Migration: Core Tables RLS Policies (Stores, Products, Orders)
-- Date: 2026-07-27
-- =====================================================================

-- 1. STORES
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_read_policy" ON public.stores;
CREATE POLICY "stores_read_policy" ON public.stores 
    FOR SELECT USING (
        status = 'active' 
        OR id = auth.uid() 
        OR merchant_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

DROP POLICY IF EXISTS "stores_update_policy" ON public.stores;
CREATE POLICY "stores_update_policy" ON public.stores 
    FOR UPDATE USING (
        id = auth.uid() 
        OR merchant_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- 2. PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_read_policy" ON public.products;
CREATE POLICY "products_read_policy" ON public.products 
    FOR SELECT USING (TRUE); -- Everyone can view products

DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
CREATE POLICY "products_insert_policy" ON public.products 
    FOR INSERT WITH CHECK (
        store_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.merchant_id = auth.uid())
    );

DROP POLICY IF EXISTS "products_update_policy" ON public.products;
CREATE POLICY "products_update_policy" ON public.products 
    FOR UPDATE USING (
        store_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.merchant_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
CREATE POLICY "products_delete_policy" ON public.products 
    FOR DELETE USING (
        store_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.merchant_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- 3. ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_read_policy" ON public.orders;
CREATE POLICY "orders_read_policy" ON public.orders 
    FOR SELECT USING (
        user_id = auth.uid() -- Customer reading their own orders
        OR store_id = auth.uid() -- Store owner reading their orders
        OR EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.merchant_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
CREATE POLICY "orders_insert_policy" ON public.orders 
    FOR INSERT WITH CHECK (user_id = auth.uid()); -- Only customers can create their own orders

DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
CREATE POLICY "orders_update_policy" ON public.orders 
    FOR UPDATE USING (
        store_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.merchant_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

