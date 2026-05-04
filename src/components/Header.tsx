import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import defaultLogo from "@/assets/logo-pronto.png";
import { CartButton } from "@/components/CartButton";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function Header() {
  const { data: settings } = useSiteSettings();
  const logo = settings?.logo_url || defaultLogo;
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="Pronto" className="h-12 w-auto" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                Pronto
              </h1>
              <p className="text-xs text-muted-foreground leading-tight">
                Seu mercado aqui, sempre!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CartButton />
            <Link to="/login">
              <Button variant="ghost" size="icon" title="Área Administrativa">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
