
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  photo_url TEXT,
  url TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  price BIGINT NOT NULL DEFAULT 0,
  bedrooms INT NOT NULL DEFAULT 0,
  bathrooms NUMERIC(4,1) NOT NULL DEFAULT 0,
  square_feet INT NOT NULL DEFAULT 0,
  lot_size NUMERIC(10,2),
  property_type TEXT NOT NULL DEFAULT 'Single Family',
  year_built INT,
  listing_status TEXT NOT NULL DEFAULT 'Active',
  client_status TEXT NOT NULL DEFAULT 'Interested',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_properties_client_id ON public.properties(client_id);
CREATE INDEX idx_properties_agent_id ON public.properties(agent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Agent owns properties for their clients
CREATE POLICY "Agents can view own client properties" ON public.properties
  FOR SELECT TO authenticated USING (auth.uid() = agent_id);
CREATE POLICY "Agents can insert own client properties" ON public.properties
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = agent_id AND public.has_role(auth.uid(), 'agent'));
CREATE POLICY "Agents can update own client properties" ON public.properties
  FOR UPDATE TO authenticated USING (auth.uid() = agent_id);
CREATE POLICY "Agents can delete own client properties" ON public.properties
  FOR DELETE TO authenticated USING (auth.uid() = agent_id);

-- Clients can view/manage their own properties
CREATE POLICY "Clients can view own properties" ON public.properties
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = properties.client_id AND c.client_user_id = auth.uid())
  );
CREATE POLICY "Clients can insert own properties" ON public.properties
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = properties.client_id AND c.client_user_id = auth.uid())
  );
CREATE POLICY "Clients can update own properties" ON public.properties
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = properties.client_id AND c.client_user_id = auth.uid())
  );
CREATE POLICY "Clients can delete own properties" ON public.properties
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = properties.client_id AND c.client_user_id = auth.uid())
  );

CREATE TRIGGER tg_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
