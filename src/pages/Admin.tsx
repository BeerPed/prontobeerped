import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout, type AdminSection } from "@/components/admin/AdminLayout";
import { AdminDashboard } from "@/components/admin/sections/AdminDashboard";
import { AdminProdutos } from "@/components/admin/sections/AdminProdutos";
import { AdminDeliveriesSection } from "@/components/admin/sections/AdminDeliveriesSection";
import { AdminPrecificacao } from "@/components/admin/sections/AdminPrecificacao";
import { AdminSimulador } from "@/components/admin/sections/AdminSimulador";
import { AdminCardapio } from "@/components/admin/sections/AdminCardapio";
import { AdminPedidos } from "@/components/admin/sections/AdminPedidos";
import { AdminCRMSection } from "@/components/admin/sections/AdminCRMSection";
import { AdminEstoque } from "@/components/admin/sections/AdminEstoque";
import { AdminConfigSection } from "@/components/admin/sections/AdminConfigSection";

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const [section, setSection] = useState<AdminSection>("dashboard");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      toast({ title: "Acesso negado", variant: "destructive" });
      navigate("/");
    }
  }, [authLoading, user, isAdmin, navigate, toast]);

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const renderSection = () => {
    switch (section) {
      case "dashboard":    return <AdminDashboard />;
      case "produtos":     return <AdminProdutos />;
      case "deliveries":   return <AdminDeliveriesSection />;
      case "precificacao": return <AdminPrecificacao />;
      case "simulador":    return <AdminSimulador />;
      case "cardapio":     return <AdminCardapio />;
      case "pedidos":      return <AdminPedidos />;
      case "crm":          return <AdminCRMSection />;
      case "estoque":      return <AdminEstoque />;
      default:             return <AdminConfigSection />;
    }
  };

  return (
    <AdminLayout activeSection={section} onSectionChange={setSection}>
      {renderSection()}
    </AdminLayout>
  );
}
