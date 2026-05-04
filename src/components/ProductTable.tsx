import { useState, useMemo } from "react";
import { Search, Package, Plus, Loader2, ChevronLeft, ChevronRight, Image as ImageIcon, Snowflake, Sun } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useProducts, calcPrecoFinal, CATEGORIAS, type Categoria } from "@/hooks/useProducts";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCart } from "@/contexts/CartContext";
import logoWatermark from "@/assets/logo-pronto.png";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const PAGE_SIZE_OPTIONS = [10, 30, 50];

export function ProductTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"todas" | Categoria>("todas");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deliveryId, setDeliveryId] = useState<string>("");

  const { data: products, isLoading } = useProducts();
  const { data: deliveries } = useDeliveries();
  const { data: settings } = useSiteSettings();
  const { addToCart } = useCart();

  const activeDeliveries = useMemo(() => (deliveries ?? []).filter((d) => d.ativo), [deliveries]);
  const selectedDelivery = activeDeliveries.find((d) => d.id === deliveryId) ?? activeDeliveries[0];
  const margem = settings?.margem_padrao ?? 30;
  const comissao = selectedDelivery?.comissao ?? 0;

  const list = products ?? [];

  const filtered = useMemo(() => {
    return list.filter((p) => {
      const matchSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.codigo ?? "").includes(searchTerm);
      const matchCat = categoryFilter === "todas" || p.categoria === categoryFilter;
      return matchSearch && matchCat && p.ativo;
    });
  }, [list, searchTerm, categoryFilter]);

  useMemo(() => setCurrentPage(1), [searchTerm, categoryFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Seletor de Delivery */}
      {activeDeliveries.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                Pedindo pelo
              </p>
              <p className="text-sm text-muted-foreground">
                Os preços são ajustados conforme a plataforma escolhida
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeDeliveries.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDeliveryId(d.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all border-2 ${
                    (selectedDelivery?.id === d.id)
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-background border-border text-foreground hover:border-primary/40"
                  }`}
                  style={
                    selectedDelivery?.id === d.id && d.cor
                      ? { backgroundColor: d.cor, borderColor: d.cor, color: "#fff" }
                      : undefined
                  }
                >
                  {d.nome}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar produto ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input pl-10 w-full"
        />
      </div>

      {/* Filtro de Categorias */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <button
          onClick={() => setCategoryFilter("todas")}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
            categoryFilter === "todas"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-background hover:bg-muted text-foreground border"
          }`}
        >
          🛍️ Todos
        </button>
        {CATEGORIAS.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategoryFilter(c.value)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
              categoryFilter === c.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-background hover:bg-muted text-foreground border"
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Info + page size */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>
            {filtered.length} produto{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Exibir:</span>
          <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="table-container relative">
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center z-10"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${logoWatermark})`,
            backgroundRepeat: "repeat",
            backgroundSize: "200px auto",
            backgroundPosition: "center",
            opacity: 0.05,
          }}
        />
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--table-header))] hover:bg-[hsl(var(--table-header))]">
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold w-16 hidden sm:table-cell">Imagem</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold">Produto</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold hidden md:table-cell">Categoria</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold text-right">Preço</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum produto encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((p, i) => {
                const precoFinal = calcPrecoFinal(p.custo, margem, comissao);
                const cat = CATEGORIAS.find((c) => c.value === p.categoria);
                return (
                  <TableRow
                    key={p.id}
                    className={`transition-colors hover:bg-[hsl(var(--table-row-hover))] ${
                      i % 2 === 1 ? "bg-[hsl(var(--table-row-alt))]" : ""
                    }`}
                  >
                    <TableCell className="hidden sm:table-cell">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.nome} className="h-10 w-10 object-cover rounded" />
                      ) : (
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{cat?.emoji}</span>
                        <div>
                          <span>{p.nome}</span>
                          <span className="block sm:hidden text-xs text-muted-foreground mt-0.5">
                            {cat?.label}
                            {p.gelavel && (
                              <span className="ml-1 inline-flex items-center gap-0.5 text-blue-500">
                                <Snowflake className="h-3 w-3" /> gelável
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        {cat?.label}
                        {p.gelavel && <Snowflake className="h-3.5 w-3.5 text-blue-500" />}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary whitespace-nowrap">
                      {precoFinal > 0 ? fmt(precoFinal) : "—"}
                    </TableCell>
                    <TableCell className="p-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => addToCart(p, precoFinal)}
                        title="Adicionar ao pedido"
                        disabled={precoFinal <= 0}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between sm:justify-center gap-4 pt-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Página</span>
            <span className="font-medium">{currentPage}</span>
            <span className="text-muted-foreground">de</span>
            <span className="font-medium">{totalPages}</span>
          </div>
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
