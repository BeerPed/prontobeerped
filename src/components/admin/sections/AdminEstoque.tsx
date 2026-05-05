import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useStockCurrent, useStockMovements, useAddStockMovement } from "@/hooks/useStock";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AdminEstoque() {
  const { data: stock = [], isLoading } = useStockCurrent();
  const { data: movements = [] } = useStockMovements();
  const { data: products = [] } = useProducts();
  const addMovement = useAddStockMovement();
  const { toast } = useToast();

  const [movOpen, setMovOpen] = useState(false);
  const [movTipo, setMovTipo] = useState<"entrada" | "saida">("entrada");
  const [form, setForm] = useState({ product_id: "", quantidade: "1", observacao: "" });

  const handleSubmit = async () => {
    const qty = parseInt(form.quantidade);
    if (!form.product_id || isNaN(qty) || qty <= 0) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    await addMovement.mutateAsync({ product_id: form.product_id, tipo: movTipo, quantidade: qty, observacao: form.observacao || undefined });
    toast({ title: `${movTipo === "entrada" ? "Entrada" : "Saída"} registrada` });
    setForm({ product_id: "", quantidade: "1", observacao: "" });
    setMovOpen(false);
  };

  const inputCls = "w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-amber-400/50 transition-colors";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Estoque</h1>
          <p className="text-white/40 text-sm">{stock.length} produto(s) monitorados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setMovTipo("entrada"); setMovOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 text-sm transition-colors">
            <Plus className="h-4 w-4" />Entrada
          </button>
          <button onClick={() => { setMovTipo("saida"); setMovOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 text-sm transition-colors">
            <Minus className="h-4 w-4" />Saída
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Tabela saldo */}
        <div className="rounded-xl border border-white/5 bg-[#1a1d27] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-white/70 text-sm font-semibold">Saldo Atual</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-white/40 font-medium px-4 py-3">Produto</th>
                  <th className="text-left text-white/40 font-medium px-4 py-3">Categoria</th>
                  <th className="text-right text-white/40 font-medium px-4 py-3">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={3} className="text-center text-white/30 py-8">Carregando...</td></tr>
                ) : stock.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-white/30 py-8">Sem movimentações registradas</td></tr>
                ) : stock.map(s => (
                  <tr key={s.product_id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                    <td className="px-4 py-3 text-white/80 font-medium">{s.nome}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{s.categoria}</td>
                    <td className={`px-4 py-3 text-right font-bold font-mono ${s.saldo_atual > 0 ? "text-green-400" : s.saldo_atual < 0 ? "text-red-400" : "text-white/40"}`}>
                      {s.saldo_atual}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Últimas movimentações */}
        <div className="rounded-xl border border-white/5 bg-[#1a1d27] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-white/70 text-sm font-semibold">Últimas Movimentações</h2>
          </div>
          <div className="overflow-y-auto max-h-96">
            {movements.length === 0 ? (
              <p className="text-center text-white/30 text-sm py-8">Nenhuma movimentação</p>
            ) : movements.slice(0, 50).map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white/80 text-sm font-medium">{m.product_nome}</p>
                  {m.observacao && <p className="text-white/40 text-xs">{m.observacao}</p>}
                  <p className="text-white/30 text-xs">{new Date(m.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <span className={`text-sm font-bold font-mono ${m.tipo === "entrada" ? "text-green-400" : "text-red-400"}`}>
                  {m.tipo === "entrada" ? "+" : "−"}{m.quantidade}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={movOpen} onOpenChange={setMovOpen}>
        <DialogContent className="bg-[#1a1d27] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className={movTipo === "entrada" ? "text-green-400" : "text-red-400"}>
              {movTipo === "entrada" ? "Registrar Entrada" : "Registrar Saída"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <select value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} className={inputCls}>
              <option value="">Selecionar produto...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <input type="number" min={1} value={form.quantidade} onChange={e => setForm({...form, quantidade: e.target.value})}
              placeholder="Quantidade" className={inputCls} />
            <input value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})}
              placeholder="Observação (opcional)" className={inputCls} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setMovOpen(false)} className="px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5">Cancelar</button>
            <button onClick={handleSubmit}
              className={`px-4 py-2 rounded-lg font-semibold text-sm text-white transition-colors ${movTipo === "entrada" ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"}`}>
              Confirmar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
