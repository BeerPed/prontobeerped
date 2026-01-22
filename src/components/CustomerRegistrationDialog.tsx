import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";

const STORAGE_KEY = "arcell-customer-info";

export interface CustomerInfo {
  nome: string;
  telefone: string;
  endereco: string;
  loja: string;
}

interface CustomerRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (customerInfo: CustomerInfo) => void;
}

const loadSavedCustomerInfo = (): CustomerInfo => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading customer info:", e);
  }
  return { nome: "", telefone: "", endereco: "", loja: "" };
};

const saveCustomerInfo = (info: CustomerInfo) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch (e) {
    console.error("Error saving customer info:", e);
  }
};

export function CustomerRegistrationDialog({
  open,
  onOpenChange,
  onSubmit,
}: CustomerRegistrationDialogProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(loadSavedCustomerInfo);

  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  useEffect(() => {
    if (open) {
      setCustomerInfo(loadSavedCustomerInfo());
    }
  }, [open]);

  const validateForm = () => {
    const newErrors: Partial<CustomerInfo> = {};

    if (!customerInfo.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }
    if (!customerInfo.telefone.trim()) {
      newErrors.telefone = "Telefone é obrigatório";
    }
    if (!customerInfo.endereco.trim()) {
      newErrors.endereco = "Endereço é obrigatório";
    }
    if (!customerInfo.loja.trim()) {
      newErrors.loja = "Nome da loja é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      saveCustomerInfo(customerInfo);
      onSubmit(customerInfo);
    }
  };

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleChange = (field: keyof CustomerInfo, value: string) => {
    const formattedValue = field === "telefone" ? formatPhone(value) : value;
    setCustomerInfo((prev) => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dados para Entrega</DialogTitle>
          <DialogDescription>
            Preencha seus dados para finalizar o pedido
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Seu nome completo"
                value={customerInfo.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                className={errors.nome ? "border-destructive" : ""}
              />
              {errors.nome && (
                <span className="text-xs text-destructive">{errors.nome}</span>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={customerInfo.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                className={errors.telefone ? "border-destructive" : ""}
              />
              {errors.telefone && (
                <span className="text-xs text-destructive">{errors.telefone}</span>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                placeholder="Rua, número, bairro, cidade"
                value={customerInfo.endereco}
                onChange={(e) => handleChange("endereco", e.target.value)}
                className={errors.endereco ? "border-destructive" : ""}
              />
              {errors.endereco && (
                <span className="text-xs text-destructive">{errors.endereco}</span>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="loja">Nome da Loja *</Label>
              <Input
                id="loja"
                placeholder="Nome da sua loja"
                value={customerInfo.loja}
                onChange={(e) => handleChange("loja", e.target.value)}
                className={errors.loja ? "border-destructive" : ""}
              />
              {errors.loja && (
                <span className="text-xs text-destructive">{errors.loja}</span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="gap-2 bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4" />
              Enviar Pedido
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
