import { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Database, Globe, CreditCard, Shield, Package, Truck, Mail, FileText, Users, BarChart3, Factory, Building2 } from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function AdminDocs() {
  const [openSections, setOpenSections] = useState<string[]>(["overview"]);

  const toggle = (id: string) =>
    setOpenSections((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const sections: Section[] = [
    {
      id: "overview",
      title: "Visão Geral",
      icon: BookOpen,
      content: (
        <div className="space-y-3 text-sm">
          <p><strong>Case Lab</strong> é um e-commerce especializado em garrafas térmicas personalizadas.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Loja virtual com catálogo de produtos personalizáveis</li>
            <li>Carrinho de compras e checkout (PIX via WhatsApp + Cartão via Stripe)</li>
            <li>Painel administrativo com 25+ módulos</li>
            <li>Portal B2B para vendas corporativas</li>
            <li>Sistema de emissão de NF-e (Focus NFe)</li>
            <li>Blog integrado com SEO</li>
            <li>Sistema de indicação com cupons</li>
            <li>Rastreamento de pedidos pelo cliente</li>
            <li>Recuperação de carrinhos abandonados</li>
          </ul>
          <p className="text-muted-foreground"><strong>Stack:</strong> React 18 + Vite + TypeScript + Tailwind CSS + Lovable Cloud</p>
        </div>
      ),
    },
    {
      id: "pages",
      title: "Páginas Públicas",
      icon: Globe,
      content: (
        <div className="text-sm">
          <table className="w-full text-left">
            <thead><tr className="border-b border-border"><th className="py-2 font-semibold">Rota</th><th className="py-2 font-semibold">Descrição</th></tr></thead>
            <tbody className="divide-y divide-border">
              {[
                ["/", "Home com hero, categorias e produtos"],
                ["/produto/:id", "Página de produto com simulador 3D"],
                ["/auth", "Login e cadastro"],
                ["/checkout", "Carrinho, endereço, frete e pagamento"],
                ["/payment-success", "Confirmação de pagamento"],
                ["/meus-pedidos", "Histórico e rastreamento de pedidos"],
                ["/indicar", "Sistema de indicação com cupom"],
                ["/blog", "Listagem de posts"],
                ["/b2b", "Portal vendas corporativas"],
                ["/sobre", "Página institucional"],
                ["/perfil", "Perfil do usuário"],
                ["/termos", "Termos de uso"],
                ["/privacidade", "Política de privacidade"],
              ].map(([rota, desc]) => (
                <tr key={rota}><td className="py-1.5 font-mono text-xs text-primary">{rota}</td><td className="py-1.5">{desc}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: "admin",
      title: "Módulos do Painel Admin",
      icon: Shield,
      content: (
        <div className="text-sm">
          <table className="w-full text-left">
            <thead><tr className="border-b border-border"><th className="py-2 font-semibold">Módulo</th><th className="py-2 font-semibold">Descrição</th></tr></thead>
            <tbody className="divide-y divide-border">
              {[
                ["Dashboard", "KPIs, gráficos de receita, pedidos recentes"],
                ["Produtos", "CRUD de produtos, upload de imagens, variantes"],
                ["Estoque", "Controle de estoque por produto"],
                ["Pedidos", "Lista de pedidos, status, tracking, detalhes"],
                ["Financeiro", "Despesas fixas/variáveis, vendas manuais"],
                ["Cupons", "Criar/gerenciar cupons de desconto"],
                ["Categorias", "Categorias de produtos com ícones"],
                ["Clientes", "Base de clientes com perfis e endereços"],
                ["Banner", "Configuração do hero banner"],
                ["Pagamentos", "Gateway ativo, PIX/cartão"],
                ["Lembretes", "Lembretes com data/hora e WhatsApp"],
                ["Notas", "Notas internas com cores"],
                ["Equipe", "Membros e atribuição de cargos"],
                ["Cargos", "RBAC dinâmico com permissões"],
                ["Designer", "Gerenciador de arquivos"],
                ["Notas Fiscais", "Emissão, consulta e cancelamento de NF-e"],
                ["Blog", "Editor de posts com SEO"],
                ["Avaliações", "Moderação de avaliações"],
                ["Produção", "Fila de produção por pedido"],
                ["B2B", "Aprovação de empresas e orçamentos"],
                ["BI Avançado", "Business Intelligence"],
                ["DRE", "Demonstrativo de Resultado"],
                ["Auditoria", "Log de ações administrativas"],
                ["Leads", "Leads capturados pelo popup"],
                ["Documentos", "Geração de documentos PDF"],
                ["Documentação", "Esta página"],
              ].map(([mod, desc]) => (
                <tr key={mod}><td className="py-1.5 font-semibold">{mod}</td><td className="py-1.5">{desc}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: "auth",
      title: "Autenticação & RBAC",
      icon: Shield,
      content: (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">Autenticação</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email + Senha com verificação obrigatória</li>
              <li>Ao criar conta → cria <code className="bg-muted px-1 rounded">profiles</code> + <code className="bg-muted px-1 rounded">user_roles</code> automaticamente</li>
              <li>Recuperação de senha via e-mail</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1">RBAC</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tabela <code className="bg-muted px-1 rounded">user_roles</code>: user_id, role (admin/user), position (cargo)</li>
              <li>Tabela <code className="bg-muted px-1 rounded">custom_positions</code>: Cargos dinâmicos com permissões granulares</li>
              <li>Funções SQL: <code className="bg-muted px-1 rounded">is_admin()</code> e <code className="bg-muted px-1 rounded">has_role()</code></li>
              <li>Cargos: CEO, Designer, Estoquista, Financeiro, Vendedor</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "database",
      title: "Banco de Dados (27 tabelas)",
      icon: Database,
      content: (
        <div className="text-sm">
          <table className="w-full text-left">
            <thead><tr className="border-b border-border"><th className="py-2 font-semibold">Tabela</th><th className="py-2 font-semibold">Descrição</th><th className="py-2 font-semibold">RLS</th></tr></thead>
            <tbody className="divide-y divide-border">
              {[
                ["profiles", "Dados do usuário", "✅"],
                ["user_roles", "Roles e cargos", "✅"],
                ["custom_positions", "Cargos com permissões", "✅"],
                ["products", "Catálogo de produtos", "✅"],
                ["categories", "Categorias", "✅"],
                ["orders", "Pedidos", "✅"],
                ["order_items", "Itens dos pedidos", "✅"],
                ["coupons", "Cupons de desconto", "✅"],
                ["b2b_customers", "Clientes B2B", "✅"],
                ["b2b_quotes", "Orçamentos B2B", "✅"],
                ["volume_discounts", "Descontos por volume", "✅"],
                ["expenses", "Despesas variáveis", "✅"],
                ["fixed_expenses", "Despesas fixas", "✅"],
                ["manual_sales", "Vendas manuais", "✅"],
                ["fiscal_notes", "Notas fiscais", "✅"],
                ["blog_posts", "Posts do blog", "✅"],
                ["product_reviews", "Avaliações", "✅"],
                ["lead_captures", "Leads", "✅"],
                ["referrals", "Indicações", "✅"],
                ["abandoned_carts", "Carrinhos abandonados", "✅"],
                ["order_automations", "Automações", "✅"],
                ["production_queue", "Fila de produção", "✅"],
                ["admin_audit_log", "Log de auditoria", "✅"],
                ["admin_notes", "Notas internas", "✅"],
                ["reminders", "Lembretes", "✅"],
                ["site_settings", "Configurações do site", "✅"],
                ["designer_files/folders", "Arquivos do designer", "✅"],
              ].map(([t, d, r]) => (
                <tr key={t}><td className="py-1.5 font-mono text-xs">{t}</td><td className="py-1.5">{d}</td><td className="py-1.5">{r}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-muted-foreground"><strong>Storage:</strong> product-images (público), designer-files (público)</p>
        </div>
      ),
    },
    {
      id: "edge",
      title: "Edge Functions (Backend)",
      icon: FileText,
      content: (
        <div className="text-sm">
          <table className="w-full text-left">
            <thead><tr className="border-b border-border"><th className="py-2 font-semibold">Função</th><th className="py-2 font-semibold">Descrição</th></tr></thead>
            <tbody className="divide-y divide-border">
              {[
                ["calculate-shipping", "Calcula frete via Melhor Envio (PAC/SEDEX). Frete grátis: R$150 (DF) / R$180 (outros)"],
                ["create-checkout", "Cria sessão Stripe para pagamento com cartão"],
                ["create-pix-checkout", "Gera link PIX via InfinitePay (backup)"],
                ["send-order-email", "E-mails transacionais via Resend"],
                ["auto-emit-nfe", "Emite NF-e após pagamento confirmado"],
                ["focus-nfe", "Integração API Focus NFe"],
                ["generate-pdf", "Gera PDFs (orçamentos, notas)"],
                ["generate-sitemap", "Sitemap XML dinâmico"],
                ["order-status-webhook", "Webhook atualização de status"],
                ["process-product-image", "Processa imagens no upload"],
                ["recover-abandoned-carts", "Recuperação de carrinhos"],
                ["smart-repurchase", "Sugestão de recompra"],
                ["stripe-webhook", "Webhook do Stripe"],
              ].map(([f, d]) => (
                <tr key={f}><td className="py-1.5 font-mono text-xs text-primary">{f}</td><td className="py-1.5">{d}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: "integrations",
      title: "Integrações Externas",
      icon: CreditCard,
      content: (
        <div className="text-sm">
          <table className="w-full text-left">
            <thead><tr className="border-b border-border"><th className="py-2 font-semibold">Serviço</th><th className="py-2 font-semibold">Uso</th><th className="py-2 font-semibold">Status</th></tr></thead>
            <tbody className="divide-y divide-border">
              {[
                ["Stripe", "Cartão de crédito", "✅ Configurado"],
                ["WhatsApp (PIX)", "Pedidos PIX manuais", "✅ Ativo"],
                ["Melhor Envio", "Cálculo de frete", "✅ Configurado"],
                ["Resend", "E-mails transacionais", "✅ Configurado"],
                ["Focus NFe", "Nota Fiscal Eletrônica", "✅ Homologação"],
                ["ViaCEP", "Autopreenchimento de endereço", "✅ Ativo"],
              ].map(([s, u, st]) => (
                <tr key={s}><td className="py-1.5 font-semibold">{s}</td><td className="py-1.5">{u}</td><td className="py-1.5">{st}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: "purchase-flow",
      title: "Fluxo de Compra",
      icon: Package,
      content: (
        <div className="text-sm space-y-2">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Usuário navega pelos produtos → Adiciona ao carrinho</li>
            <li>Abre drawer do carrinho → Vai para /checkout</li>
            <li>Preenche dados pessoais (nome, e-mail, telefone, CPF)</li>
            <li>Preenche endereço (CEP com autopreenchimento via ViaCEP)</li>
            <li>Sistema calcula frete (Melhor Envio API)
              <ul className="list-disc pl-5 mt-1">
                <li>Frete grátis: ≥ R$150 (DF) / ≥ R$180 (outros estados)</li>
              </ul>
            </li>
            <li>Aplica cupom de desconto (opcional)</li>
            <li>Escolhe método de pagamento:
              <ul className="list-disc pl-5 mt-1">
                <li>💳 Cartão → Stripe Checkout (automático)</li>
                <li>📱 PIX → WhatsApp com detalhes do pedido (manual)</li>
              </ul>
            </li>
            <li><strong>Cartão:</strong> Pagamento → Página de sucesso → NF-e automática</li>
            <li><strong>PIX:</strong> Admin recebe no WhatsApp → Confirma pagamento → Aprova no painel</li>
            <li>Pedido entra na fila de produção</li>
            <li>Admin atualiza status → cliente acompanha em "Meus Pedidos"</li>
          </ol>
        </div>
      ),
    },
    {
      id: "shipping",
      title: "Frete",
      icon: Truck,
      content: (
        <div className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>API:</strong> Melhor Envio (PAC e SEDEX)</li>
            <li><strong>Frete grátis DF:</strong> Pedidos ≥ R$150</li>
            <li><strong>Frete grátis outros:</strong> Pedidos ≥ R$180</li>
            <li><strong>Margem configurável:</strong> Valor fixo ou percentual (Admin → Pagamentos)</li>
            <li>Cálculo automático ao digitar CEP</li>
          </ul>
        </div>
      ),
    },
    {
      id: "b2b",
      title: "Portal B2B",
      icon: Building2,
      content: (
        <div className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>Cadastro de empresa com CNPJ</li>
            <li>Simulador de preços com descontos progressivos</li>
            <li>Tabela de preços automática por volume</li>
            <li>Solicitação de orçamentos</li>
            <li>Aprovação pelo admin</li>
          </ul>
          <div>
            <h4 className="font-semibold mb-1">Descontos por Volume (exemplo)</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>10-29 unidades: 10% off</li>
              <li>30-49 unidades: 15% off</li>
              <li>50+ unidades: 20% off</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "fiscal",
      title: "Sistema Fiscal (NF-e)",
      icon: FileText,
      content: (
        <div className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>API:</strong> Focus NFe (ambiente de homologação)</li>
            <li>Emissão automática ao confirmar pagamento</li>
            <li>Painel admin: Status, DANFE (PDF), XML, cancelamento</li>
            <li>Tipos: NF-e e NFC-e</li>
            <li>Requisito: Certificado Digital A1</li>
          </ul>
        </div>
      ),
    },
    {
      id: "seo",
      title: "SEO & Marketing",
      icon: BarChart3,
      content: (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">SEO</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Componente SEOHead com title, meta description, OG tags</li>
              <li>3 landing pages otimizadas para SEO</li>
              <li>Sitemap dinâmico via Edge Function</li>
              <li>Blog com meta tags customizáveis</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Marketing</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Popup de lead capture na primeira visita</li>
              <li>Sistema de indicação com cupons</li>
              <li>Recuperação de carrinho abandonado</li>
              <li>Recompra inteligente</li>
              <li>WhatsApp flutuante</li>
              <li>Tracking de conversão configurável</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "emails",
      title: "E-mails Transacionais",
      icon: Mail,
      content: (
        <div className="space-y-3 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Provedor:</strong> Resend</li>
            <li>Confirmação de pedido</li>
            <li>Pedido enviado (com código de rastreio)</li>
            <li>Pedido entregue</li>
            <li>Recuperação de carrinho abandonado</li>
          </ul>
        </div>
      ),
    },
    {
      id: "production",
      title: "Fila de Produção",
      icon: Factory,
      content: (
        <div className="space-y-3 text-sm">
          <p>Fluxo de produção por pedido:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Aguardando Arte</strong> — Designer prepara a arte</li>
            <li><strong>Arte Aprovada</strong> — Cliente/admin aprova</li>
            <li><strong>Em Produção</strong> — Produto sendo fabricado</li>
            <li><strong>Produção Concluída</strong> — Pronto para envio</li>
            <li><strong>Enviado</strong> — Postado na transportadora</li>
          </ol>
          <p className="text-muted-foreground">Cada etapa é rastreável pelo admin no módulo Produção, e o cliente acompanha em "Meus Pedidos".</p>
        </div>
      ),
    },
    {
      id: "tracking",
      title: "Acompanhamento pelo Cliente",
      icon: Users,
      content: (
        <div className="space-y-3 text-sm">
          <p>O cliente acessa <code className="bg-muted px-1 rounded">/meus-pedidos</code> e visualiza:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Timeline visual do status (Pendente → Confirmado → Produção → Enviado → Entregue)</li>
            <li>Detalhes do endereço de entrega</li>
            <li>Status do pagamento</li>
            <li>Código de rastreio (copiável)</li>
            <li>Transportadora e previsão de entrega</li>
            <li>Lista de itens do pedido</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Documentação
        </h1>
        <p className="text-sm text-muted-foreground">Documentação completa do sistema Case Lab</p>
      </div>

      <div className="space-y-2">
        {sections.map((section) => {
          const isOpen = openSections.includes(section.id);
          const Icon = section.icon;
          return (
            <div key={section.id} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
              >
                <Icon className="w-5 h-5 text-primary shrink-0" />
                <span className="font-semibold text-sm flex-1">{section.title}</span>
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-border">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}