import { useState, useRef } from "react";
import { Plus, Search, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useProducts, useCreateProduct, useUpdateProduct, CATEGORIAS, type Product, type ProductInsert, type Categoria } from "@/hooks/useProducts";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAllProductDeliveries, useToggleProductDelivery } from "@/hooks/useProductDeliveries";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { calcPrecoFinal } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

type FormData = {
  nome: string; codigo: string; custo: string;
  categoria: Categoria; gelavel: boolean; ativo: boolean; image_url: string | null;
};
const emptyForm: FormData = { nome: "", codigo: "", custo: "", categoria: "snacks", gelavel: false, ativo: true, image_url: null };

function DeliveryToggle({ productId, deliveryId, deliveryName, deliveryCor, active }: {
  productId: string; deliveryId: string; deliveryName: string; deliveryCor: string; active: boolean;
}) {
  const toggle = useToggleProductDelivery();
  return (
    <button
      onClick={() => toggle.mutate({ product_id: productId, delivery_id: deliveryId, ativo: !active })}
      title={`${active ? "Desativar" : "Ativar"} no ${deliveryName}`}
      className={`rounded-md px-2 py-1 text-xs font-semibold border transition-all ${
        active
          ? "text-white border-transparent opacity-100"
          : "bg-transparent text-white/30 border-white/10 opacity-60 hover:opacity-80"
      }`}
      style={active ? { background: deliveryCor, borderColor: deliveryCor } : {}}
    >
      {deliveryName}
    </button>
  );
}

