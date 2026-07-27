-- =====================================================================
-- Migration: Create merchant_requests table
-- Date: 2026-07-27
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.merchant_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email TEXT,
    store_name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    commercial_register TEXT, 
    tax_number TEXT,
    description TEXT,
    wilaya TEXT,
    store_type TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Basic RLS
ALTER TABLE public.merchant_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_see_own_requests" ON public.merchant_requests;
CREATE POLICY "user_see_own_requests" ON public.merchant_requests
    FOR SELECT USING (auth.uid() = user_id OR email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "user_insert_own_request" ON public.merchant_requests;
CREATE POLICY "user_insert_own_request" ON public.merchant_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id OR email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "admin_manage_merchant_requests" ON public.merchant_requests;
CREATE POLICY "admin_manage_merchant_requests" ON public.merchant_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );
