import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductDelivery {
  id: string;
  product_id: string;
  delivery_id: string;
  ativo: boolean;
  margem: number | null;
}

export function useProductDeliveries(productId?: string) {
  return useQuery({
    queryKey: ["product_deliveries", productId],
    queryFn: async (): Promise<ProductDelivery[]> => {
      let query = supabase.from("product_deliveries" as never).select("*");
      if (productId) query = (query as any).eq("product_id", productId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ProductDelivery[];
    },
    enabled: true,
  });
}

/** Busca todas as combinações de uma vez (sem filtro de produto) */
export function useAllProductDeliveries() {
  return useQuery({
    queryKey: ["product_deliveries_all"],
    queryFn: async (): Promise<ProductDelivery[]> => {
      const { data, error } = await supabase
        .from("product_deliveries" as never)
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as ProductDelivery[];
    },
  });
}

export function useToggleProductDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      product_id,
      delivery_id,
      ativo,
      margem,
    }: {
      product_id: string;
      delivery_id: string;
      ativo: boolean;
      margem?: number | null;
    }) => {
      // Upsert: insert or update
      const { error } = await supabase
        .from("product_deliveries" as never)
        .upsert(
          {
            product_id,
            delivery_id,
            ativo,
            ...(margem !== undefined ? { margem } : {}),
          } as never,
          { onConflict: "product_id,delivery_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product_deliveries_all"] });
      qc.invalidateQueries({ queryKey: ["product_deliveries"] });
    },
  });
}

export function useUpdateProductDeliveryMargin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      product_id,
      delivery_id,
      margem,
    }: {
      product_id: string;
      delivery_id: string;
      margem: number | null;
    }) => {
      const { error } = await supabase
        .from("product_deliveries" as never)
        .upsert(
          { product_id, delivery_id, margem, ativo: true } as never,
          { onConflict: "product_id,delivery_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product_deliveries_all"] });
    },
  });
}
