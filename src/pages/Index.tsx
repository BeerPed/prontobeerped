import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductTable } from "@/components/ProductTable";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import logo from "@/assets/logo.png";
import logoWatermark from "@/assets/logo-watermark.png";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 relative">
        {/* Marca d'água com logo */}
        <div 
          className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] z-0"
          aria-hidden="true"
        >
          <img 
            src={logoWatermark} 
            alt="" 
            className="w-[70%] max-w-xl h-auto"
          />
        </div>
        
        {/* Conteúdo */}
        <div className="relative z-10">
          <ProductTable />
        </div>
      </main>
      
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
