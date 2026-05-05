-- 1. Adicionar taxa_fixa na tabela deliveries
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS taxa_fixa numeric NOT NULL DEFAULT 0;

-- 2. Tabela de relacionamento produto <-> delivery (ativo individualmente)
CREATE TABLE IF NOT EXISTS public.product_deliveries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delivery_id   uuid NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  ativo         boolean NOT NULL DEFAULT true,
  margem        numeric,           -- override de margem para esta combinação (null = usa margem_padrao)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, delivery_id)
);

ALTER TABLE public.product_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product_deliveries"
  ON public.product_deliveries FOR SELECT USING (true);

CREATE POLICY "Admins can insert product_deliveries"
  ON public.product_deliveries FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product_deliveries"
  ON public.product_deliveries FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product_deliveries"
  ON public.product_deliveries FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_product_deliveries_updated_at
  BEFORE UPDATE ON public.product_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_product_deliveries_product ON public.product_deliveries(product_id);
CREATE INDEX IF NOT EXISTS idx_product_deliveries_delivery ON public.product_deliveries(delivery_id);

-- 3. Adicionar campo image_url em products caso não exista
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url text;
