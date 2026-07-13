
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_number text;

CREATE POLICY "Clients can view their agent profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.client_user_id = auth.uid()
      AND c.agent_id = profiles.id
  )
);
