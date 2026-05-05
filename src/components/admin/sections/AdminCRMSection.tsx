import { useState } from "react";
import { useLeads, useUpdateLead, useDeleteLead, LEAD_STATUS_LABELS, type Lead, type LeadStatus } from "@/hooks/useLeads";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const STATUS_COLORS: Record<LeadStatus, string> = {
  novo: "bg-blue-500/20 text-blue-400",
  contatado: "bg-yellow-500/20 text-yellow-400",
  brinde_enviado: "bg-purple-500/20 text-purple-400",
  cliente_fiel: "bg-green-500/20 text-green-400",
  inativo: "bg-white/10 text-white/40",
};

export function AdminCRMSection() {
  const { data: leads = [], isLoading } = useLeads();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [detail, setDetail] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");

  const filtered = leads.filter(l =>
    l.nome.toLowerCase().includes(search.toLowerCase()) ||
    (l.telefone ?? "").includes(search)
  );

  const allStatuses = Object.keys(LEAD_STATUS_LABELS) as LeadStatus[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white text-2xl font-bold">CRM — Clientes</h1>
        <p className="text-white/40 text-sm">{filtered.length} cliente(s)</p>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..."
        className="w-full max-w-sm rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/30" />

      <div className="rounded-xl border border-white/5 bg-[#1a1d27] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5">
                {["Nome","Telefone","Pedidos","Último Total","Origem","Status","Ações"].map(h => (
                  <th key={h} className="text-left text-white/40 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center text-white/30 py-10">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-white/30 py-10">Nenhum cliente encontrado</td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                  <td className="px-4 py-3">
                    <button onClick={() => setDetail(l)} className="text-white/90 font-medium hover:text-amber-400 text-left">{l.nome}</button>
                  </td>
                  <td className="px-4 py-3 text-white/60 font-mono text-xs">{l.telefone ?? "—"}</td>
                  <td className="px-4 py-3 text-amber-400 font-bold text-center">{l.total_pedidos ?? 0}</td>
                  <td className="px-4 py-3 text-white/60 font-mono text-xs">
                    {l.ultimo_pedido_total ? `R$ ${Number(l.ultimo_pedido_total).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">{l.loja ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={l.status}
                      onChange={e => updateLead.mutate({ id: l.id, status: e.target.value as LeadStatus })}
                      className={`text-xs rounded-full px-2 py-0.5 font-medium border-0 outline-none cursor-pointer ${STATUS_COLORS[l.status as LeadStatus] ?? ""}`}
                    >
                      {allStatuses.map(s => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDeleting(l)} className="text-red-400/50 hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail dialog */}
      {detail && (
        <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
          <DialogContent className="bg-[#1a1d27] border-white/10 text-white max-w-md">
            <DialogHeader><DialogTitle>{detail.nome}</DialogTitle></DialogHeader>
            <div className="space-y-2 text-sm">
              <p><span className="text-white/40">Telefone:</span> <span className="ml-2">{detail.telefone ?? "—"}</span></p>
              <p><span className="text-white/40">Endereço:</span> <span className="ml-2">{detail.endereco ?? "—"}</span></p>
              <p><span className="text-white/40">Origem:</span> <span className="ml-2">{detail.loja ?? "—"}</span></p>
              <p><span className="text-white/40">Total pedidos:</span> <span className="ml-2 text-amber-400 font-bold">{detail.total_pedidos}</span></p>
              <p><span className="text-white/40">Último pedido:</span> <span className="ml-2">
                {detail.ultimo_pedido_at ? new Date(detail.ultimo_pedido_at).toLocaleDateString("pt-BR") : "—"}
              </span></p>
              <p><span className="text-white/40">Último valor:</span> <span className="ml-2 text-green-400 font-mono">
                {detail.ultimo_pedido_total ? `R$ ${Number(detail.ultimo_pedido_total).toFixed(2)}` : "—"}
              </span></p>
              {detail.notas && (
                <div>
                  <p className="text-white/40 mb-1">Notas:</p>
                  <p className="bg-white/5 rounded-lg p-3 text-white/70">{detail.notas}</p>
                </div>
              )}
              {detail.ultimo_pedido_itens && Array.isArray(detail.ultimo_pedido_itens) && (
                <div>
                  <p className="text-white/40 mb-2">Último pedido — itens:</p>
                  {(detail.ultimo_pedido_itens as any[]).map((it: any, i: number) => (
                    <div key={i} className="flex justify-between bg-white/5 rounded px-3 py-1.5 mb-1 text-xs">
                      <span className="text-white/70">{it.nome ?? it.product_id} × {it.quantidade}</span>
                      <span className="text-amber-400 font-mono">R$ {Number(it.preco_unitario * it.quantidade).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-[#1a1d27] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">Remover "{deleting?.nome}" do CRM?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/60 hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleting) await deleteLead.mutateAsync(deleting.id); setDeleting(null); }}
              className="bg-red-600 hover:bg-red-500 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
