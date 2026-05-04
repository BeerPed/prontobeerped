export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-4">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Pronto. Seu mercado aqui, sempre!
        </p>
      </div>
    </footer>
  );
}
