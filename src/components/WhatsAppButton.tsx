import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5511946698650";
const WHATSAPP_MESSAGE = "Olá! Vim pelo catálogo e gostaria de mais informações.";

export function WhatsAppButton() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5C] text-white px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
      aria-label="Fale conosco pelo WhatsApp"
    >
      <MessageCircle className="h-6 w-6 fill-current" />
      <span className="hidden sm:inline font-medium">WhatsApp</span>
    </a>
  );
}