function ProductRow({ product, deliveries, pdMap, margemPadrao, onEdit }: {
  product: Product;
  deliveries: any[];
  pdMap: Map<string, { ativo: boolean; margem: number | null }>;
  margemPadrao: number;
  onEdit: (p: Product) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b border-white/5 hover:bg-white/3 transition-colors">
        <td className="px-4 py-3">
          <span className="text-white/40 text-xs font-mono">{product.codigo || "—"}</span>
        </td>
        <td className="px-4 py-3">
          <button onClick={() => onEdit(product)} className="text-white/90 font-medium hover:text-amber-400 text-left">
            {product.nome}
          </button>
        </td>
        <td className="px-4 py-3">
          <span className="text-white/50 text-xs">{CATEGORIAS.find(c => c.value === product.categoria)?.emoji} {product.categoria}</span>
        </td>
        <td className="px-4 py-3 text-white/70 text-sm font-mono">R$ {Number(product.custo ?? 0).toFixed(2)}</td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {deliveries.map(d => {
              const key = `${product.id}:${d.id}`;
              const pd = pdMap.get(key);
              return (
                <DeliveryToggle
                  key={d.id}
                  productId={product.id}
                  deliveryId={d.id}
                  deliveryName={d.nome}
                  deliveryCor={d.cor ?? "#9333ea"}
                  active={pd?.ativo ?? false}
                />
              );
            })}
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <button onClick={() => setExpanded(e => !e)} className="text-white/40 hover:text-white/80">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-white/5 bg-[#1a1d27]/60">
          <td colSpan={6} className="px-6 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {deliveries.map(d => {
                const key = `${product.id}:${d.id}`;
                const pd = pdMap.get(key);
                const isAtivo = pd?.ativo ?? false;
                const margem = pd?.margem ?? margemPadrao;
                const preco = calcPrecoFinal(product.custo ?? 0, margem, d.comissao ?? 0);
                const lucro = preco - (product.custo ?? 0);
                return (
                  <div key={d.id} className={`rounded-lg border p-3 ${isAtivo ? "border-white/10 bg-white/5" : "border-white/5 bg-transparent opacity-50"}`}>
                    <p className="text-white/70 text-xs font-semibold mb-1">{d.nome}</p>
                    <p className="text-white font-bold">R$ {preco.toFixed(2)}</p>
                    <p className={`text-xs mt-0.5 ${lucro >= 0 ? "text-green-400" : "text-red-400"}`}>
                      Lucro: R$ {lucro.toFixed(2)}
                    </p>
                    <p className="text-white/30 text-xs">Margem: {margem}%</p>
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function AdminProdutos() {
  const { data: products = [], isLoading } = useProducts();
  const { data: deliveries = [] } = useDeliveries();
  const { data: pdAll = [] } = useAllProductDeliveries();
  const { data: settings } = useSiteSettings();
  const margemPadrao = (settings as any)?.margem_padrao ?? 30;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const fileRef = useRef<HTMLInputElement>(null);

  const pdMap = new Map(pdAll.map(pd => [`${pd.product_id}:${pd.delivery_id}`, { ativo: pd.ativo, margem: pd.margem }]));

  const filtered = products.filter(p => {
    const t = search.toLowerCase();
    return p.nome.toLowerCase().includes(t) || (p.codigo ?? "").includes(t);
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setIsFormOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ nome: p.nome, codigo: p.codigo ?? "", custo: (p.custo ?? 0).toString(), categoria: p.categoria, gelavel: p.gelavel, ativo: p.ativo, image_url: p.image_url ?? null });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: ProductInsert = {
      nome: form.nome, codigo: form.codigo || null,
      custo: form.custo ? parseFloat(form.custo.replace(",", ".")) : 0,
      categoria: form.categoria, gelavel: form.gelavel, ativo: form.ativo,
      image_url: form.image_url, preco: null,
    };
    if (editing) await updateProduct.mutateAsync({ id: editing.id, ...data });
    else await createProduct.mutateAsync(data);
    setIsFormOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);
        let imported = 0;
        for (const row of rows) {
          const nome = row["nome"] || row["Nome"] || row["NOME"] || "";
          const custo = parseFloat(String(row["custo"] || row["Custo"] || row["CUSTO"] || "0").replace(",", "."));
          const codigo = String(row["codigo"] || row["Codigo"] || row["CODIGO"] || row["código"] || "");
          const categoria = (row["categoria"] || row["Categoria"] || "snacks") as Categoria;
          if (!nome) continue;
          await createProduct.mutateAsync({ nome, custo: isNaN(custo) ? 0 : custo, codigo: codigo || null, categoria, gelavel: false, ativo: true, image_url: null, preco: null });
          imported++;
        }
        toast({ title: `${imported} produto(s) importado(s)` });
      } catch (err: any) {
        toast({ title: "Erro ao importar", description: err.message, variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Produtos</h1>
          <p className="text-white/40 text-sm">{filtered.length} produto(s)</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:text-white bg-transparent" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />Importar Planilha
          </Button>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />Novo Produto
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou código..." className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1a1d27] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/40 font-medium px-4 py-3">Código</th>
                <th className="text-left text-white/40 font-medium px-4 py-3">Nome</th>
                <th className="text-left text-white/40 font-medium px-4 py-3">Categoria</th>
                <th className="text-left text-white/40 font-medium px-4 py-3">Custo</th>
                <th className="text-left text-white/40 font-medium px-4 py-3">Deliveries</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center text-white/40 py-10">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-white/40 py-10">Nenhum produto encontrado</td></tr>
              ) : filtered.map(p => (
                <ProductRow key={p.id} product={p} deliveries={deliveries} pdMap={pdMap} margemPadrao={margemPadrao} onEdit={openEdit} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-[#1a1d27] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-white/70">Nome *</Label>
                <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-white/70">Código de barras</Label>
                <Input value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-white/70">Custo (R$) *</Label>
                <Input value={form.custo} onChange={e => setForm({...form, custo: e.target.value})} placeholder="0,00" required className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-white/70">Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setForm({...form, categoria: v as Categoria})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.gelavel} onCheckedChange={v => setForm({...form, gelavel: v})} />
                <span className="text-sm text-white/70">❄️ Gelável</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.ativo} onCheckedChange={v => setForm({...form, ativo: v})} />
                <span className="text-sm text-white/70">Visível no catálogo</span>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-white/10 text-white/70">Cancelar</Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                {editing ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
