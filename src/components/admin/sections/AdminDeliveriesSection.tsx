import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useDeliveries, useUpsertDelivery, useDeleteDelivery, type Delivery } from "@/hooks/useDeliveries";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function AdminDeliveriesSection() {
  const { data: deliveries, isLoading } = useDeliveries();
  const upsert = useUpsertDelivery();
  const remove = useDeleteDelivery();
  const { toast } = useToast();

  const [editing, setEditing] = useState<Partial<Delivery & { taxa_fixa: number }> | null>(null);
  const [deleting, setDeleting] = useState<Delivery | null>(null);

  const handleSave = async () => {
    if (!editing?.nome?.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    try {
      await upsert.mutateAsync({
        id: editing.id,
        nome: editing.nome,
        comissao: Number(editing.comissao ?? 0),
        cor: editing.cor ?? "#9333ea",
        ativo: editing.ativo ?? true,
        taxa_fixa: Number((editing as any).taxa_fixa ?? 0),
      } as any);
      toast({ title: "Delivery salvo" });
      setEditing(null);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const inputCls = "w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-amber-400/50 transition-colors";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Delivery Apps</h1>
          <p className="text-white/40 text-sm">Configure comissões e taxas de cada plataforma</p>
        </div>
        <button
          onClick={() => setEditing({ nome: "", comissao: 20, cor: "#9333ea", ativo: true, taxa_fixa: 0 })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors">
          <Plus className="h-4 w-4" />Novo
        </button>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1a1d27] overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Cor","Plataforma","Comissão","Taxa Fixa","Status","Ações"].map(h => (
                    <th key={h} className="text-left text-white/40 font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(deliveries ?? []).map(d => (
                  <tr key={d.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 cursor-pointer"
                    onClick={() => setEditing({ ...d, taxa_fixa: (d as any).taxa_fixa ?? 0 })}>
                    <td className="px-4 py-3">
                      <div className="h-6 w-6 rounded-full border border-white/10" style={{ background: d.cor ?? "#9333ea" }} />
                    </td>
                    <td className="px-4 py-3 text-white font-semibold">{d.nome}</td>
                    <td className="px-4 py-3 text-amber-400 font-mono font-bold">{Number(d.comissao).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-white/60 font-mono">R$ {Number((d as any).taxa_fixa ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.ativo ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>
                        {d.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDeleting(d)} className="text-red-400/50 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {(deliveries ?? []).length === 0 && (
                  <tr><td colSpan={6} className="text-center text-white/30 py-10">Nenhum delivery cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Panel */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg">{editing.id ? "Editar Delivery" : "Novo Delivery"}</h3>
            <div className="space-y-1">
              <label className="text-white/50 text-xs font-semibold uppercase">Nome</label>
              <input value={editing.nome ?? ""} onChange={e => setEditing({...editing, nome: e.target.value})}
                placeholder="iFood" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-white/50 text-xs font-semibold uppercase">Comissão (%)</label>
                <input type="number" step="0.1" min="0" max="99"
                  value={editing.comissao ?? 0} onChange={e => setEditing({...editing, comissao: Number(e.target.value)})}
                  className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-white/50 text-xs font-semibold uppercase">Taxa Fixa (R$)</label>
                <input type="number" step="0.01" min="0"
                  value={(editing as any).taxa_fixa ?? 0} onChange={e => setEditing({...editing, taxa_fixa: Number(e.target.value)} as any)}
                  className={inputCls} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-white/50 text-xs font-semibold uppercase">Cor</label>
              <div className="flex items-center gap-3">
                <input type="color" value={editing.cor ?? "#9333ea"} onChange={e => setEditing({...editing, cor: e.target.value})}
                  className="h-10 w-20 rounded-lg p-1 bg-white/5 border border-white/10 cursor-pointer" />
                <span className="text-white/50 text-sm">{editing.cor ?? "#9333ea"}</span>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`relative w-10 h-5 rounded-full transition-colors ${editing.ativo ? "bg-amber-500" : "bg-white/10"}`}
                onClick={() => setEditing({...editing, ativo: !editing.ativo})}>
                <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${editing.ativo ? "translate-x-5" : ""}`} />
              </div>
              <span className="text-white/70 text-sm">Ativo</span>
            </label>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5">Cancelar</button>
              <button onClick={handleSave} disabled={upsert.isPending}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors">
                {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-[#1a1d27] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir delivery?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Remover "{deleting?.nome}"? Pedidos existentes não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/60 hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { if (deleting) await remove.mutateAsync(deleting.id); setDeleting(null); }}
              className="bg-red-600 hover:bg-red-500 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
