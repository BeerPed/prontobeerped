-- Enum de status de pedido
CREATE TYPE public.order_status AS ENUM (
  'pendente',
  'confirmado',
  'preparando',
  'pronto',
  'saiu_entrega',
  'entregue',
  'cancelado'
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id       text,                          -- ID do pedido no app de delivery
  cliente_nome      text NOT NULL DEFAULT '',
  cliente_telefone  text,
  delivery_id       uuid REFERENCES public.deliveries(id) ON DELETE SET NULL,
  status            public.order_status NOT NULL DEFAULT 'pendente',
  valor_total       numeric NOT NULL DEFAULT 0,
  lucro_estimado    numeric,
  itens             jsonb NOT NULL DEFAULT '[]',   -- snapshot dos itens do pedido
  observacao        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Webhooks externos (iFood, etc.) podem inserir via service role key no backend
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_orders_delivery ON public.orders(delivery_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON public.orders(external_id);
