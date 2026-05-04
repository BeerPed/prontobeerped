import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LogOut, Loader2, Search, Home, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import {
  useProducts, useCreateProduct, useUpdateProduct,
  CATEGORIAS, type Product, type ProductInsert, type Categoria,
} from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { ProductExportButton } from "@/components/admin/ProductExportButton";
import { ProductImageUpload } from "@/components/admin/ProductImageUpload";
import { EditableProductTable } from "@/components/admin/EditableProductTable";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminLeads } from "@/components/admin/AdminLeads";
import { AdminDeliveries } from "@/components/admin/AdminDeliveries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import defaultLogo from "@/assets/logo-pronto.png";

type FormData = {
  nome: string;
  codigo: string;
  custo: string;
  categoria: Categoria;
  gelavel: boolean;
  ativo: boolean;
  image_url: string | null;
};

const emptyForm: FormData = {
  nome: "", codigo: "", custo: "", categoria: "snacks",
  gelavel: false, ativo: true, image_url: null,
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: siteSettings } = useSiteSettings();
  const logo = siteSettings?.logo_url || defaultLogo;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      toast({ title: "Acesso negado", variant: "destructive" });
      navigate("/");
    }
  }, [authLoading, user, isAdmin, navigate, toast]);

  const filtered = products?.filter((p) => {
    const t = searchTerm.toLowerCase();
    return p.nome.toLowerCase().includes(t) || (p.codigo ?? "").includes(t);
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      nome: p.nome,
      codigo: p.codigo ?? "",
      custo: (p.custo ?? 0).toString(),
      categoria: p.categoria,
      gelavel: p.gelavel,
      ativo: p.ativo,
      image_url: p.image_url ?? null,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: ProductInsert = {
      nome: form.nome,
      codigo: form.codigo || null,
      custo: form.custo ? parseFloat(form.custo.replace(",", ".")) : 0,
      categoria: form.categoria,
      gelavel: form.gelavel,
      ativo: form.ativo,
      image_url: form.image_url,
      preco: null,
    };
    if (editing) {
      await updateProduct.mutateAsync({ id: editing.id, ...data });
    } else {
      await createProduct.mutateAsync(data);
    }
    setIsFormOpen(false);
    setForm(emptyForm);
    setEditing(null);
  };

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Pronto" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Painel Pronto</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Home className="h-4 w-4 mr-2" />Catálogo
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/login"); }}>
              <LogOut className="h-4 w-4 mr-2" />Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="produtos">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            <TabsTrigger value="crm">CRM / Leads</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="produtos" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <ProductExportButton />
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />Novo Produto
                </Button>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <EditableProductTable
                products={filtered || []}
                isLoading={productsLoading}
                onEdit={openEdit}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {filtered?.length ?? 0} produto(s)
            </p>
          </TabsContent>

          <TabsContent value="deliveries" className="mt-4">
            <AdminDeliveries />
          </TabsContent>

          <TabsContent value="crm" className="mt-4">
            <AdminLeads />
          </TabsContent>

          <TabsContent value="config" className="mt-4">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription>
              Preencha os dados. O preço final é calculado a partir do custo + margem global − comissão do delivery.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Imagem</Label>
                <ProductImageUpload
                  currentImageUrl={form.image_url}
                  onImageChange={(url) => setForm({ ...form, image_url: url })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código de barras</Label>
                  <Input id="codigo" value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custo">Custo (R$) *</Label>
                  <Input id="custo" type="text" value={form.custo}
                    onChange={(e) => setForm({ ...form, custo: e.target.value })}
                    placeholder="0,00" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(v) => setForm({ ...form, categoria: v as Categoria })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.emoji} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={form.gelavel}
                    onCheckedChange={(v) => setForm({ ...form, gelavel: v })}
                  />
                  <span className="text-sm">❄️ Pode ser gelado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={form.ativo}
                    onCheckedChange={(v) => setForm({ ...form, ativo: v })}
                  />
                  <span className="text-sm">Visível no catálogo</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {(createProduct.isPending || updateProduct.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editing ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
