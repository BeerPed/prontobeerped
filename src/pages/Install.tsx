import { useState, useEffect } from "react";
import { Download, Smartphone, Share, MoreVertical, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-pronto.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-2xl">
              <img src={logo} alt="AR Cell" className="h-20 w-auto" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Instalar AR Cell</CardTitle>
            <CardDescription>
              Tenha acesso rápido ao catálogo direto do seu celular
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 text-green-600 p-4 rounded-full">
                  <Check className="h-8 w-8" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">App Instalado!</h3>
                <p className="text-muted-foreground text-sm">
                  O catálogo AR Cell já está na sua tela inicial
                </p>
              </div>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-center">Como instalar no iPhone:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <Share className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">1. Toque no ícone Compartilhar</p>
                    <p className="text-muted-foreground">Na barra inferior do Safari</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">2. Adicionar à Tela de Início</p>
                    <p className="text-muted-foreground">Role para baixo e selecione</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">3. Toque em Adicionar</p>
                    <p className="text-muted-foreground">O app aparecerá na sua tela inicial</p>
                  </div>
                </div>
              </div>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-primary/10 text-primary p-4 rounded-full">
                  <Download className="h-8 w-8" />
                </div>
              </div>
              <Button onClick={handleInstall} size="lg" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Instalar Agora
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Funciona offline • Acesso rápido • Sem ocupar espaço
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-center">Como instalar no Android:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <MoreVertical className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">1. Toque no menu (⋮)</p>
                    <p className="text-muted-foreground">No canto superior do navegador</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">2. Instalar aplicativo</p>
                    <p className="text-muted-foreground">Ou "Adicionar à tela inicial"</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">3. Confirme a instalação</p>
                    <p className="text-muted-foreground">O app aparecerá na sua tela inicial</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3 text-center">Vantagens do App:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Acesso rápido pelo celular
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Funciona mesmo offline
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Não ocupa espaço no celular
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Sempre atualizado automaticamente
              </li>
            </ul>
          </div>

          <Link to="/" className="block">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Catálogo
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
