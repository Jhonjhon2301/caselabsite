import { Instagram, Mail, Phone, ArrowUp, CreditCard, Truck, ShieldCheck, Repeat } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer id="contato" className="relative">
      {/* Trust badges — GoCase style */}
      <div className="bg-muted border-t border-border py-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center gap-2">
              <Truck className="w-7 h-7 text-primary" />
              <div>
                <p className="text-xs font-bold text-foreground">FRETE GRÁTIS</p>
                <p className="text-[10px] text-muted-foreground">A partir de R$299,90</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <CreditCard className="w-7 h-7 text-primary" />
              <div>
                <p className="text-xs font-bold text-foreground">3X SEM JUROS</p>
                <p className="text-[10px] text-muted-foreground">A partir de R$199,90</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <ShieldCheck className="w-7 h-7 text-primary" />
              <div>
                <p className="text-xs font-bold text-foreground">COMPRA SEGURA</p>
                <p className="text-[10px] text-muted-foreground">100% protegida</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <Repeat className="w-7 h-7 text-primary" />
              <div>
                <p className="text-xs font-bold text-foreground">TROCA FÁCIL</p>
                <p className="text-[10px] text-muted-foreground">Primeira troca grátis</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="bg-foreground text-background">
        {/* Back to top */}
        <button
          onClick={scrollToTop}
          className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center z-10"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        <div className="container mx-auto px-4 pt-14 pb-8">
          <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <img src={logo} alt="Case Lab" className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/30" />
                <div>
                  <span className="font-heading text-xl font-extrabold text-primary tracking-tight">CASE LAB</span>
                  <span className="block text-[9px] font-semibold text-background/40 tracking-[0.3em] leading-none mt-0.5">
                    PERSONALIZADOS
                  </span>
                </div>
              </div>
              <p className="text-sm text-background/50 leading-relaxed max-w-xs">
                Garrafas térmicas personalizadas com a identidade do seu negócio, profissão ou estilo pessoal. Qualidade premium em cada detalhe.
              </p>
            </div>

            <div id="sobre">
              <h3 className="font-heading font-bold text-sm text-primary mb-4 tracking-wider uppercase">Sobre Nós</h3>
              <p className="text-sm text-background/50 leading-relaxed">
                A Case Lab transforma sua identidade em um produto único e exclusivo. Trabalhamos com personalização de alta qualidade para empresas e pessoas.
              </p>
              <p className="text-xs text-background/25 mt-4 font-mono">CNPJ: 64.964.419/0001-46</p>
            </div>

            <div>
              <h3 className="font-heading font-bold text-sm text-primary mb-4 tracking-wider uppercase">Contato</h3>
              <div className="space-y-3">
                <a
                  href="https://wa.me/5561992629861"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-background/50 hover:text-primary transition-colors group"
                >
                  <span className="w-8 h-8 rounded-full bg-background/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  (61) 99262-9861
                </a>
                <a
                  href="mailto:personalized.caselab@gmail.com"
                  className="flex items-center gap-2.5 text-sm text-background/50 hover:text-primary transition-colors group"
                >
                  <span className="w-8 h-8 rounded-full bg-background/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  personalized.caselab@gmail.com
                </a>
                <a
                  href="https://www.instagram.com/caselaboficial_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-background/50 hover:text-primary transition-colors group"
                >
                  <span className="w-8 h-8 rounded-full bg-background/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Instagram className="w-3.5 h-3.5" />
                  </span>
                  @caselaboficial_
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-background/25">
            <span>© 2025 Case Lab Personalizados. Todos os direitos reservados.</span>
            <span>Feito com ♥ em Brasília</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
