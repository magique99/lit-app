-- =====================================================
-- Supabase setup — functions, follows table, policies, triggers
-- Run each numbered block ONE AT A TIME in the SQL editor
-- =====================================================


-- ─── 0: Create profiles table (if it doesn't exist) ─────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  nickname TEXT,
  gender TEXT,
  age INTEGER,
  city TEXT,
  country TEXT,
  phone TEXT,
  vehicle TEXT,
  awards TEXT,
  role TEXT,
  bio TEXT,
  avatar_url TEXT,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  posts_count INTEGER NOT NULL DEFAULT 0,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0
);


-- ─── 1: Profiles extra columns ────────────────────────────────────────────
-- (Columns will be skipped if table was just created)
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
  ADD COLUMN IF NOT EXISTS preferences      JSONB,
  ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS posts_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followers_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count   INTEGER NOT NULL DEFAULT 0;


-- ─── 2: RLS on profiles ───────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;
DROP POLICY IF EXISTS profiles_upsert_policy ON profiles;

CREATE POLICY profiles_select_policy ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY profiles_insert_policy ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY profiles_update_policy ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow upsert (insert or update) for user's own profile
CREATE POLICY profiles_upsert_policy ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);


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


-- ─── 2.5: Posts table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
   title       TEXT NOT NULL,
   content     TEXT NOT NULL,
   text_type   TEXT,
   genre       TEXT,
   uses_ai     BOOLEAN DEFAULT FALSE,
   doc_url     TEXT,
   docx_url    TEXT,
   docx_path   TEXT,
   file_hash   TEXT,
   version     INTEGER DEFAULT 1,
   created_at  TIMESTAMPTZ DEFAULT NOW(),
   updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- Add missing columns if they don't exist (for existing tables)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS docx_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS docx_path TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;


-- ─── 2.5.1: RLS on posts ───────────────────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_select_policy ON posts;
DROP POLICY IF EXISTS posts_insert_policy ON posts;
DROP POLICY IF EXISTS posts_update_policy ON posts;
DROP POLICY IF EXISTS posts_delete_policy ON posts;

CREATE POLICY posts_select_policy ON posts FOR SELECT
  USING (true);

CREATE POLICY posts_insert_policy ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY posts_update_policy ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY posts_delete_policy ON posts FOR DELETE
  USING (auth.uid() = user_id);


-- ─── 2.6: Comments table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
   user_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
   content     TEXT NOT NULL,
   created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);


-- ─── 2.7: Likes table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
   id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
   user_id   UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
   created_at TIMESTAMPTZ DEFAULT NOW(),
   UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- ─── 2.7.1: RLS on likes ─────────────────────────────────────────────────────
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS likes_select_policy ON likes;
DROP POLICY IF EXISTS likes_insert_policy ON likes;
DROP POLICY IF EXISTS likes_delete_policy ON likes;

CREATE POLICY likes_select_policy ON likes FOR SELECT
  USING (true);

CREATE POLICY likes_insert_policy ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY likes_delete_policy ON likes FOR DELETE
  USING (auth.uid() = user_id);


-- ─── 2.6.1: RLS on comments ─────────────────────────────────────────────────
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_select_policy ON comments;
DROP POLICY IF EXISTS comments_insert_policy ON comments;
DROP POLICY IF EXISTS comments_delete_policy ON comments;

CREATE POLICY comments_select_policy ON comments FOR SELECT
  USING (true);

CREATE POLICY comments_insert_policy ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY comments_delete_policy ON comments FOR DELETE
  USING (auth.uid() = user_id);


-- ─── 2.8: Annotations table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS annotations (
   id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
   user_id   UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
   content   TEXT NOT NULL,
   created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_annotations_post_id ON annotations(post_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON annotations(user_id);

-- ─── 2.8.1: RLS on annotations ─────────────────────────────────────────────
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS annotations_select_policy ON annotations;
DROP POLICY IF EXISTS annotations_insert_policy ON annotations;
DROP POLICY IF EXISTS annotations_delete_policy ON annotations;

CREATE POLICY annotations_select_policy ON annotations FOR SELECT
  USING (true);

CREATE POLICY annotations_insert_policy ON annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY annotations_delete_policy ON annotations FOR DELETE
  USING (auth.uid() = user_id);


-- ─── 2.9: Followers table (legacy - kept for compatibility) ───────────────
CREATE TABLE IF NOT EXISTS followers (
   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
   follower_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
   created_at  TIMESTAMPTZ DEFAULT NOW(),
   UNIQUE(user_id, follower_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_user_id ON followers(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);


-- ─── 2.10: Notifications table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
   actor_id    UUID REFERENCES auth.users,
   post_id     UUID REFERENCES public.posts,
   comment_id  UUID REFERENCES public.comments,
   message     TEXT,
   read        BOOLEAN DEFAULT false,
   created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_post_id ON notifications(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_comment_id ON notifications(comment_id);


-- ─── 3: Functions ─────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS increment_followers_fn;
DROP FUNCTION IF EXISTS decrement_followers_fn;
DROP FUNCTION IF EXISTS increment_following_fn;
DROP FUNCTION IF EXISTS decrement_following_fn;

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

DROP POLICY IF EXISTS read_follows_policy ON follows;
DROP POLICY IF EXISTS insert_own_follows_policy ON follows;
DROP POLICY IF EXISTS delete_own_follows_policy ON follows;

CREATE POLICY read_follows_policy ON follows FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY insert_own_follows_policy ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY delete_own_follows_policy ON follows FOR DELETE
  USING (auth.uid() = follower_id);


-- ─── 5: Triggers ───────────────────────────────────────────────────────────
-- Note: Create triggers only AFTER functions exist and table has data
-- Disable triggers for now if you need to insert test data
DROP TRIGGER IF EXISTS t_follows_insert ON follows;
DROP TRIGGER IF EXISTS t_follows_delete ON follows;
DROP TRIGGER IF EXISTS t_follows_insert_following ON follows;
DROP TRIGGER IF EXISTS t_follows_delete_following ON follows;

-- CREATE TRIGGER t_follows_insert
-- AFTER INSERT ON follows
-- FOR EACH ROW
-- EXECUTE FUNCTION increment_followers_fn(NEW.following_id);

-- CREATE TRIGGER t_follows_delete
-- AFTER DELETE ON follows
-- FOR EACH ROW
-- EXECUTE FUNCTION decrement_followers_fn(OLD.following_id);

-- CREATE TRIGGER t_follows_insert_following
-- AFTER INSERT ON follows
-- FOR EACH ROW
-- EXECUTE FUNCTION increment_following_fn(NEW.follower_id);

-- CREATE TRIGGER t_follows_delete_following
-- AFTER DELETE ON follows
-- FOR EACH ROW
-- EXECUTE FUNCTION decrement_following_fn(OLD.follower_id);