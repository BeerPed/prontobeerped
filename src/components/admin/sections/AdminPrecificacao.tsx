import { useState, useMemo } from "react";
import { useProducts, calcPrecoFinal } from "@/hooks/useProducts";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAllProductDeliveries, useUpdateProductDeliveryMargin } from "@/hooks/useProductDeliveries";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function AdminPrecificacao() {
  const { data: products = [] } = useProducts();
  const { data: deliveries = [] } = useDeliveries();
  const { data: pdAll = [] } = useAllProductDeliveries();
  const { data: settings } = useSiteSettings();
  const margemPadrao = (settings as any)?.margem_padrao ?? 30;
  const updateMargin = useUpdateProductDeliveryMargin();

  const [filter, setFilter] = useState("");
  const [editingMargin, setEditingMargin] = useState<{pid: string; did: string} | null>(null);
  const [marginInput, setMarginInput] = useState("");

  const pdMap = new Map(pdAll.map(pd => [`${pd.product_id}:${pd.delivery_id}`, pd]));

  const filtered = products.filter(p =>
    p.nome.toLowerCase().includes(filter.toLowerCase())
  );

  const rows = useMemo(() => {
    const result: any[] = [];
    for (const p of filtered) {
      for (const d of deliveries) {
        const key = `${p.id}:${d.id}`;
        const pd = pdMap.get(key);
        const ativo = pd?.ativo ?? false;
        const margem = pd?.margem ?? margemPadrao;
        const custo = p.custo ?? 0;
        const comissao = d.comissao ?? 0;
        const taxa = (d as any).taxa_fixa ?? 0;
        const preco = calcPrecoFinal(custo, margem, comissao) + taxa;
        const lucro = preco - custo - taxa;
        result.push({ p, d, ativo, margem, custo, comissao, taxa, preco, lucro });
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white text-2xl font-bold">Precificação</h1>
        <p className="text-white/40 text-sm">Tabela completa produto × delivery. Clique na margem para editar.</p>
      </div>
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filtrar produtos..."
        className="w-full max-w-sm rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 outline-none"
      />
      <div className="rounded-xl border border-white/5 bg-[#1a1d27] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="border-b border-white/5">
                {["Produto","Delivery","Custo","Comissão","Taxa","Margem","Preço Final","Lucro"].map(h => (
                  <th key={h} className="text-left text-white/40 font-medium px-3 py-3 last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-white/30 py-10">Nenhum dado</td></tr>
              ) : rows.map(({ p, d, ativo, margem, custo, comissao, taxa, preco, lucro }) => {
                const isEditing = editingMargin?.pid === p.id && editingMargin?.did === d.id;
                const lucroClass = lucro >= 0 ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10";
                return (
                  <tr key={`${p.id}:${d.id}`}
                    className={`border-b border-white/5 transition-colors ${ativo ? "hover:bg-white/3" : "opacity-40"}`}>
                    <td className="px-3 py-2.5 text-white/80 font-medium">{p.nome}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ background: d.cor ?? "#9333ea" }}>{d.nome}</span>
                    </td>
                    <td className="px-3 py-2.5 text-white/60 font-mono">R$ {custo.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-white/60">{comissao.toFixed(1)}%</td>
                    <td className="px-3 py-2.5 text-white/60 font-mono">R$ {taxa.toFixed(2)}</td>
                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={marginInput}
                            onChange={e => setMarginInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") saveMargin(p.id, d.id); if (e.key === "Escape") setEditingMargin(null); }}
                            className="w-16 rounded px-2 py-1 bg-white/10 border border-amber-400/50 text-white text-xs"
                          />
                          <button onClick={() => saveMargin(p.id, d.id)} className="text-amber-400 text-xs">✓</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingMargin({ pid: p.id, did: d.id }); setMarginInput(String(margem)); }}
                          className="text-amber-300 hover:text-amber-200 font-mono text-xs underline decoration-dashed"
                        >{margem}%</button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-white font-bold font-mono">R$ {preco.toFixed(2)}</td>
                    <td className={`px-3 py-2.5 text-right font-mono font-semibold rounded-sm ${lucroClass}`}>
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
