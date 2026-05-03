
-- Site settings (singleton row for logo and login background)
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  login_bg_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (logo_url, login_bg_url) VALUES (NULL, NULL);

-- Leads / CRM
CREATE TYPE public.lead_status AS ENUM ('novo', 'contatado', 'brinde_enviado', 'cliente_fiel', 'inativo');

CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  endereco TEXT,
  loja TEXT,
  status public.lead_status NOT NULL DEFAULT 'novo',
  notas TEXT,
  ultimo_pedido_at TIMESTAMPTZ,
  ultimo_pedido_total NUMERIC,
  ultimo_pedido_itens JSONB,
  total_pedidos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX leads_telefone_unique ON public.leads (telefone);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public can insert/upsert leads (registration before checkout)
CREATE POLICY "Anyone can insert leads"
  ON public.leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update leads by phone"
  ON public.leads FOR UPDATE USING (true);

CREATE POLICY "Admins can view leads"
  ON public.leads FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Site assets bucket (logo + login background)
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);

CREATE POLICY "Public can view site assets"
  ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site assets"
  ON storage.objects FOR UPDATE USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site assets"
  ON storage.objects FOR DELETE USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'));
