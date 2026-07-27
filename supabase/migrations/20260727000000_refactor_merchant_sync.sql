-- =====================================================================
-- Migration: Architectural Refactoring - Centralize State in DB Triggers
-- Date: 2026-07-27
-- =====================================================================
-- Goal: Remove frontend reliance on updating multiple tables (merchant_requests, profiles, users, stores)
-- Solution: A database trigger that automatically syncs the state when a request is approved/rejected.

CREATE OR REPLACE FUNCTION public.sync_merchant_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only act if the status has changed
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        
        -- CASE 1: APPROVED
        IF NEW.status = 'approved' THEN
            -- 1. Update Profile (Single Source of Truth for frontend)
            UPDATE public.profiles 
            SET status = 'approved', role = 'merchant' 
            WHERE id = NEW.user_id;

            -- 2. Update Legacy Users Table
            UPDATE public.users 
            SET role = 'MERCHANT' 
            WHERE supabase_uid = NEW.user_id;

            -- 3. Create or Reactivate Store
            INSERT INTO public.stores (id, merchant_id, name, wilaya, phone, status, store_name, category)
            VALUES (
                NEW.user_id, -- Using user_id as store_id to keep a 1:1 mapped relationship
                NEW.user_id, 
                COALESCE(NEW.store_name, 'متجر معتمد'), 
                NEW.wilaya, 
                NEW.phone, 
                'active',
                COALESCE(NEW.store_name, 'متجر معتمد'),
                NEW.store_type
            )
            ON CONFLICT (id) DO UPDATE 
            SET status = 'active', 
                name = COALESCE(EXCLUDED.name, public.stores.name),
                store_name = COALESCE(EXCLUDED.store_name, public.stores.store_name);
                
        -- CASE 2: REJECTED / SUSPENDED
        ELSIF NEW.status = 'rejected' OR NEW.status = 'suspended' THEN
            -- Revert profile status
            UPDATE public.profiles 
            SET status = NEW.status
            WHERE id = NEW.user_id;

            -- Suspend store
            UPDATE public.stores 
            SET status = 'suspended' 
            WHERE merchant_id = NEW.user_id;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_sync_merchant_approval ON public.merchant_requests;

-- Create the trigger
CREATE TRIGGER trg_sync_merchant_approval
AFTER UPDATE OF status ON public.merchant_requests
FOR EACH ROW
EXECUTE FUNCTION public.sync_merchant_approval();
