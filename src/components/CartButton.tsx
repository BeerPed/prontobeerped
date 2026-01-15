import { ShoppingCart, Trash2, Plus, Minus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function CartButton() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    getWhatsAppMessage,
  } = useCart();

  const handleSendWhatsApp = () => {
    const message = getWhatsAppMessage();
    const phoneNumber = "5511946698650";
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
        >
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
            Lista de Pedido
          </SheetTitle>
          <SheetDescription>
            {items.length === 0
              ? "Sua lista está vazia"
              : `${totalItems} item(s) na lista`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.modelo}</h4>
                  <p className="text-xs text-muted-foreground">
                    {item.marca} • {item.tipo}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    {formatCurrency(item.preco)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(item.preco * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <SheetFooter className="flex-col gap-3 border-t pt-4">
            <div className="flex justify-between items-center w-full text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">{formatCurrency(totalPrice)}</span>
            </div>
            
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={clearCart}
              >
                Limpar
              </Button>
              <Button
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                onClick={handleSendWhatsApp}
              >
                <Send className="h-4 w-4" />
                Enviar WhatsApp
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
