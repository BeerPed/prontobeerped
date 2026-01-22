import { useState, useRef } from "react";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedProduct {
  modelo: string;
  marca: string;
  tipo: string;
  preco: number;
}

interface ImportResult {
  success: number;
  errors: string[];
}

export function ProductImportDialog({ open, onOpenChange }: ProductImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resetState = () => {
    setFile(null);
    setParsedProducts([]);
    setImportResult(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const parseCSV = (text: string): ParsedProduct[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Detect separator (comma or semicolon)
    const header = lines[0].toLowerCase();
    const separator = header.includes(";") ? ";" : ",";

    const headers = lines[0].split(separator).map((h) => h.trim().toLowerCase());

    // Find column indices
    const modeloIdx = headers.findIndex((h) => h.includes("modelo") || h === "model");
    const marcaIdx = headers.findIndex((h) => h.includes("marca") || h === "brand");
    const tipoIdx = headers.findIndex((h) => h.includes("tipo") || h === "type");
    const precoIdx = headers.findIndex((h) => h.includes("preco") || h.includes("preço") || h === "price");

    if (modeloIdx === -1 || marcaIdx === -1 || tipoIdx === -1 || precoIdx === -1) {
      throw new Error("Colunas obrigatórias não encontradas. Use: modelo, marca, tipo, preco");
    }

    const products: ParsedProduct[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map((v) => v.trim().replace(/^"|"$/g, ""));
      
      if (values.length < 4) continue;

      const modelo = values[modeloIdx];
      const marca = values[marcaIdx];
      const tipo = values[tipoIdx];
      const precoStr = values[precoIdx].replace(",", ".").replace(/[^\d.]/g, "");
      const preco = parseFloat(precoStr);

      if (modelo && marca && tipo && !isNaN(preco) && preco > 0) {
        products.push({ modelo, marca, tipo, preco });
      }
    }

    return products;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    try {
      const text = await selectedFile.text();
      const products = parseCSV(text);
      setParsedProducts(products);

      if (products.length === 0) {
        toast({
          title: "Arquivo vazio",
          description: "Nenhum produto válido encontrado no arquivo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao ler arquivo",
        description: error instanceof Error ? error.message : "Formato de arquivo inválido",
        variant: "destructive",
      });
      setParsedProducts([]);
    }
  };

  const handleImport = async () => {
    if (parsedProducts.length === 0) return;

    setIsLoading(true);
    const result: ImportResult = { success: 0, errors: [] };

    // Import in batches of 50
    const batchSize = 50;
    for (let i = 0; i < parsedProducts.length; i += batchSize) {
      const batch = parsedProducts.slice(i, i + batchSize);
      
      const { error } = await supabase.from("products").insert(batch);

      if (error) {
        result.errors.push(`Lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        result.success += batch.length;
      }
    }

    setIsLoading(false);
    setImportResult(result);

    if (result.success > 0) {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Importação concluída",
        description: `${result.success} produto(s) importado(s) com sucesso.`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Produtos
          </DialogTitle>
          <DialogDescription>
            Importe produtos em massa a partir de um arquivo CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setParsedProducts([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Remover
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Selecionar Arquivo CSV
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Colunas: modelo, marca, tipo, preco
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          {parsedProducts.length > 0 && !importResult && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>{parsedProducts.length}</strong> produto(s) encontrado(s) no arquivo.
                <br />
                <span className="text-xs text-muted-foreground">
                  Clique em "Importar" para adicionar ao catálogo.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="space-y-2">
              {importResult.success > 0 && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {importResult.success} produto(s) importado(s) com sucesso!
                  </AlertDescription>
                </Alert>
              )}
              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Erros: {importResult.errors.join(", ")}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {importResult ? "Fechar" : "Cancelar"}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={isLoading || parsedProducts.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {parsedProducts.length} produto(s)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
