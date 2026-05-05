import { useState, useMemo } from "react";
import { Download, Eye } from "lucide-react";
import { useProducts, CATEGORIAS } from "@/hooks/useProducts";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAllProductDeliveries } from "@/hooks/useProductDeliveries";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { calcPrecoERP, calcLucroERP } from "@/hooks/usePrecificacao";
import * as XLSX from "xlsx";

export function AdminCardapio() {
  const { data: products = [] } = useProducts();
  const { data: deliveries = [] } = useDeliveries();
  const { data: pdAll = [] } = useAllProductDeliveries();
  const { data: settings } = useSiteSettings();
  const margemPadrao = (settings as any)?.margem_padrao ?? 30;

  const [deliveryId, setDeliveryId] = useState("");
  const [preview, setPreview] = useState(false);

  const selectedDelivery = deliveries.find(d => d.id === deliveryId);

  const menuItems = useMemo(() => {
    if (!deliveryId) return [];
    return products
      .filter(p => p.ativo)
      .map(p => {
        const pd       = pdAll.find(x => x.product_id === p.id && x.delivery_id === deliveryId);
        const ativo    = pd?.ativo ?? false;
        const margemPct = pd?.margem ?? margemPadrao;
        const taxa     = (selectedDelivery as any)?.taxa_fixa ?? 0;
        const comissao = (selectedDelivery?.comissao ?? 0) / 100;
        const margem   = margemPct / 100;
        const custo    = p.custo ?? 0;
        // Fórmula ERP: preco = (custo + taxa_fixa) / (1 - comissao - margem)
        const preco    = calcPrecoERP(custo, taxa, comissao, margem);
        const lucro    = calcLucroERP(custo, taxa, preco);
        return { ...p, preco, lucro, ativo };
      })
      .filter(p => p.ativo);
  }, [deliveryId, products, pdAll, selectedDelivery, margemPadrao]);

  const exportJSON = () => {
    const data = menuItems.map(p => ({
      codigo: p.codigo,
      nome: p.nome,
      categoria: p.categoria,
      preco: parseFloat(p.preco.toFixed(2)),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cardapio-${selectedDelivery?.nome ?? "delivery"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const rows = menuItems.map(p => ({
      Código: p.codigo ?? "",
      Nome: p.nome,
      Categoria: CATEGORIAS.find(c => c.value === p.categoria)?.label ?? p.categoria,
      "Preço (R$)": parseFloat(p.preco.toFixed(2)),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cardápio");
    XLSX.writeFile(wb, `cardapio-${selectedDelivery?.nome ?? "delivery"}.xlsx`);
  };

  const selectCls = "rounded-lg px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-amber-400/50 transition-colors";
  const grouped = useMemo(() => {
    const g: Record<string, typeof menuItems> = {};
    for (const item of menuItems) {
      if (!g[item.categoria]) g[item.categoria] = [];
      g[item.categoria].push(item);
    }
    return g;
  }, [menuItems]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white text-2xl font-bold">Gerador de Cardápio</h1>
        <p className="text-white/40 text-sm mt-1">Exporte o cardápio formatado para cada delivery</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Delivery</label>
          <select value={deliveryId} onChange={e => setDeliveryId(e.target.value)} className={selectCls}>
            <option value="">Selecionar delivery...</option>
            {deliveries.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>
        {deliveryId && (
          <div className="flex gap-2">
            <button onClick={() => setPreview(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-sm transition-colors">
              <Eye className="h-4 w-4" />{preview ? "Ocultar" : "Visualizar"}
            </button>
            <button onClick={exportJSON}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-sm transition-colors">
              <Download className="h-4 w-4" />JSON
            </button>
            <button onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 text-sm transition-colors">
              <Download className="h-4 w-4" />Excel
            </button>
          </div>
        )}
      </div>

      {deliveryId && menuItems.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-[#1a1d27] p-10 text-center text-white/30 text-sm">
          Nenhum produto ativo para este delivery.<br />
          Ative produtos na tela de Produtos.
        </div>
      )}

      {preview && Object.keys(grouped).length > 0 && (
        <div className="rounded-xl border border-white/5 bg-[#1a1d27] overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full" style={{ background: selectedDelivery?.cor ?? "#9333ea" }} />
            <span className="text-white font-semibold">{selectedDelivery?.nome} — Cardápio ({menuItems.length} produtos)</span>
          </div>
          <div className="p-4 space-y-6">
            {Object.entries(grouped).map(([cat, items]) => {
              const catInfo = CATEGORIAS.find(c => c.value === cat);
              return (
                <div key={cat}>
                  <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
                    {catInfo?.emoji} {catInfo?.label ?? cat}
                  </h3>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-white/90 font-medium text-sm">{item.nome}</p>
                          {item.codigo && <p className="text-white/30 text-xs">Cód: {item.codigo}</p>}
                        </div>
                        <span className="text-amber-400 font-bold font-mono">R$ {item.preco.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!preview && deliveryId && menuItems.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-[#1a1d27] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/40 font-medium px-4 py-3">Nome</th>
                <th className="text-left text-white/40 font-medium px-4 py-3">Categoria</th>
                <th className="text-right text-white/40 font-medium px-4 py-3">Preço</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => (
                <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                  <td className="px-4 py-3 text-white/80">{item.nome}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">
                    {CATEGORIAS.find(c => c.value === item.categoria)?.emoji} {item.categoria}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-400 font-bold font-mono">R$ {item.preco.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
