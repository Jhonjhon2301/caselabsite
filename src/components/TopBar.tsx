import { Instagram, Mail, Phone } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-brand-dark text-primary-foreground">
      <div className="container mx-auto flex items-center justify-between py-2 text-xs">
        <div className="flex items-center gap-4">
          <a href="https://wa.me/5561992629861" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand-orange transition-colors">
            <Phone className="w-3 h-3" /> (61) 99262-9861
          </a>
          <a href="mailto:personalized.caselab@gmail.com" className="hidden sm:flex items-center gap-1.5 hover:text-brand-orange transition-colors">
            <Mail className="w-3 h-3" /> personalized.caselab@gmail.com
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://www.instagram.com/caselaboficial_/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand-orange transition-colors">
            <Instagram className="w-3 h-3" /> @caselaboficial_
          </a>
        </div>
      </div>
    </div>
  );
}
