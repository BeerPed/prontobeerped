import { useState } from "react";
import { ShoppingCart, Trash2, Plus, Minus, Send, Snowflake, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useDeliveries } from "@/hooks/useDeliveries";
import {
  CustomerRegistrationDialog, CustomerInfo,
} from "@/components/CustomerRegistrationDialog";
import { recordOrderForLead } from "@/hooks/useLeads";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function CartButton() {
  const [showRegistration, setShowRegistration] = useState(false);
  const {
    items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice,
    toggleGelado, getWhatsAppMessage,
  } = useCart();
  const { data: deliveries } = useDeliveries();
  const firstActive = (deliveries ?? []).find((d) => d.ativo);
  const deliveryNome = firstActive?.nome ?? "WhatsApp";

  const handleSendWhatsApp = async (customer: CustomerInfo) => {
    const message = getWhatsAppMessage(customer, deliveryNome);
    const phoneNumber = "5511946698650";
    try {
      await recordOrderForLead(customer.telefone, {
        total: totalPrice,
        itens: items.map((i) => ({
          nome: i.nome, codigo: i.codigo, qtd: i.quantity,
          preco: i.precoFinal, gelado: i.gelado,
        })),
      });
    } catch (e) {
      console.error("Failed to record order for lead", e);
    }
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
    setShowRegistration(false);
    clearCart();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Seu Pedido
          </SheetTitle>
          <SheetDescription>
            {items.length === 0 ? "Carrinho vazio" : `${totalItems} item(s)`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.nome}</h4>
                  <p className="text-sm font-semibold text-primary mt-1">
                    {fmt(item.precoFinal)}
                  </p>
                </div>
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {item.gelavel && (
                <button
                  onClick={() => toggleGelado(item.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 self-start transition-colors ${
                    item.gelado
                      ? "bg-blue-500 text-white"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {item.gelado ? (
                    <><Snowflake className="h-3 w-3" /> Gelado</>
                  ) : (
                    <><Sun className="h-3 w-3" /> Natural</>
                  )}
                </button>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button
                    variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm font-semibold">
                  {fmt(item.precoFinal * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <SheetFooter className="flex-col gap-3 border-t pt-4">
            <div className="flex justify-between items-center w-full text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">{fmt(totalPrice)}</span>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={clearCart}>Limpar</Button>
              <Button
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => setShowRegistration(true)}
              >
                <Send className="h-4 w-4" />
                Finalizar
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>

      <CustomerRegistrationDialog
        open={showRegistration}
        onOpenChange={setShowRegistration}
        onSubmit={handleSendWhatsApp}
      />
    </Sheet>
  );
}
