import { useState, useMemo } from "react";
import { calcPrecoERP, calcLucroERP } from "@/hooks/usePrecificacao";
import { useProducts } from "@/hooks/useProducts";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function AdminSimulador() {
  const { data: products = [] } = useProducts();
  const { data: deliveries = [] } = useDeliveries();
  const { data: settings } = useSiteSettings();
  const margemPadrao = (settings as any)?.margem_padrao ?? 30;

  const [productId,  setProductId]  = useState("");
  const [deliveryId, setDeliveryId] = useState("");
  const [margem,     setMargem]     = useState<number>(margemPadrao);

  const result = useMemo(() => {
    const p = products.find(x => x.id === productId);
    const d = deliveries.find(x => x.id === deliveryId);
    if (!p || !d) return null;
    const custo    = p.custo ?? 0;
    const taxa     = (d as any).taxa_fixa ?? 0;
    const comissao = (d.comissao ?? 0) / 100;
    const margemD  = margem / 100;
    // Fórmula ERP: preco = (custo + taxa_fixa) / (1 - comissao - margem)
    const preco = calcPrecoERP(custo, taxa, comissao, margemD);
    const lucro = calcLucroERP(custo, taxa, preco);
    const margemReal = preco > 0 ? (lucro / preco) * 100 : 0;
    return { custo, taxa, comissao: d.comissao ?? 0, preco, lucro, margemReal };
  }, [productId, deliveryId, margem, products, deliveries]);

  const selectCls = "w-full rounded-lg px-3 py-2.5 bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-amber-400/50 transition-colors";

  // Limite seguro da margem: 1 - comissao - 0.01 (deixar ao menos 1% de divisor)
  const selectedDelivery = deliveries.find(x => x.id === deliveryId);
  const maxMargem = selectedDelivery
    ? Math.max(0, Math.floor((1 - (selectedDelivery.comissao ?? 0) / 100 - 0.01) * 100))
    : 90;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-white text-2xl font-bold">Simulador de Preço</h1>
        <p className="text-white/40 text-sm mt-1">
          Teste o preço final antes de publicar —{" "}
          <code className="text-amber-400 text-xs bg-black/30 px-1 rounded">
            preço = (custo + taxa) ÷ (1 − comissão − margem)
          </code>
        </p>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1a1d27] p-6 space-y-5">
        {/* Produto */}
        <div className="space-y-1.5">
          <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Produto</label>
          <select value={productId} onChange={e => setProductId(e.target.value)} className={selectCls}>
            <option value="">Selecionar produto...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.nome} — custo R$ {Number(p.custo ?? 0).toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery */}
        <div className="space-y-1.5">
          <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Delivery App</label>
          <select value={deliveryId} onChange={e => setDeliveryId(e.target.value)} className={selectCls}>
            <option value="">Selecionar delivery...</option>
            {deliveries.map(d => (
              <option key={d.id} value={d.id}>
                {d.nome} — {Number(d.comissao).toFixed(1)}% comissão
                {(d as any).taxa_fixa > 0 ? ` + R$ ${Number((d as any).taxa_fixa).toFixed(2)} taxa` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Margem */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Margem de Lucro</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={maxMargem}
                value={margem}
                onChange={e => setMargem(Math.min(maxMargem, Math.max(0, Number(e.target.value))))}
                className="w-16 rounded px-2 py-1 bg-white/10 border border-white/20 text-amber-400 font-bold text-sm text-center outline-none"
              />
              <span className="text-amber-400 font-bold">%</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={maxMargem}
            value={margem}
            onChange={e => setMargem(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="flex justify-between text-white/30 text-xs">
            <span>0%</span>
            <span>{Math.floor(maxMargem / 2)}%</span>
            <span>{maxMargem}%</span>
          </div>
        </div>

        {/* Resultado */}
        {result ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3 mt-2">
            <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Resultado</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Custo",        val: `R$ ${result.custo.toFixed(2)}`,    cls: "text-white/70" },
                { label: "Taxa Fixa",    val: `R$ ${result.taxa.toFixed(2)}`,     cls: "text-orange-300" },
                { label: "Comissão",     val: `${result.comissao.toFixed(1)}%`,   cls: "text-orange-400" },
                { label: "Margem real",  val: `${result.margemReal.toFixed(1)}%`, cls: "text-amber-300" },
              ].map(({ label, val, cls }) => (
                <div key={label} className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/40 text-xs mb-1">{label}</p>
                  <p className={cls}>{val}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <p className="text-white/40 text-xs mb-1">Preço Final</p>
              <p className="text-white text-3xl font-bold font-mono">R$ {result.preco.toFixed(2)}</p>
            </div>
            <div className={`rounded-lg p-4 text-center ${
              result.lucro >= 0
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}>
              <p className="text-white/50 text-xs mb-1">Lucro estimado</p>
              <p className={`text-3xl font-bold ${result.lucro >= 0 ? "text-green-400" : "text-red-400"}`}>
                R$ {result.lucro.toFixed(2)}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-white/3 p-8 text-center text-white/30 text-sm">
            Selecione um produto e um delivery para ver o resultado
          </div>
        )}
      </div>
    </div>
  );
}
