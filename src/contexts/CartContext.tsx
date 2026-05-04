import { createContext, useContext, useState, ReactNode } from "react";
import type { Product } from "@/hooks/useProducts";

export interface CartItem extends Product {
  quantity: number;
  gelado: boolean;
  precoFinal: number;
}

export interface CustomerInfo {
  nome: string;
  telefone: string;
  endereco: string;
  complemento: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, precoFinal: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleGelado: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  getWhatsAppMessage: (customerInfo: CustomerInfo, deliveryNome: string) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, precoFinal: number) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1, precoFinal } : item
        );
      }
      return [...current, { ...product, quantity: 1, gelado: product.gelavel, precoFinal }];
    });
  };

  const removeFromCart = (productId: string) =>
    setItems((c) => c.filter((i) => i.id !== productId));

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    setItems((c) => c.map((i) => (i.id === productId ? { ...i, quantity } : i)));
  };

  const toggleGelado = (productId: string) =>
    setItems((c) => c.map((i) => (i.id === productId ? { ...i, gelado: !i.gelado } : i)));

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.precoFinal * i.quantity, 0);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const getWhatsAppMessage = (customer: CustomerInfo, deliveryNome: string) => {
    if (items.length === 0) return "";
    let msg = "🛒 *Novo Pedido — Pronto*\n\n";
    msg += `🚚 *Delivery:* ${deliveryNome}\n\n`;
    msg += "👤 *Dados do Cliente:*\n─────────────────\n";
    msg += `📛 ${customer.nome}\n📱 ${customer.telefone}\n📍 ${customer.endereco}\n`;
    if (customer.complemento) msg += `🏠 ${customer.complemento}\n`;
    msg += "\n📋 *Itens:*\n─────────────────\n";
    items.forEach((item, i) => {
      const gelo = item.gelavel ? (item.gelado ? " ❄️ GELADO" : " ☀️ Natural") : "";
      msg += `${i + 1}. *${item.nome}*${gelo}\n`;
      msg += `   Qtd: ${item.quantity} × ${fmt(item.precoFinal)}\n`;
      msg += `   Subtotal: ${fmt(item.precoFinal * item.quantity)}\n\n`;
    });
    msg += "─────────────────\n";
    msg += `📦 *Itens:* ${totalItems}\n💰 *Total:* ${fmt(totalPrice)}\n\n`;
    msg += "Aguardo confirmação! 🙏";
    return encodeURIComponent(msg);
  };

  return (
    <CartContext.Provider
      value={{
        items, addToCart, removeFromCart, updateQuantity, toggleGelado,
        clearCart, totalItems, totalPrice, getWhatsAppMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
