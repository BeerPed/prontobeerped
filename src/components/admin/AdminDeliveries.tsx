import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useDeliveries, useUpsertDelivery, useDeleteDelivery, type Delivery,
} from "@/hooks/useDeliveries";
import { useToast } from "@/hooks/use-toast";

export function AdminDeliveries() {
  const { data: deliveries, isLoading } = useDeliveries();
  const upsert = useUpsertDelivery();
  const remove = useDeleteDelivery();
  const { toast } = useToast();

  const [editing, setEditing] = useState<Partial<Delivery> | null>(null);
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
      });
      toast({ title: "Delivery salvo" });
      setEditing(null);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Plataformas de Delivery</CardTitle>
          <CardDescription>
            A comissão (%) cada plataforma cobra é descontada automaticamente do preço
            mostrado ao cliente, garantindo sua margem.
          </CardDescription>
        </div>
        <Button onClick={() => setEditing({ nome: "", comissao: 20, cor: "#9333ea", ativo: true })}>
          <Plus className="h-4 w-4 mr-2" />Novo
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cor</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(deliveries ?? []).map((d) => (
                <TableRow key={d.id} className="cursor-pointer" onClick={() => setEditing(d)}>
                  <TableCell>
                    <div className="h-6 w-6 rounded-full border" style={{ background: d.cor ?? "#9333ea" }} />
                  </TableCell>
                  <TableCell className="font-medium">{d.nome}</TableCell>
                  <TableCell className="text-right">{Number(d.comissao).toFixed(1)}%</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.ativo ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {d.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => setDeleting(d)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(deliveries ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum delivery cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{editing.id ? "Editar Delivery" : "Novo Delivery"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editing.nome ?? ""}
                  onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
                  placeholder="iFood"
                />
              </div>
              <div className="space-y-2">
                <Label>Comissão (%)</Label>
                <Input
                  type="number" step="0.1" min="0" max="99"
                  value={editing.comissao ?? 0}
                  onChange={(e) => setEditing({ ...editing, comissao: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Quanto a plataforma desconta do valor de venda (ex.: 27%)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={editing.cor ?? "#9333ea"}
                  onChange={(e) => setEditing({ ...editing, cor: e.target.value })}
                  className="h-10 w-20 p-1"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={editing.ativo ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, ativo: v })}
                />
                <span className="text-sm">Ativo no catálogo</span>
              </label>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={upsert.isPending}>
                  {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir delivery?</AlertDialogTitle>
            <AlertDialogDescription>
              Remover "{deleting?.nome}"? Não afeta pedidos antigos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { if (deleting) await remove.mutateAsync(deleting.id); setDeleting(null); }}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
