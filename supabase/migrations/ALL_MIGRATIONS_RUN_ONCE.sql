-- ================================================================
-- SETUP COMPLETO BeerPed's Project — Rodar no SQL Editor Supabase
-- https://supabase.com/dashboard/project/ournfmcmffrtmjgpcbgh/sql/new
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TIPOS ENUM
-- ----------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.lead_status AS ENUM ('novo', 'contatado', 'brinde_enviado', 'cliente_fiel', 'inativo');
CREATE TYPE public.order_status AS ENUM ('pendente','confirmado','preparando','pronto','saiu_entrega','entregue','cancelado');
CREATE TYPE public.stock_movement_type AS ENUM ('entrada', 'saida');

-- ----------------------------------------------------------------
-- 2. FUNCAO AUXILIAR updated_at
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ----------------------------------------------------------------
-- 3. TABELA user_roles (controle de admin)
-- ----------------------------------------------------------------
CREATE TABLE public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role       app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Admins can view roles"    ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles"  ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update roles"  ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles"  ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users view own role"      ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 4. TABELA products
-- ----------------------------------------------------------------
CREATE TABLE public.products (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL DEFAULT '',
  codigo     TEXT,
  custo      NUMERIC DEFAULT 0,
  categoria  TEXT NOT NULL DEFAULT 'snacks',
  gelavel    BOOLEAN NOT NULL DEFAULT false,
  ativo      BOOLEAN NOT NULL DEFAULT true,
  preco      DECIMAL(10,2),
  image_url  TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"  ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_products_categoria ON public.products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_codigo    ON public.products(codigo);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------
-- 5. TABELA deliveries
-- ----------------------------------------------------------------
CREATE TABLE public.deliveries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL UNIQUE,
  comissao   NUMERIC NOT NULL DEFAULT 0,
  taxa_fixa  NUMERIC NOT NULL DEFAULT 0,
  cor        TEXT DEFAULT '#9333ea',
  ativo      BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view deliveries"   ON public.deliveries FOR SELECT USING (true);
CREATE POLICY "Admins can insert deliveries" ON public.deliveries FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update deliveries" ON public.deliveries FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete deliveries" ON public.deliveries FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed dos 4 principais deliveries
INSERT INTO public.deliveries (nome, comissao, taxa_fixa, cor) VALUES
  ('iFood',       27, 0, '#EA1D2C'),
  ('Keeta',       18, 0, '#FFCC00'),
  ('Zé Delivery', 20, 0, '#FFD700'),
  ('99Food',      22, 0, '#F0BB00')
ON CONFLICT (nome) DO NOTHING;

-- ----------------------------------------------------------------
-- 6. TABELA site_settings (singleton)
-- ----------------------------------------------------------------
CREATE TABLE public.site_settings (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url      TEXT,
  login_bg_url  TEXT,
  margem_padrao NUMERIC NOT NULL DEFAULT 30,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"  ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (logo_url, login_bg_url) VALUES (NULL, NULL);

-- ----------------------------------------------------------------
-- 7. TABELA leads (CRM)
-- ----------------------------------------------------------------
CREATE TABLE public.leads (
  id                   UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome                 TEXT NOT NULL,
  telefone             TEXT NOT NULL,
  endereco             TEXT,
  loja                 TEXT,
  status               public.lead_status NOT NULL DEFAULT 'novo',
  notas                TEXT,
  ultimo_pedido_at     TIMESTAMPTZ,
  ultimo_pedido_total  NUMERIC,
  ultimo_pedido_itens  JSONB,
  total_pedidos        INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX leads_telefone_unique ON public.leads (telefone);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view leads"   ON public.leads FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update leads" ON public.leads FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPCs para leads (checkout público)
CREATE OR REPLACE FUNCTION public.upsert_lead_by_phone(_nome text, _telefone text, _endereco text DEFAULT NULL, _loja text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF _nome IS NULL OR length(trim(_nome)) = 0 THEN RAISE EXCEPTION 'nome required'; END IF;
  IF _telefone IS NULL OR length(trim(_telefone)) = 0 THEN RAISE EXCEPTION 'telefone required'; END IF;
  SELECT id INTO _id FROM public.leads WHERE telefone = _telefone LIMIT 1;
  IF _id IS NOT NULL THEN
    UPDATE public.leads SET nome = _nome, endereco = COALESCE(_endereco, endereco), loja = COALESCE(_loja, loja), updated_at = now() WHERE id = _id;
  ELSE
    INSERT INTO public.leads (nome, telefone, endereco, loja) VALUES (_nome, _telefone, _endereco, _loja) RETURNING id INTO _id;
  END IF;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.record_order_for_lead(_telefone text, _total numeric, _itens jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.leads SET ultimo_pedido_at = now(), ultimo_pedido_total = _total, ultimo_pedido_itens = _itens, total_pedidos = COALESCE(total_pedidos, 0) + 1, updated_at = now() WHERE telefone = _telefone;
END; $$;

GRANT EXECUTE ON FUNCTION public.upsert_lead_by_phone(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_order_for_lead(text, numeric, jsonb) TO anon, authenticated;

-- ----------------------------------------------------------------
-- 8. TABELA product_deliveries (produto ativo por delivery)
-- ----------------------------------------------------------------
CREATE TABLE public.product_deliveries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  margem      NUMERIC,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, delivery_id)
);

ALTER TABLE public.product_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pd"  ON public.product_deliveries FOR SELECT USING (true);
CREATE POLICY "Admins can insert pd" ON public.product_deliveries FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update pd" ON public.product_deliveries FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete pd" ON public.product_deliveries FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_pd_updated_at
  BEFORE UPDATE ON public.product_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_pd_product  ON public.product_deliveries(product_id);
CREATE INDEX IF NOT EXISTS idx_pd_delivery ON public.product_deliveries(delivery_id);

-- ----------------------------------------------------------------
-- 9. TABELA orders (pedidos)
-- ----------------------------------------------------------------
CREATE TABLE public.orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id      TEXT,
  cliente_nome     TEXT NOT NULL DEFAULT '',
  cliente_telefone TEXT,
  delivery_id      UUID REFERENCES public.deliveries(id) ON DELETE SET NULL,
  status           public.order_status NOT NULL DEFAULT 'pendente',
  valor_total      NUMERIC NOT NULL DEFAULT 0,
  lucro_estimado   NUMERIC,
  itens            JSONB NOT NULL DEFAULT '[]',
  observacao       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view orders"   ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert orders" ON public.orders FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_orders_delivery   ON public.orders(delivery_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ----------------------------------------------------------------
-- 10. TABELA stock_movements + VIEW stock_current
-- ----------------------------------------------------------------
CREATE TABLE public.stock_movements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tipo       public.stock_movement_type NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stock"   ON public.stock_movements FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert stock" ON public.stock_movements FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete stock" ON public.stock_movements FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_stock_product ON public.stock_movements(product_id);

CREATE OR REPLACE VIEW public.stock_current AS
SELECT
  p.id AS product_id, p.nome, p.codigo, p.categoria,
  COALESCE(SUM(
    CASE WHEN sm.tipo = 'entrada' THEN sm.quantidade
         WHEN sm.tipo = 'saida'   THEN -sm.quantidade ELSE 0 END
  ), 0)::integer AS saldo_atual
FROM public.products p
LEFT JOIN public.stock_movements sm ON sm.product_id = p.id
GROUP BY p.id, p.nome, p.codigo, p.categoria;

-- ----------------------------------------------------------------
-- 11. STORAGE buckets
-- ----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public can view site assets"    ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "Admins can upload site assets"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update site assets"  ON storage.objects FOR UPDATE USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete site assets"  ON storage.objects FOR DELETE USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view product images"   ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

-- ================================================================
-- FIM — Confirmar resultado
-- ================================================================
SELECT
  table_name,
  'OK' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('products','deliveries','leads','site_settings','user_roles','product_deliveries','orders','stock_movements')
ORDER BY table_name;
