import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Termos de Uso - Case Lab" description="Termos e condições de uso da loja Case Lab." />
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-sm">
        <h1 className="font-heading text-3xl font-bold mb-8 text-foreground">Termos de Uso</h1>
        <p className="text-muted-foreground text-sm mb-4">Última atualização: Março de 2026</p>

        <h2 className="text-foreground">1. Aceitação dos Termos</h2>
        <p className="text-muted-foreground">Ao acessar e utilizar o site Case Lab, você concorda com os presentes Termos de Uso. Caso não concorde, recomendamos que não utilize nossos serviços.</p>

        <h2 className="text-foreground">2. Descrição dos Serviços</h2>
        <p className="text-muted-foreground">A Case Lab é uma loja virtual especializada em garrafas térmicas personalizadas. Oferecemos produtos customizáveis com impressão de alta qualidade.</p>

        <h2 className="text-foreground">3. Cadastro</h2>
        <p className="text-muted-foreground">Para realizar compras, é necessário criar uma conta fornecendo dados pessoais verdadeiros, incluindo CPF, e-mail e telefone. O usuário é responsável pela veracidade das informações fornecidas.</p>

        <h2 className="text-foreground">4. Produtos e Personalização</h2>
        <p className="text-muted-foreground">Os produtos personalizados são fabricados sob demanda. Após a aprovação da arte e início da produção, não é possível cancelar o pedido. O prazo de produção varia de 2 a 5 dias úteis conforme o produto.</p>

        <h2 className="text-foreground">5. Preços e Pagamento</h2>
        <p className="text-muted-foreground">Os preços estão em Reais (BRL) e podem ser alterados sem aviso prévio. Aceitamos pagamento via cartão de crédito e PIX. O pedido só é processado após a confirmação do pagamento.</p>

        <h2 className="text-foreground">6. Entrega</h2>
        <p className="text-muted-foreground">As entregas são realizadas em todo o território nacional. O prazo de entrega é calculado após a finalização da produção. Frete grátis para o DF em compras acima de R$ 150,00 e para demais estados acima de R$ 180,00.</p>

        <h2 className="text-foreground">7. Trocas e Devoluções</h2>
        <p className="text-muted-foreground">Por se tratar de produto personalizado, trocas e devoluções são aceitas apenas em caso de defeito de fabricação, conforme o Código de Defesa do Consumidor (Lei 8.078/90). O prazo para solicitação é de 7 dias corridos após o recebimento.</p>

        <h2 className="text-foreground">8. Propriedade Intelectual</h2>
        <p className="text-muted-foreground">Todo o conteúdo do site (textos, imagens, logos, design) é de propriedade da Case Lab. É proibida a reprodução sem autorização prévia.</p>

        <h2 className="text-foreground">9. Limitação de Responsabilidade</h2>
        <p className="text-muted-foreground">A Case Lab não se responsabiliza por danos indiretos decorrentes do uso do site. Nosso compromisso é entregar o produto conforme especificado no pedido.</p>

        <h2 className="text-foreground">10. Foro</h2>
        <p className="text-muted-foreground">Fica eleito o foro da comarca de Brasília/DF para dirimir quaisquer questões decorrentes destes Termos de Uso.</p>

        <h2 className="text-foreground">11. Contato</h2>
        <p className="text-muted-foreground">Para dúvidas sobre estes termos, entre em contato pelo WhatsApp (61) 99510-1789 ou pelo e-mail disponível em nosso site.</p>
      </div>
    </div>
  );
}
