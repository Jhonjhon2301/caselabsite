import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Gift, Building2, Truck, Award, Users, Heart, ArrowRight } from "lucide-react";

export default function SEOBrindesCorporativos() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Brindes Corporativos Personalizados | Case Lab"
        description="Brindes corporativos personalizados com a marca da sua empresa. Garrafas, copos e acessórios com desconto por volume. Solicite orçamento!"
      />
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-background py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-3xl sm:text-5xl font-bold mb-4">
              Brindes Corporativos Personalizados
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Fortaleça sua marca com brindes de qualidade. Garrafas, copos e acessórios personalizados 
              com o logo da sua empresa. Preços especiais para grandes quantidades.
            </p>
            <Link to="/b2b" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
              Solicitar Orçamento <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-heading text-2xl font-bold text-center mb-10">Ideal para</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Building2, title: "Eventos Corporativos", desc: "Congressos, feiras, seminários e convenções. Presenteie seus convidados com algo útil e marcante." },
              { icon: Users, title: "Kit Onboarding", desc: "Receba novos colaboradores com um brinde personalizado que reforça a cultura da empresa." },
              { icon: Award, title: "Premiação de Equipe", desc: "Reconheça e motive sua equipe com brindes exclusivos personalizados." },
              { icon: Gift, title: "Datas Comemorativas", desc: "Natal, Dia do Cliente, aniversário da empresa. Surpreenda com presentes de qualidade." },
              { icon: Heart, title: "Ações de Endomarketing", desc: "Campanhas internas de bem-estar e sustentabilidade com garrafas reutilizáveis." },
              { icon: Truck, title: "Entrega em Todo Brasil", desc: "Logística completa com embalagem especial para grandes quantidades." },
            ].map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <f.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-heading font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-muted/30 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-2xl font-bold mb-4">Descontos Progressivos</h2>
            <p className="text-muted-foreground mb-8">Quanto mais unidades, maior o desconto. Confira nossa tabela no simulador B2B.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              {[
                { label: "10-24 un", discount: "5%" },
                { label: "25-49 un", discount: "10%" },
                { label: "50-99 un", discount: "15%" },
                { label: "100+ un", discount: "20%" },
              ].map((t, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{t.discount}</p>
                  <p className="text-xs text-muted-foreground">{t.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 text-center">
          <h2 className="font-heading text-2xl font-bold mb-4">Solicite seu orçamento agora</h2>
          <p className="text-muted-foreground mb-6">Atendimento rápido, arte gratuita e produção ágil.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/b2b" className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
              Ir para Área B2B
            </Link>
            <Link to="/" className="px-8 py-3 rounded-lg border border-input font-semibold hover:bg-muted transition-colors">
              Ver Catálogo
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
