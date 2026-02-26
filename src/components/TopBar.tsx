import { Phone } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-secondary border-b border-border">
      <div className="container mx-auto flex items-center justify-between py-1.5 text-[11px]">
        <span className="font-semibold text-foreground">Frete Grátis acima de R$299</span>
        <div className="flex items-center gap-1 sm:gap-4">
          <a
            href="https://wa.me/5561992629861"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Faça seu Orçamento
          </a>
          <span className="hidden sm:inline text-border">|</span>
          <a href="#produtos" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Rastrear Pedido
          </a>
          <span className="hidden sm:inline text-border">|</span>
          <a href="#contato" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Central de Ajuda
          </a>
        </div>
      </div>
    </div>
  );
}
