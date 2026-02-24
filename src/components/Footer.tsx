import { Instagram, Mail, Phone } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function Footer() {
  return (
    <footer id="contato" className="bg-brand-dark text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Case Lab" className="w-9 h-9 rounded-full object-cover" />
              <div>
                <span className="font-heading text-xl font-extrabold text-brand-orange tracking-tight">CASE LAB</span>
                <span className="block text-[9px] font-medium text-primary-foreground/50 tracking-[0.25em] leading-none">PERSONALIZADOS</span>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/60 leading-relaxed">
              Garrafas térmicas personalizadas com a identidade do seu negócio, profissão ou estilo pessoal.
            </p>
          </div>

          <div id="sobre">
            <h3 className="font-heading font-bold text-brand-orange mb-3">SOBRE NÓS</h3>
            <p className="text-sm text-primary-foreground/60 leading-relaxed">
              A Case Lab transforma sua identidade em um produto único e exclusivo. Trabalhamos com personalização de alta qualidade para empresas e pessoas.
            </p>
            <p className="text-xs text-primary-foreground/30 mt-3">CNPJ: 64.964.419/0001-46</p>
          </div>

          <div>
            <h3 className="font-heading font-bold text-brand-orange mb-3">CONTATO</h3>
            <div className="space-y-2.5">
              <a href="https://wa.me/5561992629861" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-brand-orange transition-colors">
                <Phone className="w-4 h-4" /> (61) 99262-9861
              </a>
              <a href="mailto:personalized.caselab@gmail.com" className="flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-brand-orange transition-colors">
                <Mail className="w-4 h-4" /> personalized.caselab@gmail.com
              </a>
              <a href="https://www.instagram.com/caselaboficial_/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-brand-orange transition-colors">
                <Instagram className="w-4 h-4" /> @caselaboficial_
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/30">
          © 2025 Case Lab Personalizados. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
