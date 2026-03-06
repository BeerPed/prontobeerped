import { useState } from "react";
import { Check, X, Pencil, Trash2, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  type Product,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useProducts";
import logoWatermark from "@/assets/logo-watermark.png";

interface EditableProductTableProps {
  products: Product[];
  isLoading: boolean;
  onOpenCreate: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function EditableProductTable({
  products,
  isLoading,
  onOpenCreate,
}: EditableProductTableProps) {
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    modelo: string;
    marca: string;
    tipo: string;
    preco: string;
  } | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const handleStartEdit = (product: Product) => {
    setEditingId(product.id);
    setEditData({
      modelo: product.modelo,
      marca: product.marca,
      tipo: product.tipo,
      preco: product.preco != null ? product.preco.toString() : "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editData) return;

    await updateProduct.mutateAsync({
      id: editingId,
      modelo: editData.modelo,
      marca: editData.marca,
      tipo: editData.tipo,
      preco: editData.preco ? parseFloat(editData.preco.replace(",", ".")) : null,
    });

    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = async () => {
    if (deletingProduct) {
      await deleteProduct.mutateAsync(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
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
      <div className="relative">
        {/* Watermark overlay para proteção contra cópias */}
        <div 
          className="absolute inset-0 pointer-events-none flex items-center justify-center z-10"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${logoWatermark})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px auto',
            backgroundPosition: 'center',
            opacity: 0.06,
          }}
        />
        
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--table-header))] hover:bg-[hsl(var(--table-header))]">
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold w-16">Imagem</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold">Modelo</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold">Marca</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold hidden sm:table-cell">Tipo</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold text-right">Preço</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold text-right w-28">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              products.map((product, index) => {
                const isEditing = editingId === product.id;

                return (
                  <TableRow 
                    key={product.id} 
                    className={`transition-colors ${isEditing ? "bg-accent/30" : ""} ${!isEditing && index % 2 === 1 ? "bg-[hsl(var(--table-row-alt))]" : ""} hover:bg-[hsl(var(--table-row-hover))]`}
                  >
                    <TableCell>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.modelo}
                          className="h-10 w-10 object-cover rounded"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                          <Image className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData?.modelo || ""}
                          onChange={(e) =>
                            setEditData({ ...editData!, modelo: e.target.value })
                          }
                          onKeyDown={handleKeyDown}
                          className="h-8"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium">{product.modelo}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData?.marca || ""}
                          onChange={(e) =>
                            setEditData({ ...editData!, marca: e.target.value })
                          }
                          onKeyDown={handleKeyDown}
                          className="h-8"
                        />
                      ) : (
                        product.marca
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {isEditing ? (
                        <Input
                          value={editData?.tipo || ""}
                          onChange={(e) =>
                            setEditData({ ...editData!, tipo: e.target.value })
                          }
                          onKeyDown={handleKeyDown}
                          className="h-8"
                        />
                      ) : (
                        <span className="text-muted-foreground">{product.tipo}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          value={editData?.preco || ""}
                          onChange={(e) =>
                            setEditData({ ...editData!, preco: e.target.value })
                          }
                          onKeyDown={handleKeyDown}
                          className="h-8 w-24 ml-auto text-right"
                          placeholder="0.00"
                        />
                      ) : (
                        <span className="font-semibold text-primary">
                          {product.preco != null ? formatCurrency(product.preco) : "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                              onClick={handleSaveEdit}
                              disabled={updateProduct.isPending}
                            >
                              {updateProduct.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleStartEdit(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingProduct(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{deletingProduct?.modelo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
