import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, Truck, DollarSign, Calculator,
  BookOpen, ShoppingBag, Users, Archive, LogOut, Home, Menu, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import defaultLogo from "@/assets/logo-pronto.png";

export const ADMIN_SECTIONS = [
  { id: "dashboard",    label: "Dashboard",      icon: LayoutDashboard },
  { id: "produtos",     label: "Produtos",        icon: Package },
  { id: "deliveries",   label: "Delivery Apps",   icon: Truck },
  { id: "precificacao", label: "Precificação",    icon: DollarSign },
  { id: "simulador",    label: "Simulador",       icon: Calculator },
  { id: "cardapio",     label: "Cardápio",        icon: BookOpen },
  { id: "pedidos",      label: "Pedidos",         icon: ShoppingBag },
  { id: "crm",          label: "CRM",             icon: Users },
  { id: "estoque",      label: "Estoque",         icon: Archive },
  { id: "config",       label: "Configurações",   icon: Settings },
] as const;

export type AdminSection = typeof ADMIN_SECTIONS[number]["id"];

interface AdminLayoutProps {
  activeSection: AdminSection;
  onSectionChange: (s: AdminSection) => void;
  children: React.ReactNode;
}

export function AdminLayout({ activeSection, onSectionChange, children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: siteSettings } = useSiteSettings();
  const logo = siteSettings?.logo_url || defaultLogo;
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: AdminSection) => {
    onSectionChange(id);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-[#0f1117]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#1a1d27] border-r border-white/5 z-40
          flex flex-col transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-9 w-auto" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">BeerPed</p>
            <p className="text-white/40 text-[11px]">Gestão Delivery</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {ADMIN_SECTIONS.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`
                  w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all
                  ${active
                    ? "bg-amber-500/10 text-amber-400 border-r-2 border-amber-400"
                    : "text-white/50 hover:text-white/90 hover:bg-white/5"
                  }
                `}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <p className="text-white/30 text-[11px] truncate px-1">{user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/50 hover:text-white hover:bg-white/5 gap-2"
            onClick={() => navigate("/")}
          >
            <Home className="h-4 w-4" />Catálogo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-400/70 hover:text-red-400 hover:bg-red-500/10 gap-2"
            onClick={async () => { await signOut(); navigate("/login"); }}
          >
            <LogOut className="h-4 w-4" />Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#1a1d27] border-b border-white/5 sticky top-0 z-20">
          <Button
            variant="ghost" size="icon"
            className="text-white/70"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-white font-semibold text-sm">
            {ADMIN_SECTIONS.find(s => s.id === activeSection)?.label}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
