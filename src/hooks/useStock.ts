import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StockMovement {
  id: string;
  product_id: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  observacao: string | null;
  created_at: string;
  // joined
  product_nome?: string;
  product_codigo?: string;
}

export interface StockCurrent {
  product_id: string;
  nome: string;
  codigo: string | null;
  categoria: string;
  saldo_atual: number;
}

export function useStockCurrent() {
  return useQuery({
    queryKey: ["stock_current"],
    queryFn: async (): Promise<StockCurrent[]> => {
      const { data, error } = await (supabase as any)
        .from("stock_current")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as StockCurrent[];
    },
  });
}

export function useStockMovements(productId?: string) {
  return useQuery({
    queryKey: ["stock_movements", productId],
    queryFn: async (): Promise<StockMovement[]> => {
      let query = (supabase as any)
        .from("stock_movements")
        .select(`*, products:product_id(nome, codigo)`)
        .order("created_at", { ascending: false })
        .limit(200);

      if (productId) query = query.eq("product_id", productId);

      const { data, error } = await query;
      if (error) throw error;

      return ((data ?? []) as any[]).map((m: any) => ({
        ...m,
        product_nome: m.products?.nome ?? "",
        product_codigo: m.products?.codigo ?? null,
      }));
    },
  });
}

export function useAddStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      product_id: string;
      tipo: "entrada" | "saida";
      quantidade: number;
      observacao?: string;
    }) => {
      const { error } = await (supabase as any)
        .from("stock_movements")
        .insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock_current"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
    },
  });
}
