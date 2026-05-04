
-- Limpar produtos antigos do AR Cell
DELETE FROM public.products;

-- Reformular tabela products
ALTER TABLE public.products
  DROP COLUMN IF EXISTS modelo,
  DROP COLUMN IF EXISTS marca,
  DROP COLUMN IF EXISTS tipo;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS nome text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS codigo text,
  ADD COLUMN IF NOT EXISTS custo numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'snacks',
  ADD COLUMN IF NOT EXISTS gelavel boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- Renomear preco -> manter compat (preco final calculado em runtime)
-- preco fica como override opcional

CREATE INDEX IF NOT EXISTS idx_products_categoria ON public.products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_codigo ON public.products(codigo);

-- Tabela deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  comissao numeric NOT NULL DEFAULT 0,
  cor text DEFAULT '#9333ea',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view deliveries" ON public.deliveries
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert deliveries" ON public.deliveries
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update deliveries" ON public.deliveries
  FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete deliveries" ON public.deliveries
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Margem global em site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS margem_padrao numeric NOT NULL DEFAULT 30;

-- Seed deliveries
INSERT INTO public.deliveries (nome, comissao, cor) VALUES
  ('iFood', 27, '#EA1D2C'),
  ('Keeta', 18, '#FFCC00'),
  ('Zé Delivery', 20, '#FFD700'),
  ('99Food', 22, '#F0BB00')
ON CONFLICT (nome) DO NOTHING;
