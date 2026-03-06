const BRAND_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  Apple: { bg: "bg-gray-800", text: "text-white", label: "A" },
  Samsung: { bg: "bg-blue-600", text: "text-white", label: "S" },
  Motorola: { bg: "bg-sky-500", text: "text-white", label: "M" },
  Xiaomi: { bg: "bg-orange-500", text: "text-white", label: "Xi" },
  LG: { bg: "bg-red-600", text: "text-white", label: "LG" },
  Nokia: { bg: "bg-indigo-600", text: "text-white", label: "N" },
  Honor: { bg: "bg-cyan-600", text: "text-white", label: "H" },
  Infinix: { bg: "bg-emerald-600", text: "text-white", label: "In" },
  Realme: { bg: "bg-yellow-500", text: "text-gray-900", label: "R" },
};

interface BrandIconProps {
  brand: string;
  size?: "sm" | "md";
}

export function BrandIcon({ brand, size = "sm" }: BrandIconProps) {
  const config = BRAND_CONFIG[brand] || { bg: "bg-muted", text: "text-foreground", label: brand.charAt(0) };
  const sizeClass = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${sizeClass} ${config.bg} ${config.text}`}
      title={brand}
    >
      {config.label}
    </span>
  );
}
