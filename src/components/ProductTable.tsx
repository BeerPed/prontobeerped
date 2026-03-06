import { useState, useMemo } from "react";
import { Search, Package, Smartphone, Filter, Plus, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal, X, Image } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { products as staticProducts } from "@/data/products";
import logoWatermark from "@/assets/logo-watermark.png";
import { BrandIcon } from "@/components/BrandIcon";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const PAGE_SIZE_OPTIONS = [10, 30, 50];

export function ProductTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("todas");
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
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
      image_url: null as string | null,
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

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, brandFilter, typeFilter, pageSize]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const hasActiveFilters = brandFilter !== "todas" || typeFilter !== "todos";

  const clearFilters = () => {
    setBrandFilter("todas");
    setTypeFilter("todos");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Campo de busca e toggle filtros */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por modelo, marca ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input pl-10 w-full"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0 relative"
          title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        >
          <SlidersHorizontal className="h-5 w-5" />
          {hasActiveFilters && !showFilters && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background" />
          )}
        </Button>
      </div>

      {/* Filtros - Colapsável */}
      {showFilters && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filtros</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground h-7 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* Filtro de Marcas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <span>Marca</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                onClick={() => setBrandFilter("todas")}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  brandFilter === "todas"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-background hover:bg-muted text-foreground border"
                }`}
              >
                Todas
              </button>
              {brands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setBrandFilter(brand)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    brandFilter === brand
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-background hover:bg-muted text-foreground border"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro de Tipos */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Tipo</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                onClick={() => setTypeFilter("todos")}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  typeFilter === "todos"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-background hover:bg-muted text-foreground border"
                }`}
              >
                Todos
              </button>
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    typeFilter === type
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-background hover:bg-muted text-foreground border"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info e controle de paginação superior */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>
            {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Exibir:</span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="table-container relative">
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
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold w-16 hidden sm:table-cell">Imagem</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold">Modelo</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold hidden sm:table-cell">Marca</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold hidden md:table-cell">Tipo</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold text-right">Preço</TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum produto encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product, index) => (
                <TableRow
                  key={product.id}
                  className={`transition-colors hover:bg-[hsl(var(--table-row-hover))] ${index % 2 === 1 ? "bg-[hsl(var(--table-row-alt))]" : ""}`}
                >
                  <TableCell className="hidden sm:table-cell">
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
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <BrandIcon brand={product.marca} />
                      <div>
                        <span>{product.modelo}</span>
                        <span className="block sm:hidden text-xs text-muted-foreground mt-0.5">
                          {product.marca}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <BrandIcon brand={product.marca} />
                      <span>{product.marca}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{product.tipo}</TableCell>
                  <TableCell className="text-right font-semibold text-primary whitespace-nowrap">{product.preco != null ? formatCurrency(product.preco) : "—"}</TableCell>
                  <TableCell className="p-2">
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between sm:justify-center gap-4 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
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
            variant="outline"
            size="sm"
            onClick={handleNextPage}
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
