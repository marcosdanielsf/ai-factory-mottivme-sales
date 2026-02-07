-- Drop problematic trigger that blocks user creation
-- The trigger tries to insert into 'tenants' table with wrong columns

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Optionally also drop the function if no longer needed
-- DROP FUNCTION IF EXISTS public.handle_new_user();
