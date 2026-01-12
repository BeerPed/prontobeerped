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

interface Product {
  id: number;
  modelo: string;
  marca: string;
  tipo: string;
  qualidade: string;
  preco: number;
  estoque: "disponivel" | "baixo" | "esgotado";
}

const initialProducts: Product[] = [
  { id: 1, modelo: "iPhone 14 Pro Max", marca: "Apple", tipo: "Tela OLED Original", qualidade: "Original", preco: 1850.00, estoque: "disponivel" },
  { id: 2, modelo: "iPhone 14 Pro", marca: "Apple", tipo: "Tela OLED Original", qualidade: "Original", preco: 1650.00, estoque: "disponivel" },
  { id: 3, modelo: "iPhone 13 Pro Max", marca: "Apple", tipo: "Tela OLED Original", qualidade: "Original", preco: 1450.00, estoque: "baixo" },
  { id: 4, modelo: "iPhone 13", marca: "Apple", tipo: "Tela LCD Incell", qualidade: "Incell", preco: 380.00, estoque: "disponivel" },
  { id: 5, modelo: "iPhone 12 Pro Max", marca: "Apple", tipo: "Tela OLED Original", qualidade: "Original", preco: 1250.00, estoque: "disponivel" },
  { id: 6, modelo: "iPhone 12", marca: "Apple", tipo: "Tela LCD Incell", qualidade: "Incell", preco: 320.00, estoque: "disponivel" },
  { id: 7, modelo: "iPhone 11 Pro Max", marca: "Apple", tipo: "Tela OLED Original", qualidade: "Original", preco: 980.00, estoque: "baixo" },
  { id: 8, modelo: "iPhone 11", marca: "Apple", tipo: "Tela LCD Incell", qualidade: "Incell", preco: 280.00, estoque: "disponivel" },
  { id: 9, modelo: "Galaxy S23 Ultra", marca: "Samsung", tipo: "Tela AMOLED Original", qualidade: "Original", preco: 1980.00, estoque: "disponivel" },
  { id: 10, modelo: "Galaxy S23+", marca: "Samsung", tipo: "Tela AMOLED Original", qualidade: "Original", preco: 1450.00, estoque: "disponivel" },
  { id: 11, modelo: "Galaxy S22 Ultra", marca: "Samsung", tipo: "Tela AMOLED Original", qualidade: "Original", preco: 1350.00, estoque: "esgotado" },
  { id: 12, modelo: "Galaxy A54", marca: "Samsung", tipo: "Tela AMOLED Compatível", qualidade: "Compatível", preco: 420.00, estoque: "disponivel" },
  { id: 13, modelo: "Galaxy A34", marca: "Samsung", tipo: "Tela AMOLED Compatível", qualidade: "Compatível", preco: 350.00, estoque: "disponivel" },
  { id: 14, modelo: "Galaxy A14", marca: "Samsung", tipo: "Tela LCD Compatível", qualidade: "Compatível", preco: 180.00, estoque: "baixo" },
  { id: 15, modelo: "Redmi Note 12 Pro", marca: "Xiaomi", tipo: "Tela AMOLED Original", qualidade: "Original", preco: 380.00, estoque: "disponivel" },
  { id: 16, modelo: "Redmi Note 12", marca: "Xiaomi", tipo: "Tela LCD Compatível", qualidade: "Compatível", preco: 220.00, estoque: "disponivel" },
  { id: 17, modelo: "Poco X5 Pro", marca: "Xiaomi", tipo: "Tela AMOLED Original", qualidade: "Original", preco: 340.00, estoque: "disponivel" },
  { id: 18, modelo: "Moto G73", marca: "Motorola", tipo: "Tela LCD Original", qualidade: "Original", preco: 280.00, estoque: "disponivel" },
  { id: 19, modelo: "Moto G53", marca: "Motorola", tipo: "Tela LCD Compatível", qualidade: "Compatível", preco: 190.00, estoque: "baixo" },
  { id: 20, modelo: "Moto Edge 40", marca: "Motorola", tipo: "Tela AMOLED Original", qualidade: "Original", preco: 650.00, estoque: "disponivel" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const StockBadge = ({ status }: { status: Product["estoque"] }) => {
  const config = {
    disponivel: { label: "Disponível", className: "badge-in-stock" },
    baixo: { label: "Estoque Baixo", className: "badge-low-stock" },
    esgotado: { label: "Esgotado", className: "badge-out-stock" },
  };

  const { label, className } = config[status];

  return <span className={`badge-stock ${className}`}>{label}</span>;
};

export function ProductTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("todas");
  const [qualityFilter, setQualityFilter] = useState<string>("todas");

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(initialProducts.map((p) => p.marca))];
    return uniqueBrands.sort();
  }, []);

  const qualities = useMemo(() => {
    const uniqueQualities = [...new Set(initialProducts.map((p) => p.qualidade))];
    return uniqueQualities.sort();
  }, []);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const matchesSearch =
        product.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tipo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBrand =
        brandFilter === "todas" || product.marca === brandFilter;

      const matchesQuality =
        qualityFilter === "todas" || product.qualidade === qualityFilter;

      return matchesSearch && matchesBrand && matchesQuality;
    });
  }, [searchTerm, brandFilter, qualityFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters Section */}
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
            <SelectTrigger className="w-[160px] bg-card">
              <Smartphone className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Marcas</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={qualityFilter} onValueChange={setQualityFilter}>
            <SelectTrigger className="w-[160px] bg-card">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Qualidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {qualities.map((quality) => (
                <SelectItem key={quality} value={quality}>
                  {quality}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Package className="h-4 w-4" />
        <span>
          {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--table-header))] hover:bg-[hsl(var(--table-header))]">
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold">
                Modelo
              </TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold">
                Marca
              </TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold hidden md:table-cell">
                Tipo
              </TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold hidden sm:table-cell">
                Qualidade
              </TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold text-right">
                Preço
              </TableHead>
              <TableHead className="text-[hsl(var(--table-header-foreground))] font-semibold text-center">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum produto encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product, index) => (
                <TableRow
                  key={product.id}
                  className={`
                    transition-colors hover:bg-[hsl(var(--table-row-hover))]
                    ${index % 2 === 1 ? "bg-[hsl(var(--table-row-alt))]" : ""}
                  `}
                >
                  <TableCell className="font-medium">{product.modelo}</TableCell>
                  <TableCell>{product.marca}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {product.tipo}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs font-medium">
                      {product.qualidade}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatCurrency(product.preco)}
                  </TableCell>
                  <TableCell className="text-center">
                    <StockBadge status={product.estoque} />
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
