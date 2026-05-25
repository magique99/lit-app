-- =====================================================
-- COMPLETE DATABASE RESET FOR SUPABASE
-- RUN THIS TO WIPE ALL DATA AND START FRESH
-- =====================================================

-- 1. Drop RLS policies first (in reverse order of dependencies)
DROP POLICY IF EXISTS read_follows_policy ON follows;
DROP POLICY IF EXISTS insert_own_follows_policy ON follows;
DROP POLICY IF EXISTS delete_own_follows_policy ON follows;
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- 2. Drop triggers
DROP TRIGGER IF EXISTS t_follows_insert ON follows;
DROP TRIGGER IF EXISTS t_follows_delete ON follows;
DROP TRIGGER IF EXISTS t_follows_insert_following ON follows;
DROP TRIGGER IF EXISTS t_follows_delete_following ON follows;

-- 3. Drop functions
DROP FUNCTION IF EXISTS increment_followers_fn(UUID);
DROP FUNCTION IF EXISTS decrement_followers_fn(UUID);
DROP FUNCTION IF EXISTS increment_following_fn(UUID);
DROP FUNCTION IF EXISTS decrement_following_fn(UUID);

-- 4. Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS annotations CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS followers CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 5. Reset auth schema sequences (optional - for clean IDs)
-- Note: auth.users is managed by Supabase, don't drop it

-- 6. Verify clean state (should return 0 tables)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- =====================================================
-- AFTER RESET, RUN migration.sql TO RECREATE SCHEMA
-- =====================================================