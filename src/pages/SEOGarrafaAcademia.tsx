import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Droplets, Dumbbell, Star, Shield, Palette, ArrowRight } from "lucide-react";

export default function SEOGarrafaAcademia() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Garrafa Personalizada para Academia | Case Lab"
        description="Garrafas personalizadas para academia com seu nome, logo ou frase motivacional. Inox, térmica e com a sua cara. Peça já!"
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-3xl sm:text-5xl font-bold mb-4">
              Garrafa Personalizada para Academia
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Sua garrafa, sua identidade. Personalize com seu nome, frase motivacional ou logo da sua academia. 
              Material de alta qualidade, perfeita para treinos intensos.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Ver Modelos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-heading text-2xl font-bold text-center mb-10">Por que escolher nossas garrafas?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Droplets, title: "Mantém a Temperatura", desc: "Tecnologia térmica de dupla parede que mantém sua água gelada por até 24 horas." },
              { icon: Shield, title: "Material Premium", desc: "Aço inoxidável 304, livre de BPA, resistente a impactos e corrosão." },
              { icon: Palette, title: "100% Personalizável", desc: "Escolha cores, adicione seu nome, logo ou frases. A garrafa com a sua cara." },
              { icon: Dumbbell, title: "Feita para o Treino", desc: "Design ergonômico com boca larga para fácil higienização e adição de gelo." },
              { icon: Star, title: "Acabamento Profissional", desc: "Impressão de alta definição que não descasca, mesmo com uso intenso." },
              { icon: ArrowRight, title: "Entrega Rápida", desc: "Produção ágil e envio para todo o Brasil com rastreamento completo." },
            ].map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <f.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-heading font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-muted/30 py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>
            {[
              { q: "Posso personalizar com o logo da minha academia?", a: "Sim! Aceitamos logotipos em alta resolução para personalização perfeita." },
              { q: "Qual o prazo de produção?", a: "O prazo médio é de 3 a 5 dias úteis após a aprovação da arte." },
              { q: "Qual o pedido mínimo?", a: "Para uso pessoal, a partir de 1 unidade. Para atacado (B2B), mínimo de 10 unidades com desconto progressivo." },
              { q: "A personalização é resistente?", a: "Sim! Utilizamos impressão UV de alta durabilidade, resistente a lavagens e uso diário." },
            ].map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 mb-3">
                <h3 className="font-medium mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <h2 className="font-heading text-2xl font-bold mb-4">Pronto para personalizar a sua?</h2>
          <p className="text-muted-foreground mb-6">Escolha o modelo ideal e monte sua garrafa exclusiva agora mesmo.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
              Ver Catálogo
            </Link>
            <Link to="/b2b" className="px-8 py-3 rounded-lg border border-input font-semibold hover:bg-muted transition-colors">
              Comprar em Atacado (B2B)
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
