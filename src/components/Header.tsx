import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import logo from "@/assets/logo.png";
import { CartButton } from "@/components/CartButton";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={logo} 
              alt="AR Cell Distribuidora" 
              className="h-14 w-auto"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                Catálogo de Produtos
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Peças e Acessórios para Celular
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
