import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PrecificacaoRow {
  id: string;
  produto_id: string;
  delivery_id: string;
  custo: number;
  taxa_fixa: number;
  margem: number;
  comissao: number;
  preco: number;
  lucro: number;
  data_calculo: string;
  // joins
  produto_nome?: string;
  delivery_nome?: string;
  delivery_cor?: string;
}

/** Fórmula oficial: preco = (custo + taxa_fixa) / (1 - comissao - margem)
 *  comissao e margem em decimal (0.27, 0.30) */
export function calcPrecoERP(custo: number, taxaFixa: number, comissao: number, margem: number): number {
  const divisor = 1 - comissao - margem;
  if (divisor <= 0) return 0;
  return (custo + taxaFixa) / divisor;
}

export function calcLucroERP(custo: number, taxaFixa: number, preco: number): number {
  return preco - custo - taxaFixa;
}

/** Ler tabela precificacao com joins em produto e delivery */
export function usePrecificacao(filters?: { produto_id?: string; delivery_id?: string }) {
  return useQuery({
    queryKey: ["precificacao", filters],
    queryFn: async (): Promise<PrecificacaoRow[]> => {
      let q = supabase
        .from("precificacao")
        .select(`
          *,
          produtos:produto_id ( nome ),
          deliveries:delivery_id ( nome, cor )
        `)
        .order("data_calculo", { ascending: false });

      if (filters?.produto_id)  q = q.eq("produto_id", filters.produto_id);
      if (filters?.delivery_id) q = q.eq("delivery_id", filters.delivery_id);

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        ...r,
        produto_nome:  r.produtos?.nome,
        delivery_nome: r.deliveries?.nome,
        delivery_cor:  r.deliveries?.cor,
      }));
    },
  });
}

/** Chamar RPC recalcular_tudo() via banco */
export function useRecalcularTudo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("recalcular_tudo");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["precificacao"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

/** Recalcular para um produto/delivery específico */
export function useRecalcularPrecificacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ produto_id, delivery_id }: { produto_id?: string; delivery_id?: string }) => {
      const { error } = await supabase.rpc("recalcular_precificacao", {
        p_produto_id:  produto_id  ?? null,
        p_delivery_id: delivery_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["precificacao"] }),
  });
}
