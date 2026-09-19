-- Root cause of "Database error saving new user" on every signup:
-- trigger on_auth_user_created called handle_new_user(), which only
-- inserted (supabase_uid, email, role) into public.users — but name,
-- password_hash, wilaya, commune are NOT NULL with no default there, so
-- every insert violated a NOT NULL constraint.
-- Fix: repoint the trigger to the already-existing, complete
-- handle_new_auth_user() function (safe defaults for all required
-- columns, infers ADMIN/MERCHANT/CUSTOMER role). Verified by inserting a
-- real test row into auth.users and confirming public.users populated
-- correctly, then cleaning up the test row.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
