-- 1line.az security cleanup
-- Works in the Supabase SQL editor and in plain Postgres 13+.
-- Run this AFTER the new backend is deployed. The old code still reads
-- shops.temporary_password and would crash if the column disappeared first.
-- Safe to run twice.

BEGIN;

-- Passwords must not be stored in plain text. Merchant logins keep working:
-- they use the hash in users.hashed_password.
ALTER TABLE shops DROP COLUMN IF EXISTS temporary_password;

-- Lets merchants delete a product that has past orders. The order keeps its
-- product_name and price snapshot.
ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;

-- Setup tokens were readable through the open admin API, so replace them.
-- Links already sent stop working: send merchants the new one from Kitchen.
UPDATE shops
SET setup_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
WHERE setup_token IS NOT NULL;

COMMIT;


-- Supabase only: without this, tables in the public schema can be reachable
-- through Supabase's auto-generated API with the public anon key.
-- The backend connects as the table owner, so it is not affected.
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    END LOOP;
END $$;
