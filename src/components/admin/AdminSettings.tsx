import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/useSiteSettings";
import { useToast } from "@/hooks/use-toast";

async function uploadAsset(file: File, prefix: string): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("site-assets")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  return data.publicUrl;
}

export function AdminSettings() {
  const { data: settings } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  const { toast } = useToast();
  const logoRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"logo" | "bg" | null>(null);
  const [margem, setMargem] = useState<string>("30");

  useEffect(() => {
    if (settings) setMargem(String(settings.margem_padrao ?? 30));
  }, [settings]);

  const handleUpload = async (file: File, kind: "logo" | "bg") => {
    if (!settings) return;
    setUploading(kind);
    try {
      const url = await uploadAsset(file, kind);
      await updateSettings.mutateAsync({
        id: settings.id,
        ...(kind === "logo" ? { logo_url: url } : { login_bg_url: url }),
      });
      toast({ title: "Imagem atualizada" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const handleClear = async (kind: "logo" | "bg") => {
    if (!settings) return;
    await updateSettings.mutateAsync({
      id: settings.id,
      ...(kind === "logo" ? { logo_url: null } : { login_bg_url: null }),
    });
    toast({ title: "Imagem removida" });
  };

  const handleSaveMargem = async () => {
    if (!settings) return;
    const v = parseFloat(margem.replace(",", "."));
    if (isNaN(v) || v < 0) {
      toast({ title: "Margem inválida", variant: "destructive" });
      return;
    }
    await updateSettings.mutateAsync({ id: settings.id, margem_padrao: v });
    toast({ title: "Margem atualizada", description: `${v}% aplicada a todos os produtos` });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Margem de Lucro
          </CardTitle>
          <CardDescription>
            Margem (%) aplicada sobre o custo de cada produto. Em seguida o sistema
            aumenta o preço final para compensar a comissão da plataforma de delivery
            escolhida pelo cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 max-w-sm">
            <div className="flex-1 space-y-2">
              <Label htmlFor="margem">Margem padrão (%)</Label>
              <Input
                id="margem" type="number" step="0.1" min="0"
                value={margem}
                onChange={(e) => setMargem(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveMargem} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg text-xs space-y-1 max-w-md">
            <p className="font-semibold">Exemplo de cálculo:</p>
            <p>Custo: R$ 5,00 → margem 30% → R$ 6,50</p>
            <p>Comissão iFood (27%) → preço exibido: R$ 8,90</p>
            <p className="text-muted-foreground">A margem real após comissão segue 30%</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>Substitui o logo padrão do app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded flex items-center justify-center overflow-hidden">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo atual" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-sm text-muted-foreground">Usando logo padrão (Pronto)</span>
              )}
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "logo")} />
            <div className="flex gap-2">
              <Button onClick={() => logoRef.current?.click()} disabled={uploading === "logo"}>
                {uploading === "logo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Enviar Logo
              </Button>
              {settings?.logo_url && (
                <Button variant="outline" onClick={() => handleClear("logo")}>Remover</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagem da tela de login</CardTitle>
            <CardDescription>Sobrepõe o storytelling no lado esquerdo do login.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded flex items-center justify-center overflow-hidden">
              {settings?.login_bg_url ? (
                <img src={settings.login_bg_url} alt="Fundo do login" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-muted-foreground">Mostrando storytelling padrão</span>
              )}
            </div>
            <input ref={bgRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "bg")} />
            <div className="flex gap-2">
              <Button onClick={() => bgRef.current?.click()} disabled={uploading === "bg"}>
                {uploading === "bg" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Enviar Imagem
              </Button>
              {settings?.login_bg_url && (
                <Button variant="outline" onClick={() => handleClear("bg")}>Remover</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
