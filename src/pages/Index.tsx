import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductTable } from "@/components/ProductTable";
import logoWatermark from "@/assets/logo-pronto.png";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 relative">
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04] z-0"
          aria-hidden="true"
        >
          <img src={logoWatermark} alt="" className="w-[60%] max-w-md h-auto" />
        </div>
        <div className="relative z-10">
          <ProductTable />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
