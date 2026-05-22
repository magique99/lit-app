-- =====================================================
-- Supabase setup — functions, follows table, policies, triggers
-- Run each numbered block ONE AT A TIME in the SQL editor
-- =====================================================


-- ─── 1: Profiles extra columns ────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name       TEXT,
  ADD COLUMN IF NOT EXISTS last_name        TEXT,
  ADD COLUMN IF NOT EXISTS nickname         TEXT,
  ADD COLUMN IF NOT EXISTS gender           TEXT,
  ADD COLUMN IF NOT EXISTS age              INTEGER,
  ADD COLUMN IF NOT EXISTS city             TEXT,
  ADD COLUMN IF NOT EXISTS country          TEXT,
  ADD COLUMN IF NOT EXISTS phone            TEXT,
  ADD COLUMN IF NOT EXISTS vehicle          TEXT,
  ADD COLUMN IF NOT EXISTS awards           TEXT,
  ADD COLUMN IF NOT EXISTS role             TEXT,
  ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS posts_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count   INTEGER NOT NULL DEFAULT 0;


-- ─── 2: Follows table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  follower_id  UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id  ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);


-- ─── 3: Functions ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_followers_fn(p_user_id UUID)
RETURNS VOID AS
$func_name$
BEGIN
  UPDATE profiles SET followers_count = followers_count + 1
  WHERE user_id = p_user_id;
END;
$func_name$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_followers_fn(p_user_id UUID)
RETURNS VOID AS
$func_name$
BEGIN
  UPDATE profiles SET followers_count = GREATEST(followers_count - 1, 0)
  WHERE user_id = p_user_id;
END;
$func_name$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_following_fn(p_user_id UUID)
RETURNS VOID AS
$func_name$
BEGIN
  UPDATE profiles SET following_count = following_count + 1
  WHERE user_id = p_user_id;
END;
$func_name$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_following_fn(p_user_id UUID)
RETURNS VOID AS
$func_name$
BEGIN
  UPDATE profiles SET following_count = GREATEST(following_count - 1, 0)
  WHERE user_id = p_user_id;
END;
$func_name$ LANGUAGE plpgsql;


-- ─── 4: RLS on follows ─────────────────────────────────────────────────────
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_follows_policy ON follows FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY insert_own_follows_policy ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY delete_own_follows_policy ON follows FOR DELETE
  USING (auth.uid() = follower_id);


-- ─── 5: Triggers ───────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS t_follows_insert           ON follows;
DROP TRIGGER IF EXISTS t_follows_delete           ON follows;
DROP TRIGGER IF EXISTS t_follows_insert_following ON follows;
DROP TRIGGER IF EXISTS t_follows_delete_following ON follows;

CREATE TRIGGER t_follows_insert
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION increment_followers_fn(NEW.following_id);

CREATE TRIGGER t_follows_delete
AFTER DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION decrement_followers_fn(OLD.following_id);

CREATE TRIGGER t_follows_insert_following
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION increment_following_fn(NEW.follower_id);

CREATE TRIGGER t_follows_delete_following
AFTER DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION decrement_following_fn(OLD.follower_id);
