import { useState, useMemo } from "react";
import { Search, Package, Smartphone, Filter, Plus, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { products as staticProducts } from "@/data/products";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function ProductTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("todas");
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  
  const { data: dbProducts, isLoading } = useProducts();
  const { addToCart } = useCart();

  // Use database products if available, otherwise fallback to static
  const products = useMemo(() => {
    if (dbProducts && dbProducts.length > 0) {
      return dbProducts;
    }
    // Convert static products to match database format
    return staticProducts.map((p) => ({
      ...p,
      id: p.id.toString(),
    }));
  }, [dbProducts]);

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map((p) => p.marca))];
    return uniqueBrands.sort();
  }, [products]);

  const types = useMemo(() => {
    const uniqueTypes = [...new Set(products.map((p) => p.tipo))];
    return uniqueTypes.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tipo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBrand =
        brandFilter === "todas" || product.marca === brandFilter;

      const matchesType =
        typeFilter === "todos" || product.tipo === typeFilter;

      return matchesSearch && matchesBrand && matchesType;
    });
  }, [products, searchTerm, brandFilter, typeFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por modelo, marca ou tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input pl-10"
        />
      </div>

      {/* Filtro de Marcas - Horizontal */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Smartphone className="h-4 w-4" />
          <span>Marca</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setBrandFilter("todas")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              brandFilter === "todas"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
          >
            Todas
          </button>
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setBrandFilter(brand)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                brandFilter === brand
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro de Tipos - Horizontal */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Tipo</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter("todos")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              typeFilter === "todos"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
          >
            Todos
          </button>
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                typeFilter === type
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Package className="h-4 w-4" />
        <span>
          {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--table-header))] hover:bg-[hsl(var(--table-header))]">
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold">Modelo</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold">Marca</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold hidden sm:table-cell">Tipo</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold text-right">Preço</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum produto encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product, index) => (
                <TableRow
                  key={product.id}
                  className={`transition-colors hover:bg-[hsl(var(--table-row-hover))] ${index % 2 === 1 ? "bg-[hsl(var(--table-row-alt))]" : ""}`}
                >
                  <TableCell className="font-medium">{product.modelo}</TableCell>
                  <TableCell>{product.marca}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{product.tipo}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{formatCurrency(product.preco)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => addToCart(product)}
                      title="Adicionar ao pedido"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
