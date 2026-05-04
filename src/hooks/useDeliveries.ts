import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Delivery {
  id: string;
  nome: string;
  comissao: number;
  cor: string | null;
  ativo: boolean;
}

export function useDeliveries() {
  return useQuery({
    queryKey: ["deliveries"],
    queryFn: async (): Promise<Delivery[]> => {
      const { data, error } = await supabase
        .from("deliveries" as never)
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as Delivery[];
    },
  });
}

export function useUpsertDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Delivery> & { nome: string }) => {
      if (input.id) {
        const { error } = await supabase
          .from("deliveries" as never)
          .update({ nome: input.nome, comissao: input.comissao ?? 0, cor: input.cor, ativo: input.ativo ?? true } as never)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("deliveries" as never)
          .insert({ nome: input.nome, comissao: input.comissao ?? 0, cor: input.cor ?? "#9333ea", ativo: input.ativo ?? true } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliveries"] }),
  });
}

export function useDeleteDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deliveries" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliveries"] }),
  });
}
