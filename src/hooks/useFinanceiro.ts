import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Financeiro {
  codigo_barras: string;
  descricao: string;
  custo: number;
  data_atualizacao: string;
}

/** Listar todos os registros da tabela financeiro */
export function useFinanceiro() {
  return useQuery({
    queryKey: ["financeiro"],
    queryFn: async (): Promise<Financeiro[]> => {
      const { data, error } = await supabase
        .from("financeiro")
        .select("*")
        .order("descricao");
      if (error) throw error;
      return (data ?? []) as Financeiro[];
    },
  });
}

/** Buscar custo pelo codigo_barras */
export function useFinanceiroByCodigo(codigo_barras: string | null) {
  return useQuery({
    queryKey: ["financeiro", codigo_barras],
    enabled: !!codigo_barras,
    queryFn: async (): Promise<Financeiro | null> => {
      if (!codigo_barras) return null;
      const { data, error } = await supabase
        .from("financeiro")
        .select("*")
        .eq("codigo_barras", codigo_barras)
        .maybeSingle();
      if (error) throw error;
      return data as Financeiro | null;
    },
  });
}

/** Upsert em lote — usado na importação de planilha */
export function useUpsertFinanceiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Omit<Financeiro, "data_atualizacao">[]) => {
      const payload = rows.map(r => ({
        ...r,
        data_atualizacao: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("financeiro")
        .upsert(payload, { onConflict: "codigo_barras" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financeiro"] }),
  });
}
