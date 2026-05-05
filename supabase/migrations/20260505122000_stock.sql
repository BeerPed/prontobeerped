-- Enum tipo de movimentação
CREATE TYPE public.stock_movement_type AS ENUM ('entrada', 'saida');

-- Tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tipo        public.stock_movement_type NOT NULL,
  quantidade  integer NOT NULL CHECK (quantidade > 0),
  observacao  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stock_movements"
  ON public.stock_movements FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert stock_movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete stock_movements"
  ON public.stock_movements FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_stock_product ON public.stock_movements(product_id);

-- View: saldo atual por produto
CREATE OR REPLACE VIEW public.stock_current AS
SELECT
  p.id            AS product_id,
  p.nome          AS nome,
  p.codigo        AS codigo,
  p.categoria     AS categoria,
  COALESCE(SUM(
    CASE WHEN sm.tipo = 'entrada' THEN sm.quantidade
         WHEN sm.tipo = 'saida'   THEN -sm.quantidade
         ELSE 0 END
  ), 0)::integer  AS saldo_atual
FROM public.products p
LEFT JOIN public.stock_movements sm ON sm.product_id = p.id
GROUP BY p.id, p.nome, p.codigo, p.categoria;
