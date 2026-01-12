export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-4">
        <p className="text-center text-sm text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString("pt-BR")} • Preços sujeitos a alteração sem aviso prévio
        </p>
      </div>
    </footer>
  );
}
