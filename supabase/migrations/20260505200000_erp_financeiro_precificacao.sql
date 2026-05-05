-- ================================================================
-- MIGRAÇÃO ERP BeerPed — Fase 2
-- Executar no SQL Editor após o setup inicial
-- https://supabase.com/dashboard/project/ournfmcmffrtmjgpcbgh/sql/new
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TABELA financeiro (fonte de verdade de custos)
--    Importada via planilha — NUNCA editar manualmente na UI
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financeiro (
  codigo_barras    text PRIMARY KEY,
  descricao        text NOT NULL DEFAULT '',
  custo            numeric NOT NULL DEFAULT 0,
  data_atualizacao timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view financeiro"
  ON public.financeiro FOR SELECT USING (true);
CREATE POLICY "Admins can insert financeiro"
  ON public.financeiro FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update financeiro"
  ON public.financeiro FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete financeiro"
  ON public.financeiro FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Adicionar codigo_barras em products como referência ao financeiro
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS codigo_barras_fk text REFERENCES public.financeiro(codigo_barras) ON DELETE SET NULL;

-- Sincronizar custo do products com financeiro via coluna cache
-- (custo já existe em products — manter como cache sincronizado)

-- ----------------------------------------------------------------
-- 2. TABELA precificacao (preços computados e armazenados)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.precificacao (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delivery_id   uuid NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  custo         numeric NOT NULL DEFAULT 0,
  taxa_fixa     numeric NOT NULL DEFAULT 0,
  margem        numeric NOT NULL DEFAULT 0.30,
  comissao      numeric NOT NULL DEFAULT 0,
  preco         numeric NOT NULL DEFAULT 0,
  lucro         numeric NOT NULL DEFAULT 0,
  data_calculo  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (produto_id, delivery_id)
);

ALTER TABLE public.precificacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view precificacao"
  ON public.precificacao FOR SELECT USING (true);
CREATE POLICY "Admins can manage precificacao"
  ON public.precificacao FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_prec_produto  ON public.precificacao(produto_id);
CREATE INDEX IF NOT EXISTS idx_prec_delivery ON public.precificacao(delivery_id);

-- ----------------------------------------------------------------
-- 3. TABELA itens_pedido (normalização dos itens)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.itens_pedido (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  produto_id      uuid REFERENCES public.products(id) ON DELETE SET NULL,
  nome_produto    text NOT NULL DEFAULT '',
  quantidade      integer NOT NULL DEFAULT 1,
  preco_unitario  numeric NOT NULL DEFAULT 0,
  custo_unitario  numeric NOT NULL DEFAULT 0,
  lucro_item      numeric GENERATED ALWAYS AS ((preco_unitario - custo_unitario) * quantidade) STORED,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view itens"   ON public.itens_pedido FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert itens" ON public.itens_pedido FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update itens" ON public.itens_pedido FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete itens" ON public.itens_pedido FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_itens_pedido ON public.itens_pedido(pedido_id);

-- ----------------------------------------------------------------
-- 4. FUNÇÃO de recálculo de precificacao
--    Formula: preco = (custo + taxa_fixa) / (1 - comissao - margem)
--    lucro = preco - custo - taxa_fixa
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalcular_precificacao(
  p_produto_id  uuid DEFAULT NULL,
  p_delivery_id uuid DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _margem_padrao numeric;
BEGIN
  -- Pegar margem padrão
  SELECT COALESCE(margem_padrao, 30) / 100.0 INTO _margem_padrao
  FROM public.site_settings LIMIT 1;

  -- Recalcular para combinações filtradas (ou tudo se NULL)
  INSERT INTO public.precificacao (
    produto_id, delivery_id, custo, taxa_fixa, margem, comissao, preco, lucro, data_calculo
  )
  SELECT
    pd.product_id,
    pd.delivery_id,
    COALESCE(p.custo, 0)                        AS custo,
    COALESCE(d.taxa_fixa, 0)                    AS taxa_fixa,
    COALESCE(pd.margem / 100.0, _margem_padrao) AS margem,
    COALESCE(d.comissao, 0) / 100.0             AS comissao,
    -- Fórmula: preco = (custo + taxa_fixa) / (1 - comissao - margem)
    CASE
      WHEN (1.0 - COALESCE(d.comissao,0)/100.0 - COALESCE(pd.margem/100.0, _margem_padrao)) <= 0
      THEN 0
      ELSE ROUND(
        (COALESCE(p.custo,0) + COALESCE(d.taxa_fixa,0)) /
        (1.0 - COALESCE(d.comissao,0)/100.0 - COALESCE(pd.margem/100.0, _margem_padrao)),
        2
      )
    END                                         AS preco,
    -- lucro = preco - custo - taxa_fixa
    CASE
      WHEN (1.0 - COALESCE(d.comissao,0)/100.0 - COALESCE(pd.margem/100.0, _margem_padrao)) <= 0
      THEN -(COALESCE(p.custo,0) + COALESCE(d.taxa_fixa,0))
      ELSE ROUND(
        (COALESCE(p.custo,0) + COALESCE(d.taxa_fixa,0)) /
        (1.0 - COALESCE(d.comissao,0)/100.0 - COALESCE(pd.margem/100.0, _margem_padrao))
        - COALESCE(p.custo,0) - COALESCE(d.taxa_fixa,0),
        2
      )
    END                                         AS lucro,
    now()
  FROM public.product_deliveries pd
  JOIN public.products p   ON p.id   = pd.product_id
  JOIN public.deliveries d ON d.id   = pd.delivery_id
  WHERE pd.ativo = true
    AND p.ativo  = true
    AND (p_produto_id  IS NULL OR pd.product_id  = p_produto_id)
    AND (p_delivery_id IS NULL OR pd.delivery_id = p_delivery_id)
  ON CONFLICT (produto_id, delivery_id) DO UPDATE SET
    custo        = EXCLUDED.custo,
    taxa_fixa    = EXCLUDED.taxa_fixa,
    margem       = EXCLUDED.margem,
    comissao     = EXCLUDED.comissao,
    preco        = EXCLUDED.preco,
    lucro        = EXCLUDED.lucro,
    data_calculo = EXCLUDED.data_calculo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalcular_precificacao(uuid, uuid) TO authenticated;

-- ----------------------------------------------------------------
-- 5. TRIGGER: recalcular quando custo do produto muda
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_recalc_on_product_cost()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.custo IS DISTINCT FROM NEW.custo THEN
    PERFORM public.recalcular_precificacao(NEW.id, NULL);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalc_on_product_cost ON public.products;
CREATE TRIGGER recalc_on_product_cost
  AFTER UPDATE OF custo ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalc_on_product_cost();

-- ----------------------------------------------------------------
-- 6. TRIGGER: recalcular quando comissão/taxa_fixa do delivery muda
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_recalc_on_delivery_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.comissao IS DISTINCT FROM NEW.comissao
     OR OLD.taxa_fixa IS DISTINCT FROM NEW.taxa_fixa THEN
    PERFORM public.recalcular_precificacao(NULL, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalc_on_delivery_change ON public.deliveries;
CREATE TRIGGER recalc_on_delivery_change
  AFTER UPDATE OF comissao, taxa_fixa ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalc_on_delivery_change();

-- ----------------------------------------------------------------
-- 7. TRIGGER: recalcular quando margem do product_delivery muda
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_recalc_on_pd_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.margem IS DISTINCT FROM NEW.margem
     OR OLD.ativo IS DISTINCT FROM NEW.ativo THEN
    PERFORM public.recalcular_precificacao(NEW.product_id, NEW.delivery_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalc_on_pd_change ON public.product_deliveries;
CREATE TRIGGER recalc_on_pd_change
  AFTER UPDATE OF margem, ativo ON public.product_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalc_on_pd_change();

-- ----------------------------------------------------------------
-- 8. TRIGGER: recalcular quando produto ativado em delivery
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_recalc_on_pd_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recalcular_precificacao(NEW.product_id, NEW.delivery_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalc_on_pd_insert ON public.product_deliveries;
CREATE TRIGGER recalc_on_pd_insert
  AFTER INSERT ON public.product_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalc_on_pd_insert();

-- ----------------------------------------------------------------
-- 9. RPC pública: recalcular tudo (chamada pelo botão na UI)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalcular_tudo()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count int;
BEGIN
  PERFORM public.recalcular_precificacao(NULL, NULL);
  SELECT COUNT(*) INTO _count FROM public.precificacao;
  RETURN json_build_object('success', true, 'registros', _count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalcular_tudo() TO authenticated;

-- ================================================================
-- VERIFICAR RESULTADO
-- ================================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('financeiro', 'precificacao', 'itens_pedido')
ORDER BY table_name;
