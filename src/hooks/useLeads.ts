import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  brinde_enviado: "Brinde enviado",
  cliente_fiel: "Cliente fiel",
  inativo: "Inativo",
};

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Lead> & { id: string }) => {
      const { error } = await supabase.from("leads").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

/** Upsert lead by phone (called publicly during checkout registration). */
export async function upsertLeadByPhone(input: {
  nome: string;
  telefone: string;
  endereco?: string | null;
  loja?: string | null;
}) {
  const { data, error } = await supabase.rpc("upsert_lead_by_phone", {
    _nome: input.nome,
    _telefone: input.telefone,
    _endereco: input.endereco ?? null,
    _loja: input.loja ?? null,
  });
  if (error) throw error;
  return data as string;
}

/** Record an order against an existing lead (by phone). */
export async function recordOrderForLead(
  telefone: string,
  order: { total: number; itens: unknown }
) {
  const { error } = await supabase.rpc("record_order_for_lead", {
    _telefone: telefone,
    _total: order.total,
    _itens: order.itens as never,
  });
  if (error) console.error("record_order_for_lead failed", error);
}
