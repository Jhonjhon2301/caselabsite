import { Instagram, Mail, Phone, ArrowUp, CreditCard, Truck, ShieldCheck, Repeat } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer id="contato" className="relative">
      {/* Trust badges */}
      <div className="bg-muted border-t border-border py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Truck, title: "FRETE GRÁTIS", sub: "A partir de R$299,90" },
              { icon: CreditCard, title: "PAGAMENTO SEGURO", sub: "Cartão, Pix e boleto" },
              { icon: ShieldCheck, title: "COMPRA SEGURA", sub: "100% protegida" },
              { icon: Repeat, title: "TROCA FÁCIL", sub: "Primeira troca grátis" },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-foreground">{title}</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="bg-foreground text-background">
        <button
          onClick={scrollToTop}
          className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center z-10"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        <div className="container mx-auto px-4 pt-12 sm:pt-14 pb-6 sm:pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-16">
            <div>
              <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
                <img src={logo} alt="Case Lab" className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-primary/30" />
                <div>
                  <span className="font-heading text-lg sm:text-xl font-extrabold text-primary tracking-tight">CASE LAB</span>
                  <span className="block text-[8px] sm:text-[9px] font-semibold text-background/40 tracking-[0.3em] leading-none mt-0.5">
                    PERSONALIZADOS
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-background/50 leading-relaxed max-w-xs">
                Garrafas térmicas personalizadas com a identidade do seu negócio, profissão ou estilo pessoal. Qualidade premium em cada detalhe.
              </p>
            </div>

            <div id="sobre">
              <h3 className="font-heading font-bold text-xs sm:text-sm text-primary mb-3 sm:mb-4 tracking-wider uppercase">Sobre Nós</h3>
              <p className="text-xs sm:text-sm text-background/50 leading-relaxed">
                A Case Lab transforma sua identidade em um produto único e exclusivo. Trabalhamos com personalização de alta qualidade para empresas e pessoas.
              </p>
              <p className="text-[10px] sm:text-xs text-background/25 mt-3 sm:mt-4 font-mono">CNPJ: 64.964.419/0001-46</p>
              <div className="flex flex-wrap gap-3 mt-3 sm:mt-4">
                <a href="/sobre" className="text-xs text-background/50 hover:text-primary transition-colors">Sobre Nós</a>
                <a href="/blog" className="text-xs text-background/50 hover:text-primary transition-colors">Blog</a>
                <a href="/meus-pedidos" className="text-xs text-background/50 hover:text-primary transition-colors">Meus Pedidos</a>
                <a href="/perfil" className="text-xs text-background/50 hover:text-primary transition-colors">Meu Perfil</a>
                <a href="/indicar" className="text-xs text-background/50 hover:text-primary transition-colors">Indicar Amigo</a>
                <a href="/b2b" className="text-xs text-background/50 hover:text-primary transition-colors">Atacado B2B</a>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                <a href="/termos" className="text-[10px] text-background/30 hover:text-primary transition-colors">Termos de Uso</a>
                <a href="/privacidade" className="text-[10px] text-background/30 hover:text-primary transition-colors">Política de Privacidade</a>
                <a href="/garrafa-personalizada-academia" className="text-[10px] text-background/30 hover:text-primary transition-colors">Garrafa para Academia</a>
                <a href="/brindes-corporativos-personalizados" className="text-[10px] text-background/30 hover:text-primary transition-colors">Brindes Corporativos</a>
                <a href="/garrafa-termica-com-logo" className="text-[10px] text-background/30 hover:text-primary transition-colors">Garrafa Térmica com Logo</a>
              </div>
            </div>

            <div>
              <h3 className="font-heading font-bold text-xs sm:text-sm text-primary mb-3 sm:mb-4 tracking-wider uppercase">Contato</h3>
              <div className="space-y-2.5 sm:space-y-3">
                <a
                  href="https://wa.me/5561992629861"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-xs sm:text-sm text-background/50 hover:text-primary transition-colors group"
                >
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </span>
                  (61) 99262-9861
                </a>
                <a
                  href="mailto:personalized.caselab@gmail.com"
                  className="flex items-center gap-2.5 text-xs sm:text-sm text-background/50 hover:text-primary transition-colors group"
                >
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </span>
                  <span className="truncate">personalized.caselab@gmail.com</span>
                </a>
                <a
                  href="https://www.instagram.com/caselaboficial_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-xs sm:text-sm text-background/50 hover:text-primary transition-colors group"
                >
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Instagram className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </span>
                  @caselaboficial_
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-xs text-background/25">
            <span>© 2025 Case Lab Personalizados. Todos os direitos reservados.</span>
            <span>Feito com ♥ em Brasília</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
