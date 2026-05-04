import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { upsertLeadByPhone } from "@/hooks/useLeads";

const STORAGE_KEY = "pronto-customer-info";

export interface CustomerInfo {
  nome: string;
  telefone: string;
  endereco: string;
  complemento: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (customerInfo: CustomerInfo) => void;
}

const empty: CustomerInfo = { nome: "", telefone: "", endereco: "", complemento: "" };

const load = (): CustomerInfo => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...empty, ...JSON.parse(saved) };
  } catch {}
  return empty;
};

const save = (info: CustomerInfo) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(info)); } catch {}
};

export function CustomerRegistrationDialog({ open, onOpenChange, onSubmit }: Props) {
  const [info, setInfo] = useState<CustomerInfo>(load);
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  useEffect(() => { if (open) setInfo(load()); }, [open]);

  const validate = () => {
    const e: Partial<CustomerInfo> = {};
    if (!info.nome.trim()) e.nome = "Obrigatório";
    if (!info.telefone.trim()) e.telefone = "Obrigatório";
    if (!info.endereco.trim()) e.endereco = "Obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    save(info);
    try {
      await upsertLeadByPhone({
        nome: info.nome,
        telefone: info.telefone,
        endereco: info.endereco,
        loja: info.complemento || null,
      });
    } catch (err) {
      console.error("Failed to save lead", err);
    }
    onSubmit(info);
  };

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const change = (f: keyof CustomerInfo, v: string) => {
    setInfo((p) => ({ ...p, [f]: f === "telefone" ? formatPhone(v) : v }));
    if (errors[f]) setErrors((p) => ({ ...p, [f]: undefined }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dados para Entrega</DialogTitle>
          <DialogDescription>Vamos chegar até você ⚡</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" placeholder="Seu nome" value={info.nome}
                onChange={(e) => change("nome", e.target.value)}
                className={errors.nome ? "border-destructive" : ""} />
              {errors.nome && <span className="text-xs text-destructive">{errors.nome}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input id="telefone" placeholder="(00) 00000-0000" value={info.telefone}
                onChange={(e) => change("telefone", e.target.value)}
                className={errors.telefone ? "border-destructive" : ""} />
              {errors.telefone && <span className="text-xs text-destructive">{errors.telefone}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input id="endereco" placeholder="Rua, número, bairro" value={info.endereco}
                onChange={(e) => change("endereco", e.target.value)}
                className={errors.endereco ? "border-destructive" : ""} />
              {errors.endereco && <span className="text-xs text-destructive">{errors.endereco}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="complemento">Complemento (opcional)</Label>
              <Input id="complemento" placeholder="Apto, bloco, referência" value={info.complemento}
                onChange={(e) => change("complemento", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2 bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4" /> Enviar Pedido
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
