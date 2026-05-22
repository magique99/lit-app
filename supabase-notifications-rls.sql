-- Politici RLS pentru tabela notifications

-- Permite utilizatorilor să vadă doar propriile notificări
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Permite inserarea notificărilor (oricine poate crea notificări)
CREATE POLICY "Users can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Permite actualizarea notificărilor proprii (ex: marcare ca citit)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Permite ștergerea notificărilor proprii
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);