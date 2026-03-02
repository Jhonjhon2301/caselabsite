import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SEOHead from "@/components/SEOHead";
import { useState } from "react";
import { ShieldCheck, Award, Users, Heart, Truck, Star, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.jpeg";

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: "Compra 100% Segura", desc: "Pagamento criptografado via Stripe e PIX" },
  { icon: Award, title: "Qualidade Premium", desc: "Materiais de alta durabilidade e acabamento impecável" },
  { icon: Users, title: "+500 Empresas Atendidas", desc: "Brindes corporativos para grandes marcas" },
  { icon: Heart, title: "Feito com Carinho", desc: "Cada produto é personalizado à mão com atenção aos detalhes" },
  { icon: Truck, title: "Entrega para Todo Brasil", desc: "Frete grátis acima de R$299,90" },
  { icon: Star, title: "4.9 ⭐ de Avaliação", desc: "Milhares de clientes satisfeitos" },
];

export default function About() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Sobre a Case Lab — Garrafas Personalizadas Premium"
        description="Conheça a Case Lab: líder em garrafas térmicas personalizadas para empresas e pessoas. Qualidade premium, entrega rápida e personalização de alta definição."
      />
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main>
        {/* Hero */}
        <section className="gradient-brand py-16 sm:py-24">
          <div className="container mx-auto px-4 text-center">
            <img src={logo} alt="Case Lab" className="w-20 h-20 rounded-full object-cover mx-auto mb-6 ring-4 ring-white/20" />
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-white mb-4">
              Por que escolher a Case Lab?
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Transformamos sua identidade em produtos únicos e exclusivos. Somos especialistas em personalização de garrafas térmicas com qualidade premium.
            </p>
          </div>
        </section>

        {/* Trust grid */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-12 sm:py-16 bg-muted/50">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="font-heading text-2xl font-bold mb-6 text-center">Nossa História</h2>
            <div className="prose prose-sm mx-auto text-muted-foreground space-y-4">
              <p>
                A Case Lab nasceu da paixão por personalização e da vontade de oferecer produtos verdadeiramente únicos. 
                Começamos como uma pequena operação em Brasília e hoje atendemos empresas e pessoas em todo o Brasil.
              </p>
              <p>
                Nosso processo de personalização utiliza tecnologia de última geração para garantir que cada garrafa saia perfeita. 
                Trabalhamos com impressão de alta definição que não desbota, materiais premium e acabamento impecável.
              </p>
              <p>
                Para o mercado corporativo, somos parceiros de confiança de mais de 500 empresas que escolheram a Case Lab para 
                seus brindes, eventos e ações de endomarketing.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-heading text-2xl font-bold mb-4">Pronto para personalizar?</h2>
            <p className="text-muted-foreground mb-6">Explore nosso catálogo e crie algo único.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/" className="btn-primary">Ver Produtos</a>
              <a href="/b2b" className="btn-outline">Atacado B2B</a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
    </div>
  );
}
