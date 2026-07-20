-- =========================================================================
-- ZaLo Smart Algerian Multivendor Marketplace - Automated Role-Based Trigger
-- =========================================================================
-- This script configures a trigger on auth.users in Supabase to automatically
-- replicate user accounts into public.users with smart role deduction.
-- =========================================================================

-- Enable uuid-ossp extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    -- 1. Deduce name from metadata or default to email prefix
    user_name := COALESCE(
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'full_name',
        SPLIT_PART(new.email, '@', 1)
    );

    -- 2. Extract properties from metadata or apply defaults
    user_wilaya := COALESCE(new.raw_user_meta_data->>'wilaya', 'Alger');
    user_commune := COALESCE(new.raw_user_meta_data->>'commune', 'Alger Center');
    user_phone := NULLIF(COALESCE(new.raw_user_meta_data->>'phone', new.phone), '');

    -- 3. Extract metadata type to check role (case-insensitive)
    meta_type := LOWER(COALESCE(
        new.raw_user_meta_data->>'type',
        new.raw_user_meta_data->>'role',
        ''
    ));

    -- 4. Infer user role based on email domain or metadata
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

    -- 5. Insert/upsert into public.users
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
        'OAUTH_OR_EXTERNAL_SESSION', -- Dummy value to satisfy NOT NULL constraint
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

    -- Legacy profiles table retired

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
