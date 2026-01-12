import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductTable } from "@/components/ProductTable";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <ProductTable />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
