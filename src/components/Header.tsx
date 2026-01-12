import { Smartphone } from "lucide-react";

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Catálogo de Telas
            </h1>
            <p className="text-sm text-muted-foreground">
              Distribuidora de Peças para Celular
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
