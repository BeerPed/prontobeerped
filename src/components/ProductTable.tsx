import { useState, useMemo } from "react";
import { Search, Package, Smartphone, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { products } from "@/data/products";

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

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map((p) => p.marca))];
    return uniqueBrands.sort();
  }, []);

  const types = useMemo(() => {
    const uniqueTypes = [...new Set(products.map((p) => p.tipo))];
    return uniqueTypes.sort();
  }, []);

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
  }, [searchTerm, brandFilter, typeFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por modelo, marca ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input pl-10"
          />
        </div>

        <div className="flex gap-3">
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[140px] bg-card">
              <Smartphone className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] bg-card">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
