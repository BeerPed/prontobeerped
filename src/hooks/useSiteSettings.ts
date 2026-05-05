import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  id: string;
  logo_url: string | null;
  login_bg_url: string | null;
  margem_padrao: number;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async (): Promise<SiteSettings | null> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SiteSettings | null;
    },
  });
}

export function useUpdateSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      patch: Partial<Pick<SiteSettings, "logo_url" | "login_bg_url" | "margem_padrao">> & { id: string }
    ) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("site_settings").update(rest as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site_settings"] }),
  });
}

/** Upsert sem precisar do id — busca o singleton e atualiza */
export function useUpsertSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<SiteSettings, "logo_url" | "login_bg_url" | "margem_padrao">>) => {
      const { data: existing } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
      if (existing?.id) {
        const { error } = await supabase.from("site_settings").update(patch as never).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert(patch as never);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site_settings"] }),
  });
}
