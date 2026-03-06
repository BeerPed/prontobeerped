import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

export function ProductExportButton() {
  const { data: products, isLoading } = useProducts();
  const { toast } = useToast();

  const exportToCSV = () => {
    if (!products || products.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há produtos para exportar.",
        variant: "destructive",
      });
      return;
    }

    // CSV headers
    const headers = ["Modelo", "Marca", "Tipo", "Preço"];
    
    // CSV rows
    const rows = products.map((p: Product) => [
      `"${p.modelo.replace(/"/g, '""')}"`,
      `"${p.marca.replace(/"/g, '""')}"`,
      `"${p.tipo.replace(/"/g, '""')}"`,
      p.preco != null ? p.preco.toFixed(2).replace(".", ",") : "",
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
    ].join("\n");

    // Add BOM for Excel compatibility with UTF-8
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `produtos_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: `${products.length} produto(s) exportado(s) para CSV.`,
    });
  };

  return (
    <Button variant="outline" onClick={exportToCSV} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Exportar CSV
    </Button>
  );
}
