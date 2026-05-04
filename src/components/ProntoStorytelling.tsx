import { useEffect, useState } from "react";
import { ShoppingBasket, Smartphone, Package, Bike, PartyPopper } from "lucide-react";
import logo from "@/assets/logo-pronto.png";

interface Step {
  icon: typeof ShoppingBasket;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    icon: Smartphone,
    title: "1. Você escolhe pelo app",
    desc: "Bebidas geladas, snacks, congelados — tudo na palma da mão.",
  },
  {
    icon: ShoppingBasket,
    title: "2. Monta seu pedido",
    desc: "Marque o que quer gelado e finalize em segundos.",
  },
  {
    icon: Package,
    title: "3. Pronto separa rapidinho",
    desc: "Em poucos minutos o pedido sai do nosso mercado.",
  },
  {
    icon: Bike,
    title: "4. Delivery a caminho",
    desc: "iFood, Keeta, Zé Delivery ou 99Food entregam até a sua porta.",
  },
  {
    icon: PartyPopper,
    title: "5. Aproveite!",
    desc: "Seu mercado, sempre quando precisar — Pronto.",
  },
];

export function ProntoStorytelling() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const ActiveIcon = STEPS[active].icon;

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 flex flex-col">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-pink-400/30 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-purple-300/30 blur-3xl" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-white text-center">
        <img src={logo} alt="Pronto" className="h-28 w-auto mb-6 drop-shadow-2xl" />

        <div className="w-full max-w-sm">
          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl min-h-[220px] flex flex-col items-center justify-center transition-all duration-500">
            <div className="h-16 w-16 rounded-2xl bg-white text-purple-700 flex items-center justify-center mb-4 shadow-lg">
              <ActiveIcon className="h-8 w-8" strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold mb-2">{STEPS[active].title}</h3>
            <p className="text-sm text-white/90 leading-relaxed">{STEPS[active].desc}</p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all ${
                  i === active ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Passo ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 text-white/80 text-xs uppercase tracking-widest font-semibold">
          Seu mercado aqui, sempre!
        </div>
      </div>
    </div>
  );
}
