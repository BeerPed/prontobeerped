import { useState } from "react";
import { Plus, X, RefreshCw } from "lucide-react";
import { useOrders, useCreateOrder, useUpdateOrderStatus, useDeleteOrder,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, type OrderStatus, type OrderItem } from "@/hooks/useOrders";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useProducts } from "@/hooks/useProducts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ALL_STATUSES: OrderStatus[] = ["pendente","confirmado","preparando","pronto","saiu_entrega","entregue","cancelado"];

export function AdminPedidos() {
  const { data: deliveries = [] } = useDeliveries();
  const { data: products = [] } = useProducts();
  const [filterDelivery, setFilterDelivery] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "">("");
  const { data: orders = [], isLoading } = useOrders({
    delivery_id: filterDelivery || undefined,
    status: filterStatus || undefined,
  });
  const createOrder = useCreateOrder();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();

  const [newOpen, setNewOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [form, setForm] = useState({ cliente_nome: "", cliente_telefone: "", delivery_id: "", observacao: "", items: [] as { pid: string; qty: number }[] });

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { pid: "", qty: 1 }] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, pid: string, qty: number) => setForm(f => {
    const items = [...f.items];
    items[i] = { pid, qty };
    return { ...f, items };
  });

  const handleCreate = async () => {
    const itens: OrderItem[] = form.items.map(it => {
      const p = products.find(x => x.id === it.pid);
      return { product_id: it.pid, nome: p?.nome ?? "", quantidade: it.qty, preco_unitario: p?.preco ?? 0, custo_unitario: p?.custo ?? 0 };
    }).filter(it => it.product_id);
    const valor_total = itens.reduce((s, it) => s + it.preco_unitario * it.quantidade, 0);
    const lucro_estimado = itens.reduce((s, it) => s + ((it.preco_unitario - (it.custo_unitario ?? 0)) * it.quantidade), 0);
    await createOrder.mutateAsync({
      cliente_nome: form.cliente_nome,
      cliente_telefone: form.cliente_telefone || null,
      delivery_id: form.delivery_id || null,
      observacao: form.observacao || null,
      status: "pendente", valor_total, lucro_estimado, itens,
      external_id: null,
    });
    setNewOpen(false);
    setForm({ cliente_nome: "", cliente_telefone: "", delivery_id: "", observacao: "", items: [] });
  };

  const selectCls = "rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white text-sm outline-none";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Pedidos</h1>
          <p className="text-white/40 text-sm">{orders.length} pedido(s)</p>
        </div>
        <button onClick={() => setNewOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors">
          <Plus className="h-4 w-4" />Novo Pedido
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select value={filterDelivery} onChange={e => setFilterDelivery(e.target.value)} className={selectCls}>
          <option value="">Todos os deliveries</option>
          {deliveries.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className={selectCls}>
          <option value="">Todos os status</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-white/5 bg-[#1a1d27] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5">
                {["ID/Ext","Cliente","Delivery","Status","Valor","Lucro","Ações"].map(h => (
                  <th key={h} className="text-left text-white/40 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center text-white/40 py-10">Carregando...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-white/30 py-10">Nenhum pedido encontrado</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                  <td className="px-4 py-3">
                    <p className="text-white/40 text-xs font-mono">{o.external_id ?? o.id.slice(0,8)}</p>
                  </td>
                  <td className="px-4 py-3 text-white/80 font-medium">{o.cliente_nome || "—"}</td>
                  <td className="px-4 py-3">
                    {o.delivery_nome ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                        style={{ background: o.delivery_cor ?? "#9333ea" }}>{o.delivery_nome}</span>
                    ) : <span className="text-white/30">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={e => updateStatus.mutate({ id: o.id, status: e.target.value as OrderStatus })}
                      className={`text-xs rounded-full px-2 py-0.5 font-medium border-0 outline-none cursor-pointer ${ORDER_STATUS_COLORS[o.status]}`}
                    >
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-amber-400 font-bold font-mono">R$ {Number(o.valor_total).toFixed(2)}</td>
                  <td className={`px-4 py-3 font-mono text-sm ${(o.lucro_estimado ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                    R$ {Number(o.lucro_estimado ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <button onClick={() => setDetailOrder(o)} className="text-white/40 hover:text-white/80 text-xs underline">Ver</button>
                    <button onClick={() => deleteOrder.mutate(o.id)} className="text-red-400/50 hover:text-red-400 ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Novo pedido dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="bg-[#1a1d27] border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle>Novo Pedido</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <input placeholder="Nome do cliente" value={form.cliente_nome} onChange={e => setForm({...form, cliente_nome: e.target.value})}
              className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white text-sm outline-none" />
            <input placeholder="Telefone" value={form.cliente_telefone} onChange={e => setForm({...form, cliente_telefone: e.target.value})}
              className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white text-sm outline-none" />
            <select value={form.delivery_id} onChange={e => setForm({...form, delivery_id: e.target.value})} className={selectCls + " w-full"}>
              <option value="">Selecionar delivery...</option>
              {deliveries.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Itens</span>
                <button onClick={addItem} className="text-amber-400 text-xs hover:text-amber-300">+ Adicionar item</button>
              </div>
              {form.items.map((it, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={it.pid} onChange={e => updateItem(i, e.target.value, it.qty)} className={selectCls + " flex-1"}>
                    <option value="">Produto...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                  <input type="number" min={1} value={it.qty} onChange={e => updateItem(i, it.pid, Number(e.target.value))}
                    className="w-16 rounded-lg px-2 py-2 bg-white/5 border border-white/10 text-white text-sm outline-none" />
                  <button onClick={() => removeItem(i)} className="text-red-400/60 hover:text-red-400"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <input placeholder="Observação" value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})}
              className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white text-sm outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setNewOpen(false)} className="px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5">Cancelar</button>
            <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm">Criar Pedido</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalhe do pedido */}
      {detailOrder && (
        <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
          <DialogContent className="bg-[#1a1d27] border-white/10 text-white max-w-md">
            <DialogHeader><DialogTitle>Pedido {detailOrder.external_id ?? detailOrder.id.slice(0,8)}</DialogTitle></DialogHeader>
            <div className="space-y-2 text-sm">
              <p><span className="text-white/40">Cliente:</span> <span className="text-white">{detailOrder.cliente_nome}</span></p>
              <p><span className="text-white/40">Telefone:</span> <span className="text-white">{detailOrder.cliente_telefone ?? "—"}</span></p>
              <p><span className="text-white/40">Delivery:</span> <span className="text-white">{detailOrder.delivery_nome ?? "—"}</span></p>
              <p><span className="text-white/40">Status:</span> <span className="text-white">{ORDER_STATUS_LABELS[detailOrder.status as OrderStatus]}</span></p>
              <p><span className="text-white/40">Observação:</span> <span className="text-white">{detailOrder.observacao ?? "—"}</span></p>
              {Array.isArray(detailOrder.itens) && detailOrder.itens.length > 0 && (
                <div>
                  <p className="text-white/40 mb-1">Itens:</p>
                  {detailOrder.itens.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between bg-white/5 rounded px-3 py-1.5 mb-1">
                      <span className="text-white/80">{it.nome} × {it.quantidade}</span>
                      <span className="text-amber-400 font-mono">R$ {(it.preco_unitario * it.quantidade).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t border-white/5 flex justify-between">
                <span className="text-white/40">Total:</span>
                <span className="text-amber-400 font-bold font-mono">R$ {Number(detailOrder.valor_total).toFixed(2)}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
