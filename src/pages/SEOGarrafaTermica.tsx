import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Thermometer, Snowflake, Sun, Droplets, Shield, ArrowRight } from "lucide-react";

export default function SEOGarrafaTermica() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Garrafa Térmica com Logo Personalizada | Case Lab"
        description="Garrafas térmicas personalizadas com logo da sua empresa. Aço inox, mantém temperatura por 24h. Ideal para brindes e uso pessoal."
      />
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-background py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-3xl sm:text-5xl font-bold mb-4">
              Garrafa Térmica com Logo Personalizada
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Garrafas térmicas de alta performance com personalização profissional. 
              Mantém bebidas geladas por 24h e quentes por 12h. Perfeita para empresas e uso pessoal.
            </p>
            <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
              Ver Modelos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-heading text-2xl font-bold text-center mb-10">Tecnologia Térmica Avançada</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Snowflake, title: "24h Gelada", desc: "Dupla parede de aço inox com isolamento a vácuo mantém suas bebidas geladas o dia todo." },
              { icon: Sun, title: "12h Quente", desc: "Perfeita para café, chá ou sopas quentes durante viagens e expedientes longos." },
              { icon: Shield, title: "Aço Inox 304", desc: "Material de grau alimentício, resistente, durável e 100% livre de BPA." },
              { icon: Thermometer, title: "Vedação Total", desc: "Sistema de vedação que impede vazamentos mesmo com a garrafa de cabeça para baixo." },
              { icon: Droplets, title: "Anti-Suor", desc: "A superfície externa não condensa, mantendo suas mãos e bolsa sempre secas." },
              { icon: ArrowRight, title: "Personalização UV", desc: "Impressão UV de alta resolução que não descasca, mesmo após centenas de lavagens." },
            ].map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <f.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-heading font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 px-4 text-center bg-muted/30">
          <h2 className="font-heading text-2xl font-bold mb-4">Monte a sua garrafa térmica</h2>
          <p className="text-muted-foreground mb-6">Escolha modelo, cor e adicione seu logo ou nome personalizado.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
              Personalizar Agora
            </Link>
            <Link to="/b2b" className="px-8 py-3 rounded-lg border border-input font-semibold hover:bg-muted transition-colors">
              Comprar em Atacado
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
