import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

export function ProductExportButton() {
  const { data: products, isLoading } = useProducts();
  const { toast } = useToast();

  const exportToCSV = () => {
    if (!products || products.length === 0) {
      toast({ title: "Sem dados", variant: "destructive" });
      return;
    }
    const headers = ["Codigo", "Nome", "Categoria", "Custo", "Gelavel"];
    const rows = products.map((p: Product) => [
      `"${(p.codigo ?? "").replace(/"/g, '""')}"`,
      `"${p.nome.replace(/"/g, '""')}"`,
      p.categoria,
      (p.custo ?? 0).toFixed(2).replace(".", ","),
      p.gelavel ? "sim" : "nao",
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `produtos_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Exportação concluída", description: `${products.length} produto(s)` });
  };

  return (
    <Button variant="outline" onClick={exportToCSV} disabled={isLoading}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
      Exportar CSV
    </Button>
  );
}
