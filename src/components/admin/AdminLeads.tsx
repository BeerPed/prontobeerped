import { useState } from "react";
import { Trash2, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useLeads, useUpdateLead, useDeleteLead,
  LEAD_STATUS_LABELS, type Lead, type LeadStatus,
} from "@/hooks/useLeads";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (v: number | null) =>
  v == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const statusColor: Record<LeadStatus, string> = {
  novo: "bg-blue-500",
  contatado: "bg-yellow-500",
  brinde_enviado: "bg-purple-500",
  cliente_fiel: "bg-green-600",
  inativo: "bg-gray-400",
};

export function AdminLeads() {
  const { data: leads, isLoading } = useLeads();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [notas, setNotas] = useState("");

  const filtered = leads?.filter((l) => {
    const t = search.toLowerCase();
    return (
      l.nome.toLowerCase().includes(t) ||
      l.telefone.toLowerCase().includes(t) ||
      (l.loja ?? "").toLowerCase().includes(t)
    );
  });

  const openWhats = (tel: string, nome: string) => {
    const phone = tel.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${nome}!`);
    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
  };

  const openEdit = (l: Lead) => { setEditing(l); setNotas(l.notas ?? ""); };

  const saveNotas = async () => {
    if (!editing) return;
    await updateLead.mutateAsync({ id: editing.id, notas });
    toast({ title: "Notas salvas" });
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar por nome, telefone ou loja..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <p className="text-sm text-muted-foreground">{filtered?.length ?? 0} lead(s)</p>
      </div>

      <div className="bg-card border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Loja</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>Último pedido</TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={7} className="text-center py-8">
                <Loader2 className="h-5 w-5 animate-spin inline" />
              </TableCell></TableRow>
            )}
            {!isLoading && filtered?.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhum lead cadastrado ainda.
              </TableCell></TableRow>
            )}
            {filtered?.map((l) => (
              <TableRow key={l.id} className="cursor-pointer" onClick={() => openEdit(l)}>
                <TableCell className="font-medium">{l.nome}</TableCell>
                <TableCell>{l.telefone}</TableCell>
                <TableCell>{l.loja || "—"}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={l.status}
                    onValueChange={(v) => updateLead.mutate({ id: l.id, status: v as LeadStatus })}
                  >
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue>
                        <Badge className={`${statusColor[l.status]} text-white`}>
                          {LEAD_STATUS_LABELS[l.status]}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{LEAD_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{l.total_pedidos}</TableCell>
                <TableCell>
                  {l.ultimo_pedido_at
                    ? `${new Date(l.ultimo_pedido_at).toLocaleDateString("pt-BR")} • ${formatCurrency(l.ultimo_pedido_total)}`
                    : "—"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openWhats(l.telefone, l.nome)}>
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleting(l)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.nome}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 text-sm">
              <p><strong>Telefone:</strong> {editing.telefone}</p>
              <p><strong>Endereço:</strong> {editing.endereco || "—"}</p>
              <p><strong>Loja:</strong> {editing.loja || "—"}</p>
              <p><strong>Total de pedidos:</strong> {editing.total_pedidos}</p>
              <p><strong>Último pedido:</strong> {editing.ultimo_pedido_at
                ? `${new Date(editing.ultimo_pedido_at).toLocaleString("pt-BR")} — ${formatCurrency(editing.ultimo_pedido_total)}`
                : "—"}</p>
              <div className="space-y-1">
                <label className="font-medium">Notas internas</label>
                <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={4}
                  placeholder="Brindes enviados, preferências, observações..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveNotas} disabled={updateLead.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.nome} será removido do CRM. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleting) await deleteLead.mutateAsync(deleting.id);
                setDeleting(null);
              }}
            >Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
