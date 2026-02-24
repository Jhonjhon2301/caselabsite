import { Instagram, Mail, Phone } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function Footer() {
  return (
    <footer id="contato" className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Case Lab" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <span className="font-heading text-2xl text-primary tracking-wider">CASE LAB</span>
                <span className="block text-[10px] text-primary/70 tracking-[0.3em] -mt-1">PERSONALIZADOS</span>
              </div>
            </div>
            <p className="text-sm text-secondary-foreground/70 mt-2">
              Garrafas térmicas personalizadas com a identidade do seu negócio.
            </p>
          </div>

          <div id="sobre">
            <h3 className="font-heading text-xl text-primary mb-4">SOBRE NÓS</h3>
            <p className="text-sm text-secondary-foreground/70 leading-relaxed">
              A Case Lab é especializada em personalização de garrafas térmicas para empresas, profissionais e uso pessoal. Transformamos sua identidade em um produto único e exclusivo.
            </p>
            <p className="text-xs text-secondary-foreground/50 mt-3">CNPJ: 64.964.419/0001-46</p>
          </div>

          <div>
            <h3 className="font-heading text-xl text-primary mb-4">CONTATO</h3>
            <div className="space-y-3">
              <a href="https://wa.me/5561992629861" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
                <Phone className="w-4 h-4" /> (61) 99262-9861
              </a>
              <a href="mailto:personalized.caselab@gmail.com" className="flex items-center gap-2 text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
                <Mail className="w-4 h-4" /> personalized.caselab@gmail.com
              </a>
              <a href="https://www.instagram.com/caselaboficial_/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
                <Instagram className="w-4 h-4" /> @caselaboficial_
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-secondary-foreground/10 text-center text-xs text-secondary-foreground/40">
          © 2025 Case Lab Personalizados. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
