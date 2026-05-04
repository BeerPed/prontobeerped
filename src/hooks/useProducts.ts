import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Categoria =
  | "bebidas"
  | "refrigerantes"
  | "alcoolicas"
  | "snacks"
  | "congelados"
  | "combos";

export const CATEGORIAS: { value: Categoria; label: string; emoji: string }[] = [
  { value: "bebidas", label: "Bebidas", emoji: "🥤" },
  { value: "refrigerantes", label: "Refrigerantes", emoji: "🥫" },
  { value: "alcoolicas", label: "Alcoólicas", emoji: "🍺" },
  { value: "snacks", label: "Snacks", emoji: "🍿" },
  { value: "congelados", label: "Congelados", emoji: "🧊" },
  { value: "combos", label: "Combos & Mercado", emoji: "🛒" },
];

export interface Product {
  id: string;
  nome: string;
  codigo: string | null;
  custo: number;
  categoria: Categoria;
  gelavel: boolean;
  ativo: boolean;
  preco: number | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at">;
export type ProductUpdate = Partial<ProductInsert>;

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("categoria", { ascending: true })
        .order("nome", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto adicionado" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...product }: { id: string } & ProductUpdate) => {
      const { data, error } = await supabase
        .from("products")
        .update(product as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto atualizado" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto removido" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

/** Calcula preço final: custo com margem, ajustado pela comissão do delivery */
export function calcPrecoFinal(custo: number, margem: number, comissao: number): number {
  if (!custo || custo <= 0) return 0;
  const comMargem = custo * (1 + margem / 100);
  const comissaoFrac = Math.min(Math.max(comissao, 0), 99) / 100;
  return comMargem / (1 - comissaoFrac);
}
