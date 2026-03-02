import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Política de Privacidade - Case Lab" description="Saiba como a Case Lab protege seus dados pessoais." />
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-sm">
        <h1 className="font-heading text-3xl font-bold mb-8 text-foreground">Política de Privacidade</h1>
        <p className="text-muted-foreground text-sm mb-4">Última atualização: Março de 2026</p>

        <h2 className="text-foreground">1. Introdução</h2>
        <p className="text-muted-foreground">A Case Lab se compromete a proteger a privacidade dos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).</p>

        <h2 className="text-foreground">2. Dados Coletados</h2>
        <p className="text-muted-foreground">Coletamos os seguintes dados pessoais:</p>
        <ul className="text-muted-foreground">
          <li>Nome completo, CPF, e-mail e telefone (para cadastro e emissão de nota fiscal)</li>
          <li>Endereço completo (para entrega dos produtos)</li>
          <li>Data de nascimento e gênero (opcionais, para personalização da experiência)</li>
          <li>Instagram (opcional, para contato e divulgação)</li>
          <li>Dados de navegação e cookies (para melhorar a experiência no site)</li>
        </ul>

        <h2 className="text-foreground">3. Finalidade do Tratamento</h2>
        <p className="text-muted-foreground">Seus dados são utilizados para: processar pedidos e pagamentos; realizar entregas; emitir notas fiscais; enviar atualizações sobre pedidos via WhatsApp; melhorar nossos serviços; e cumprir obrigações legais.</p>

        <h2 className="text-foreground">4. Compartilhamento de Dados</h2>
        <p className="text-muted-foreground">Seus dados podem ser compartilhados com: processadores de pagamento (para transações financeiras); transportadoras (para entrega dos produtos); e autoridades fiscais (para emissão de notas fiscais). Não vendemos ou compartilhamos seus dados para fins de marketing de terceiros.</p>

        <h2 className="text-foreground">5. Armazenamento e Segurança</h2>
        <p className="text-muted-foreground">Seus dados são armazenados em servidores seguros com criptografia. Utilizamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.</p>

        <h2 className="text-foreground">6. Seus Direitos</h2>
        <p className="text-muted-foreground">Conforme a LGPD, você tem direito a: acessar seus dados pessoais; corrigir dados incompletos ou desatualizados; solicitar a exclusão de seus dados; revogar o consentimento; e solicitar a portabilidade dos dados.</p>

        <h2 className="text-foreground">7. Cookies</h2>
        <p className="text-muted-foreground">Utilizamos cookies para melhorar a experiência de navegação, lembrar preferências e analisar o tráfego do site. Você pode configurar seu navegador para recusar cookies, mas isso pode afetar a funcionalidade do site.</p>

        <h2 className="text-foreground">8. Retenção de Dados</h2>
        <p className="text-muted-foreground">Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política ou conforme exigido por lei (ex.: obrigações fiscais de 5 anos).</p>

        <h2 className="text-foreground">9. Alterações</h2>
        <p className="text-muted-foreground">Esta política pode ser atualizada a qualquer momento. Recomendamos revisá-la periodicamente.</p>

        <h2 className="text-foreground">10. Contato do Encarregado (DPO)</h2>
        <p className="text-muted-foreground">Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados, entre em contato pelo WhatsApp (61) 99510-1789.</p>
      </div>
    </div>
  );
}
