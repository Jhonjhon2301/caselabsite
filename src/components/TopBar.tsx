import { Phone, Mail } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-secondary border-b border-border">
      <div className="container mx-auto flex items-center justify-between py-1.5 text-[11px]">
        <span className="text-muted-foreground">3X sem juros a partir de R$199,90</span>
        <div className="flex items-center gap-5">
          <a href="https://wa.me/5561992629861" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Phone className="w-3 h-3" /> (61) 99262-9861
          </a>
          <a href="mailto:personalized.caselab@gmail.com" className="hidden md:flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="w-3 h-3" /> personalized.caselab@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
