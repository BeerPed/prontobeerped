import { useState, useEffect } from "react";
import { useSiteSettings, useUpsertSiteSettings } from "@/hooks/useSiteSettings";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function AdminConfigSection() {
  const { data: settings, isLoading } = useSiteSettings();
  const upsert = useUpsertSiteSettings();
  const { toast } = useToast();
  const [margem, setMargem] = useState("30");

  useEffect(() => {
    if (settings) setMargem(String((settings as any).margem_padrao ?? 30));
  }, [settings]);

  const save = async () => {
    try {
      await upsert.mutateAsync({ margem_padrao: parseFloat(margem.replace(",", ".")) } as any);
      toast({ title: "Configurações salvas" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const inputCls = "rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-amber-400/50 transition-colors";

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>;

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-white text-2xl font-bold">Configurações</h1>
        <p className="text-white/40 text-sm mt-1">Parâmetros globais do sistema</p>
      </div>
      <div className="rounded-xl border border-white/5 bg-[#1a1d27] p-6 space-y-4">
        <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider">Precificação</h2>
        <div className="space-y-1.5">
          <label className="text-white/50 text-xs font-semibold">Margem Padrão (%)</label>
          <input value={margem} onChange={e => setMargem(e.target.value)} className={inputCls} placeholder="30" />
          <p className="text-white/30 text-xs">Margem aplicada quando não há margem individual configurada por produto/delivery.</p>
        </div>
        <button onClick={save} disabled={upsert.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors">
          {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </button>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1a1d27] p-6 space-y-3">
        <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider">Integração Webhooks</h2>
        <p className="text-white/50 text-sm">Para receber pedidos automáticos dos apps de delivery, configure o webhook no painel de cada plataforma:</p>
        <div className="space-y-2">
          {[
            { label: "iFood", path: "/api/webhook/ifood" },
            { label: "Keeta", path: "/api/webhook/keeta" },
            { label: "Zé Delivery", path: "/api/webhook/ze" },
            { label: "99Food", path: "/api/webhook/99food" },
          ].map(({ label, path }) => (
            <div key={label} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
              <span className="text-white/70 text-sm font-medium">{label}</span>
              <code className="text-amber-400 text-xs font-mono bg-black/30 px-2 py-1 rounded">{path}</code>
            </div>
          ))}
        </div>
        <p className="text-white/30 text-xs">⚠️ Os webhooks requerem configuração adicional de um backend/edge function no Supabase. Solicite ao desenvolvedor.</p>
      </div>
    </div>
  );
}
