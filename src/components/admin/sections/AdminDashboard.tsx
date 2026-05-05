import { useMemo } from "react";
import { Package, TrendingUp, AlertTriangle, RefreshCw, DollarSign, ShoppingBag } from "lucide-react";
import { useProducts, calcPrecoFinal } from "@/hooks/useProducts";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAllProductDeliveries } from "@/hooks/useProductDeliveries";
import { useOrders } from "@/hooks/useOrders";
import { useSiteSettings } from "@/hooks/useSiteSettings";

function MetricCard({ icon: Icon, label, value, sub, color = "amber" }: {
  icon: any; label: string; value: string; sub?: string; color?: string;
}) {
  const cls: Record<string, string> = {
    amber:  "border-amber-500/20 text-amber-400",
    green:  "border-green-500/20 text-green-400",
    red:    "border-red-500/20 text-red-400",
    blue:   "border-blue-500/20 text-blue-400",
    purple: "border-purple-500/20 text-purple-400",
    cyan:   "border-cyan-500/20 text-cyan-400",
  };
  return (
    <div className={`rounded-xl border bg-white/3 p-5 flex items-start gap-4 ${cls[color]}`}>
      <div className="rounded-lg bg-white/5 p-2.5">
        <Icon className={`h-5 w-5 ${cls[color].split(" ")[1]}`} />
      </div>
      <div className="min-w-0">
        <p className="text-white/50 text-xs font-medium mb-1">{label}</p>
        <p className="text-white text-2xl font-bold truncate">{value}</p>
        {sub && <p className="text-white/40 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { data: products = [] } = useProducts();
  const { data: deliveries = [] } = useDeliveries();
  const { data: pdAll = [] } = useAllProductDeliveries();
  const { data: orders = [] } = useOrders();
  const { data: settings } = useSiteSettings();
  const margemPadrao = (settings as any)?.margem_padrao ?? 30;

  const stats = useMemo(() => {
    const total = products.length;
    const ativos = products.filter(p => p.ativo).length;
    let comPrejuizo = 0;
    for (const p of products) {
      for (const d of deliveries) {
        const pd = pdAll.find(x => x.product_id === p.id && x.delivery_id === d.id);
        if (!pd?.ativo) continue;
        const margem = pd?.margem ?? margemPadrao;
        const preco = calcPrecoFinal(p.custo ?? 0, margem, d.comissao ?? 0);
        if (preco - (p.custo ?? 0) < 0) { comPrejuizo++; break; }
      }
    }
    const faturamento = orders.reduce((s, o) => s + (o.valor_total ?? 0), 0);
    const lucro = orders.reduce((s, o) => s + (o.lucro_estimado ?? 0), 0);
    const sorted = [...products].sort((a, b) =>
      new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
    );
    const lastUpdate = sorted[0]?.updated_at
      ? new Date(sorted[0].updated_at).toLocaleDateString("pt-BR") : "—";
    const emAberto = orders.filter(o => !["entregue","cancelado"].includes(o.status)).length;
    return { total, ativos, comPrejuizo, faturamento, lucro, lastUpdate, emAberto };
  }, [products, deliveries, pdAll, orders, margemPadrao]);

  const deliveryStats = useMemo(() =>
    deliveries.map(d => ({
      ...d,
      ativos: pdAll.filter(pd => pd.delivery_id === d.id && pd.ativo).length,
    }))
  , [deliveries, pdAll]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Visão geral da operação</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard icon={Package}       label="Total de produtos"     value={String(stats.total)}                   sub={`${stats.ativos} ativos`}          color="amber"  />
        <MetricCard icon={TrendingUp}    label="Faturamento total"     value={`R$ ${stats.faturamento.toFixed(2)}`}  sub="todos os pedidos"                  color="green"  />
        <MetricCard icon={DollarSign}    label="Lucro estimado"        value={`R$ ${stats.lucro.toFixed(2)}`}        sub="baseado nos pedidos"               color="cyan"   />
        <MetricCard icon={AlertTriangle} label="Produtos com prejuízo" value={String(stats.comPrejuizo)}             sub="em algum delivery"                 color="red"    />
        <MetricCard icon={ShoppingBag}   label="Pedidos em aberto"     value={String(stats.emAberto)}                sub="pendente/preparando/pronto"        color="blue"   />
        <MetricCard icon={RefreshCw}     label="Última atualização"    value={stats.lastUpdate}                      sub="de custo de produto"               color="purple" />
      </div>

      <div>
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Apps de Delivery</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {deliveryStats.map(d => (
            <div key={d.id} className="rounded-xl border border-white/5 bg-[#1a1d27] p-4 flex flex-col gap-1"
              style={{ borderLeftColor: d.cor ?? "#9333ea", borderLeftWidth: 3 }}>
              <span className="text-white font-semibold text-sm">{d.nome}</span>
              <span className="text-white/50 text-xs">{d.ativos} produtos ativos</span>
              <span className="text-white/40 text-xs">Comissão: {Number(d.comissao).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {orders.length > 0 && (
        <div>
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Últimos Pedidos</h2>
          <div className="rounded-xl border border-white/5 bg-[#1a1d27] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Cliente","Delivery","Status","Valor"].map(h => (
                    <th key={h} className="text-left text-white/40 font-medium px-4 py-3 last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0,5).map(o => (
                  <tr key={o.id} className="border-b border-white/5 last:border-0">
                    <td className="text-white/80 px-4 py-3">{o.cliente_nome || "—"}</td>
                    <td className="text-white/60 px-4 py-3">{o.delivery_nome ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">{o.status}</span>
                    </td>
                    <td className="text-green-400 px-4 py-3 text-right font-medium">R$ {Number(o.valor_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
