-- =====================================================================
-- Migration: Comprehensive Fixes (Career Applications, RLS Security, STAFF Role)
-- Date: 2026-07-26
-- =====================================================================

-- 1. Add STAFF role to user_role ENUM if not exists
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'STAFF';

-- 2. Create has_role Security Definer Function
CREATE OR REPLACE FUNCTION public.has_role(_user_uid UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE supabase_uid = _user_uid
      AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, user_role) TO anon, authenticated, service_role;

-- 3. Create career_applications table
CREATE TABLE IF NOT EXISTS public.career_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    position VARCHAR(150) NOT NULL,
    cv_url TEXT,
    cover_letter TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_applications_status ON public.career_applications(status);
CREATE INDEX IF NOT EXISTS idx_career_applications_email ON public.career_applications(email);

-- Enable RLS for career_applications
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors on re-run
DROP POLICY IF EXISTS "allow_insert_career_applications" ON public.career_applications;
DROP POLICY IF EXISTS "admin_manage_career_applications" ON public.career_applications;

-- Policy: Allow everyone (anon + authenticated) to submit a job application
CREATE POLICY "allow_insert_career_applications" ON public.career_applications
    FOR INSERT WITH CHECK (true);

-- Policy: Allow ADMIN and STAFF to view, update, delete applications
CREATE POLICY "admin_manage_career_applications" ON public.career_applications
    FOR ALL USING (
        public.has_role(auth.uid(), 'ADMIN'::user_role) 
        OR public.has_role(auth.uid(), 'STAFF'::user_role)
    );

-- Grants for career_applications
GRANT SELECT, INSERT ON public.career_applications TO anon, authenticated;
GRANT ALL ON public.career_applications TO service_role;

-- 4. Fix merchant_requests RLS policy (replace auth.role() = 'admin' with has_role)
ALTER TABLE public.merchant_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_all_requests" ON merchant_requests;
DROP POLICY IF EXISTS "admin_manage_merchant_requests" ON merchant_requests;

CREATE POLICY "admin_manage_merchant_requests" ON merchant_requests
    FOR ALL USING (
        public.has_role(auth.uid(), 'ADMIN'::user_role) 
        OR public.has_role(auth.uid(), 'STAFF'::user_role)
    );

GRANT ALL ON public.merchant_requests TO authenticated, service_role;
