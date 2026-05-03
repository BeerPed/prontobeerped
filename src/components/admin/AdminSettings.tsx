import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
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

  const handleUpload = async (file: File, kind: "logo" | "bg") => {
    if (!settings) return;
    setUploading(kind);
    try {
      const url = await uploadAsset(file, kind);
      await updateSettings.mutateAsync({
        id: settings.id,
        ...(kind === "logo" ? { logo_url: url } : { login_bg_url: url }),
      });
      toast({ title: "Imagem atualizada com sucesso" });
    } catch (e: any) {
      toast({ title: "Erro ao enviar imagem", description: e.message, variant: "destructive" });
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>Substitui o logo padrão do sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-muted rounded flex items-center justify-center overflow-hidden">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo atual" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-sm text-muted-foreground">Usando logo padrão</span>
            )}
          </div>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "logo")}
          />
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
          <CardDescription>Aparece ao lado do formulário de login.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-muted rounded flex items-center justify-center overflow-hidden">
            {settings?.login_bg_url ? (
              <img src={settings.login_bg_url} alt="Fundo do login" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm text-muted-foreground">Nenhuma imagem definida</span>
            )}
          </div>
          <input
            ref={bgRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "bg")}
          />
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
  );
}
