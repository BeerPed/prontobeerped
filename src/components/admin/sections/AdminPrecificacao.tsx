import { useState, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAllProductDeliveries, useUpdateProductDeliveryMargin } from "@/hooks/useProductDeliveries";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { calcPrecoERP, calcLucroERP, useRecalcularTudo } from "@/hooks/usePrecificacao";
import { useToast } from "@/hooks/use-toast";

export function AdminPrecificacao() {
  const { data: products = [] } = useProducts();
  const { data: deliveries = [] } = useDeliveries();
  const { data: pdAll = [] } = useAllProductDeliveries();
  const { data: settings } = useSiteSettings();
  const margemPadrao = (settings as any)?.margem_padrao ?? 30;
  const updateMargin = useUpdateProductDeliveryMargin();
  const recalcular   = useRecalcularTudo();
  const { toast }    = useToast();

  const [filter, setFilter] = useState("");
  const [editingMargin, setEditingMargin] = useState<{ pid: string; did: string } | null>(null);
  const [marginInput, setMarginInput] = useState("");

  const pdMap = new Map(pdAll.map(pd => [`${pd.product_id}:${pd.delivery_id}`, pd]));

  const filtered = products.filter(p =>
    p.nome.toLowerCase().includes(filter.toLowerCase())
  );

  const rows = useMemo(() => {
    const result: any[] = [];
    for (const p of filtered) {
      for (const d of deliveries) {
        const key      = `${p.id}:${d.id}`;
        const pd       = pdMap.get(key);
        const ativo    = pd?.ativo ?? false;
        const margemPct = pd?.margem ?? margemPadrao;
        const margem   = margemPct / 100;
        const comissao = (d.comissao ?? 0) / 100;
        const taxa     = (d as any).taxa_fixa ?? 0;
        const custo    = p.custo ?? 0;
        // Fórmula ERP: preco = (custo + taxa_fixa) / (1 - comissao - margem)
        const preco    = calcPrecoERP(custo, taxa, comissao, margem);
        const lucro    = calcLucroERP(custo, taxa, preco);
        result.push({ p, d, ativo, margemPct, custo, comissao, taxa, preco, lucro });
      }
    }
    return result;
  }, [filtered, deliveries, pdMap, margemPadrao]);

  const saveMargin = async (pid: string, did: string) => {
    const v = parseFloat(marginInput.replace(",", "."));
    if (isNaN(v)) return;
    await updateMargin.mutateAsync({ product_id: pid, delivery_id: did, margem: v });
    setEditingMargin(null);
  };

  const handleRecalcular = async () => {
    try {
      const result: any = await recalcular.mutateAsync();
      toast({ title: "Recálculo concluído", description: `${result?.registros ?? 0} linha(s) na tabela de precificação` });
    } catch (e: any) {
      toast({ title: "Erro ao recalcular", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Precificação</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Fórmula:{" "}
            <code className="text-amber-400 text-xs bg-black/30 px-1.5 py-0.5 rounded">
              preço = (custo + taxa_fixa) ÷ (1 − comissão − margem)
            </code>
          </p>
        </div>
        <button
          onClick={handleRecalcular}
          disabled={recalcular.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${recalcular.isPending ? "animate-spin" : ""}`} />
          Recalcular Tudo
        </button>
      </div>

      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filtrar produtos..."
        className="w-full max-w-sm rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 outline-none focus:border-amber-400/50 transition-colors"
      />

      <div className="rounded-xl border border-white/5 bg-[#1a1d27] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="border-b border-white/5">
                {["Produto", "Delivery", "Custo", "Comissão", "Taxa Fixa", "Margem", "Preço Final", "Lucro"].map(h => (
                  <th key={h} className="text-left text-white/40 font-medium px-3 py-3 last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-white/30 py-10">
                    Nenhum dado — ative produtos nos deliveries primeiro
                  </td>
                </tr>
              ) : rows.map(({ p, d, ativo, margemPct, custo, comissao, taxa, preco, lucro }) => {
                const isEditing  = editingMargin?.pid === p.id && editingMargin?.did === d.id;
                const lucroClass = lucro >= 0
                  ? "text-green-400 bg-green-500/10"
                  : "text-red-400 bg-red-500/10";
                return (
                  <tr
                    key={`${p.id}:${d.id}`}
                    className={`border-b border-white/5 transition-colors ${ativo ? "hover:bg-white/3" : "opacity-35"}`}
                  >
                    <td className="px-3 py-2.5 text-white/80 font-medium">{p.nome}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ background: d.cor ?? "#9333ea" }}
                      >{d.nome}</span>
                    </td>
                    <td className="px-3 py-2.5 text-white/60 font-mono">R$ {custo.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-white/60">{(comissao * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2.5 text-white/60 font-mono">R$ {taxa.toFixed(2)}</td>
                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={marginInput}
                            onChange={e => setMarginInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter")  saveMargin(p.id, d.id);
                              if (e.key === "Escape") setEditingMargin(null);
                            }}
                            className="w-16 rounded px-2 py-1 bg-white/10 border border-amber-400/50 text-white text-xs outline-none"
                          />
                          <button onClick={() => saveMargin(p.id, d.id)} className="text-amber-400 text-xs">✓</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingMargin({ pid: p.id, did: d.id }); setMarginInput(String(margemPct)); }}
                          className="text-amber-300 hover:text-amber-200 font-mono text-xs underline decoration-dashed"
                        >{margemPct}%</button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-white font-bold font-mono">R$ {preco.toFixed(2)}</td>
                    <td className={`px-3 py-2.5 text-right font-mono font-semibold ${lucroClass} rounded-sm`}>
                      R$ {lucro.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
