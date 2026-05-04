import { useState } from "react";
import { Pencil, Trash2, Image as ImageIcon, Loader2, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type Product, useDeleteProduct, CATEGORIAS } from "@/hooks/useProducts";

interface Props {
  products: Product[];
  isLoading: boolean;
  onEdit: (p: Product) => void;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function EditableProductTable({ products, isLoading, onEdit }: Props) {
  const deleteProduct = useDeleteProduct();
  const [deleting, setDeleting] = useState<Product | null>(null);

  const handleDelete = async () => {
    if (deleting) {
      await deleteProduct.mutateAsync(deleting.id);
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-[hsl(var(--table-header))] hover:bg-[hsl(var(--table-header))]">
            <TableHead className="text-[hsl(var(--table-header-foreground))] w-16">Img</TableHead>
            <TableHead className="text-[hsl(var(--table-header-foreground))]">Nome</TableHead>
            <TableHead className="text-[hsl(var(--table-header-foreground))] hidden sm:table-cell">Código</TableHead>
            <TableHead className="text-[hsl(var(--table-header-foreground))] hidden md:table-cell">Categoria</TableHead>
            <TableHead className="text-[hsl(var(--table-header-foreground))] text-right">Custo</TableHead>
            <TableHead className="text-[hsl(var(--table-header-foreground))] text-right w-28">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                Nenhum produto
              </TableCell>
            </TableRow>
          ) : (
            products.map((p, i) => {
              const cat = CATEGORIAS.find((c) => c.value === p.categoria);
              return (
                <TableRow key={p.id} className={i % 2 === 1 ? "bg-[hsl(var(--table-row-alt))]" : ""}>
                  <TableCell>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.nome} className="h-10 w-10 object-cover rounded" />
                    ) : (
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium flex items-center gap-1">
                      {p.nome}
                      {p.gelavel && <Snowflake className="h-3.5 w-3.5 text-blue-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">{p.codigo}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm">{cat?.emoji} {cat?.label}</span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {fmt(p.custo ?? 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleting(p)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir "{deleting?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
