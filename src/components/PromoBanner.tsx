import { Ticket } from "lucide-react";

export default function PromoBanner() {
  return (
    <div className="bg-primary text-primary-foreground py-2.5 text-center">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-3 text-sm font-bold">
        <span className="flex items-center gap-1.5">
          <Ticket className="w-4 h-4" />
          🎟️ CUPONS DISPONÍVEIS 🎟️
        </span>
        <span className="hidden sm:inline text-primary-foreground/50">|</span>
        <a href="#produtos" className="underline underline-offset-2 hover:opacity-80 transition-opacity">
          Frete Grátis a partir de R$299,90*
        </a>
      </div>
    </div>
  );
}
