import logo from "@/assets/logo.png";

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <img 
            src={logo} 
            alt="AR Cell Distribuidora" 
            className="h-16 w-auto"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Catálogo de Produtos
            </h1>
            <p className="text-sm text-muted-foreground">
              Peças e Acessórios para Celular
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
