import { createContext, useContext, useState, ReactNode } from "react";
import type { Product } from "@/hooks/useProducts";

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  getWhatsAppMessage: () => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((current) => current.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.preco * item.quantity,
    0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getWhatsAppMessage = () => {
    if (items.length === 0) return "";

    let message = "🛒 *Pedido AR Cell Distribuidora*\n\n";
    message += "📋 *Itens do pedido:*\n";
    message += "─────────────────\n";

    items.forEach((item, index) => {
      message += `${index + 1}. *${item.modelo}*\n`;
      message += `   Marca: ${item.marca}\n`;
      message += `   Tipo: ${item.tipo}\n`;
      message += `   Qtd: ${item.quantity} x ${formatCurrency(item.preco)}\n`;
      message += `   Subtotal: ${formatCurrency(item.preco * item.quantity)}\n\n`;
    });

    message += "─────────────────\n";
    message += `📦 *Total de itens:* ${totalItems}\n`;
    message += `💰 *Valor total:* ${formatCurrency(totalPrice)}\n\n`;
    message += "Aguardo confirmação! 🙏";

    return encodeURIComponent(message);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        getWhatsAppMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
