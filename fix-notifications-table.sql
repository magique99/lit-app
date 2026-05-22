-- Adaugă coloanele lipsă în tabela notifications

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users,
ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts,
ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.comments,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;