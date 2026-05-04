-- 1. Fix leads UPDATE policy: remove broad public update, restrict to admins
DROP POLICY IF EXISTS "Anyone can update leads by phone" ON public.leads;

CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Public RPC to upsert lead by phone (used in checkout registration).
-- Only allows updating safe contact fields, never status/notes/order data.
CREATE OR REPLACE FUNCTION public.upsert_lead_by_phone(
  _nome text,
  _telefone text,
  _endereco text DEFAULT NULL,
  _loja text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF _nome IS NULL OR length(trim(_nome)) = 0 THEN
    RAISE EXCEPTION 'nome required';
  END IF;
  IF _telefone IS NULL OR length(trim(_telefone)) = 0 THEN
    RAISE EXCEPTION 'telefone required';
  END IF;

  SELECT id INTO _id FROM public.leads WHERE telefone = _telefone LIMIT 1;

  IF _id IS NOT NULL THEN
    UPDATE public.leads
       SET nome = _nome,
           endereco = COALESCE(_endereco, endereco),
           loja = COALESCE(_loja, loja),
           updated_at = now()
     WHERE id = _id;
  ELSE
    INSERT INTO public.leads (nome, telefone, endereco, loja)
    VALUES (_nome, _telefone, _endereco, _loja)
    RETURNING id INTO _id;
  END IF;

  RETURN _id;
END;
$$;

-- 3. Public RPC to record an order against an existing lead.
-- Only touches order-related counters, nothing else.
CREATE OR REPLACE FUNCTION public.record_order_for_lead(
  _telefone text,
  _total numeric,
  _itens jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
     SET ultimo_pedido_at = now(),
         ultimo_pedido_total = _total,
         ultimo_pedido_itens = _itens,
         total_pedidos = COALESCE(total_pedidos, 0) + 1,
         updated_at = now()
   WHERE telefone = _telefone;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_lead_by_phone(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_order_for_lead(text, numeric, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_lead_by_phone(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_order_for_lead(text, numeric, jsonb) TO anon, authenticated;

-- 4. Tighten user_roles policies: explicit per-command with WITH CHECK
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Allow users to view their own role row (read-only)
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);