import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OrderStatus =
  | "pendente"
  | "confirmado"
  | "preparando"
  | "pronto"
  | "saiu_entrega"
  | "entregue"
  | "cancelado";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  preparando: "Preparando",
  pronto: "Pronto",
  saiu_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  preparando: "bg-orange-100 text-orange-800",
  pronto: "bg-purple-100 text-purple-800",
  saiu_entrega: "bg-indigo-100 text-indigo-800",
  entregue: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

export interface OrderItem {
  product_id: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  custo_unitario?: number;
}

export interface Order {
  id: string;
  external_id: string | null;
  cliente_nome: string;
  cliente_telefone: string | null;
  delivery_id: string | null;
  status: OrderStatus;
  valor_total: number;
  lucro_estimado: number | null;
  itens: OrderItem[];
  observacao: string | null;
  created_at: string;
  updated_at: string;
  // joined
  delivery_nome?: string;
  delivery_cor?: string;
}

export type OrderInsert = Omit<Order, "id" | "created_at" | "updated_at" | "delivery_nome" | "delivery_cor">;

export function useOrders(filters?: { delivery_id?: string; status?: OrderStatus }) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: async (): Promise<Order[]> => {
      let query = (supabase as any)
        .from("orders")
        .select(`*, deliveries:delivery_id(nome, cor)`)
        .order("created_at", { ascending: false });

      if (filters?.delivery_id) query = query.eq("delivery_id", filters.delivery_id);
      if (filters?.status) query = query.eq("status", filters.status);

      const { data, error } = await query;
      if (error) throw error;

      return ((data ?? []) as any[]).map((o: any) => ({
        ...o,
        itens: Array.isArray(o.itens) ? o.itens : [],
        delivery_nome: o.deliveries?.nome ?? null,
        delivery_cor: o.deliveries?.cor ?? null,
      }));
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: Partial<OrderInsert>) => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .insert(order)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await (supabase as any)
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
