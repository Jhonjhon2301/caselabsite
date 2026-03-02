# 📋 Documentação Completa — Case Lab

> **Última atualização:** Março 2026  
> **Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Lovable Cloud (Supabase)

---

## 📌 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Projeto](#arquitetura)
3. [Páginas Públicas](#páginas-públicas)
4. [Painel Administrativo](#painel-administrativo)
5. [Autenticação & RBAC](#autenticação--rbac)
6. [Banco de Dados (Tabelas)](#banco-de-dados)
7. [Edge Functions (Backend)](#edge-functions)
8. [Integrações Externas](#integrações-externas)
9. [SEO & Marketing](#seo--marketing)
10. [Fluxo de Compra](#fluxo-de-compra)
11. [Portal B2B](#portal-b2b)
12. [Sistema Fiscal (NF-e)](#sistema-fiscal)
13. [O que Está Faltando / Pendências](#pendências)

---

## 1. Visão Geral {#visão-geral}

**Case Lab** é um e-commerce especializado em **garrafas térmicas personalizadas**. O sistema inclui:

- Loja virtual com catálogo de produtos personalizáveis
- Carrinho de compras e checkout (PIX + Cartão)
- Painel administrativo completo com 20+ módulos
- Portal B2B para vendas corporativas
- Sistema de emissão de Nota Fiscal Eletrônica (NF-e)
- Blog integrado
- Sistema de indicação (referral)
- Rastreamento de pedidos
- Recuperação de carrinhos abandonados

---

## 2. Arquitetura do Projeto {#arquitetura}

```
src/
├── assets/            # Imagens e logos
├── components/        # Componentes reutilizáveis (Header, Footer, Cart, etc.)
│   └── ui/            # Componentes shadcn/ui
├── contexts/          # AuthContext, CartContext
├── data/              # Dados estáticos de produtos (fallback)
├── hooks/             # Hooks customizados (useTracking, useMobile)
├── integrations/      # Cliente Supabase (auto-gerado)
├── lib/               # Utilitários (tracking, audit, pdf)
├── pages/             # Todas as páginas
│   └── admin/         # Todas as páginas do painel admin
└── types/             # Tipos TypeScript

supabase/
└── functions/         # 12 Edge Functions (backend serverless)
```

---

## 3. Páginas Públicas {#páginas-públicas}

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Index | Home com hero banner, categorias e grid de produtos |
| `/produto/:id` | ProductPage | Página de produto individual com simulador 3D |
| `/auth` | Auth | Login e cadastro de usuários |
| `/checkout` | Checkout | Carrinho, endereço, cálculo de frete e pagamento |
| `/payment-success` | PaymentSuccess | Página de confirmação de pagamento |
| `/payment-canceled` | PaymentCanceled | Página de pagamento cancelado |
| `/meus-pedidos` | MyOrders | Histórico de pedidos do usuário |
| `/indicar` | Referral | Sistema de indicação com cupom |
| `/blog` | Blog | Listagem de posts do blog |
| `/blog/:slug` | BlogPost | Post individual do blog |
| `/b2b` | B2B | Portal de vendas corporativas |
| `/sobre` | About | Página institucional |
| `/garrafa-personalizada-academia` | SEO Landing | Landing page SEO - academia |
| `/brindes-corporativos-personalizados` | SEO Landing | Landing page SEO - corporativo |
| `/garrafa-termica-com-logo` | SEO Landing | Landing page SEO - logo |

---

## 4. Painel Administrativo {#painel-administrativo}

Todas as rotas começam com `/admin/`. Acesso restrito a usuários com role `admin`.

| Rota | Módulo | Descrição |
|------|--------|-----------|
| `dashboard` | Dashboard | KPIs, gráficos de receita, pedidos recentes |
| `products` | Produtos | CRUD de produtos, upload de imagens, variantes |
| `stock` | Estoque | Controle de estoque por produto |
| `orders` | Pedidos | Lista de pedidos, status, tracking, detalhes |
| `financial` | Financeiro | Despesas fixas/variáveis, vendas manuais |
| `coupons` | Cupons | Criar/gerenciar cupons de desconto |
| `categories` | Categorias | Categorias de produtos com ícones |
| `customers` | Clientes | Base de clientes com perfis e endereços |
| `banner` | Banner | Configuração do hero banner da home |
| `payments` | Pagamentos | Gateway ativo, configurações de PIX/cartão |
| `reminders` | Lembretes | Lembretes com data/hora e WhatsApp |
| `notes` | Notas | Notas internas com cores |
| `team` | Equipe | Membros da equipe e atribuição de cargos |
| `roles` | Cargos | RBAC dinâmico — criar/editar cargos com permissões |
| `designer` | Designer | Gerenciador de arquivos (pastas + upload) |
| `fiscal` | Notas Fiscais | Emissão, consulta e cancelamento de NF-e |
| `blog` | Blog | Editor de posts com SEO meta tags |
| `reviews` | Avaliações | Moderação de avaliações de produtos |
| `production` | Produção | Fila de produção com status por pedido |
| `b2b` | B2B | Aprovação de empresas, gestão de orçamentos |
| `bi` | BI Avançado | Business Intelligence e métricas avançadas |
| `dre` | DRE | Demonstrativo de Resultado do Exercício |
| `audit` | Auditoria | Log de ações administrativas |
| `leads` | Leads | Leads capturados pelo popup |
| `documents` | Documentos | Geração de documentos PDF |

---

## 5. Autenticação & RBAC {#autenticação--rbac}

### Autenticação
- **Método:** Email + Senha (verificação por e-mail obrigatória)
- **Provider:** Lovable Cloud Auth
- **Trigger:** Ao criar conta → cria `profiles` + `user_roles` (role: "user")

### RBAC (Role-Based Access Control)
- **Tabela `user_roles`:** `user_id`, `role` (admin/user), `position` (cargo)
- **Tabela `custom_positions`:** Cargos dinâmicos com permissões granulares
- **Funções SQL:** `is_admin()` e `has_role(user_id, role)` (SECURITY DEFINER)
- **Cargos atuais:** CEO, Designer, Estoquista, Financeiro, Vendedor

### Permissões por Cargo
Cada cargo tem um array de permissões que controla quais abas do admin são visíveis. Exemplo: o cargo "designer" só vê a aba Designer.

---

## 6. Banco de Dados {#banco-de-dados}

### Tabelas Principais (27 tabelas)

| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `profiles` | Dados do usuário (nome, CPF, endereço, etc.) | ✅ |
| `user_roles` | Roles e cargos dos usuários | ✅ |
| `custom_positions` | Cargos personalizados com permissões | ✅ |
| `products` | Catálogo de produtos | ✅ |
| `categories` | Categorias dos produtos | ✅ |
| `orders` | Pedidos | ✅ |
| `order_items` | Itens dos pedidos | ✅ |
| `coupons` | Cupons de desconto | ✅ |
| `b2b_customers` | Clientes B2B (empresas) | ✅ |
| `b2b_quotes` | Orçamentos B2B | ✅ |
| `volume_discounts` | Descontos progressivos por volume | ✅ |
| `expenses` | Despesas variáveis | ✅ |
| `fixed_expenses` | Despesas fixas recorrentes | ✅ |
| `manual_sales` | Vendas manuais (fora do e-commerce) | ✅ |
| `fiscal_notes` | Notas fiscais eletrônicas | ✅ |
| `blog_posts` | Posts do blog | ✅ |
| `product_reviews` | Avaliações de produtos | ✅ |
| `lead_captures` | Leads capturados | ✅ |
| `referrals` | Indicações entre usuários | ✅ |
| `abandoned_carts` | Carrinhos abandonados | ✅ |
| `order_automations` | Automações (e-mail, WhatsApp) | ✅ |
| `production_queue` | Fila de produção | ✅ |
| `admin_audit_log` | Log de auditoria admin | ✅ |
| `admin_notes` | Notas internas | ✅ |
| `reminders` | Lembretes | ✅ |
| `site_settings` | Configurações do site (banner, tracking, etc.) | ✅ |
| `designer_files` / `designer_folders` | Arquivos do designer | ✅ |

### Storage Buckets
- **product-images** (público) — Imagens dos produtos
- **designer-files** (público) — Arquivos de design

---

## 7. Edge Functions (Backend) {#edge-functions}

| Função | Descrição |
|--------|-----------|
| `calculate-shipping` | Calcula frete via Melhor Envio (PAC/SEDEX). Frete grátis: R$150 (DF) / R$180 (outros) |
| `create-checkout` | Cria sessão Stripe para pagamento com cartão |
| `create-pix-checkout` | Gera link PIX via InfinitePay |
| `send-order-email` | Envia e-mails transacionais (confirmação, envio, entrega) via Resend |
| `auto-emit-nfe` | Emite NF-e automaticamente após pagamento confirmado |
| `focus-nfe` | Integração com API Focus NFe (emissão/consulta/cancelamento) |
| `generate-pdf` | Gera PDFs (orçamentos, notas) |
| `generate-sitemap` | Gera sitemap XML dinâmico |
| `order-status-webhook` | Webhook para atualização de status de pedido |
| `process-product-image` | Processa imagens de produtos no upload |
| `recover-abandoned-carts` | Recuperação de carrinhos abandonados |
| `smart-repurchase` | Sugestão inteligente de recompra |

---

## 8. Integrações Externas {#integrações-externas}

| Serviço | Uso | Secret |
|---------|-----|--------|
| **Stripe** | Pagamentos com cartão de crédito | `STRIPE_SECRET_KEY` |
| **InfinitePay** | Pagamentos PIX (handle: "case-lab") | — (handle fixo) |
| **Melhor Envio** | Cálculo de frete (PAC/SEDEX) | `MELHOR_ENVIO_TOKEN` |
| **Resend** | E-mails transacionais | `RESEND_API_KEY` |
| **Focus NFe** | Emissão de Nota Fiscal Eletrônica | `FOCUS_NFE_TOKEN` |
| **Cakto** | Integração de pagamentos | `CAKTO_SECRET_KEY` |

---

## 9. SEO & Marketing {#seo--marketing}

### SEO
- Componente `SEOHead` com title, meta description, OG tags
- 3 landing pages otimizadas para SEO:
  - `/garrafa-personalizada-academia`
  - `/brindes-corporativos-personalizados`
  - `/garrafa-termica-com-logo`
- Geração dinâmica de sitemap via Edge Function
- Blog com meta tags customizáveis por post

### Marketing
- **Popup de lead capture** — Captura email na primeira visita
- **Sistema de indicação** — Cupom para quem indica e para o indicado
- **Recuperação de carrinho abandonado** — Automação via Edge Function
- **Recompra inteligente** — Sugestão automática de nova compra
- **WhatsApp flutuante** — Botão de contato em todas as páginas
- **Tracking integrado** — Pixel de conversão configurável via admin

---

## 10. Fluxo de Compra {#fluxo-de-compra}

```
1. Usuário navega pelos produtos → Adiciona ao carrinho
2. Abre drawer do carrinho → Vai para /checkout
3. Preenche dados pessoais (nome, e-mail, telefone, CPF)
4. Preenche endereço (CEP com autopreenchimento)
5. Sistema calcula frete (Melhor Envio API)
   - Frete grátis: ≥ R$150 (DF) / ≥ R$180 (outros estados)
6. Aplica cupom de desconto (opcional)
7. Escolhe método de pagamento:
   - 💳 Cartão → Stripe Checkout
   - 📱 PIX → InfinitePay
8. Pagamento confirmado → Cria pedido no banco
9. Dispara e-mail de confirmação (Resend)
10. Emissão automática de NF-e (Focus NFe)
11. Pedido entra na fila de produção
12. Admin atualiza status → E-mails automáticos por status
```

---

## 11. Portal B2B {#portal-b2b}

### Funcionalidades
- Cadastro de empresa com CNPJ
- Simulador de preços com descontos progressivos
- Tabela de preços de atacado automática
- Solicitação de orçamentos
- Painel admin para aprovação de clientes e orçamentos

### Descontos por Volume (tabela `volume_discounts`)
Configuráveis pelo admin. Exemplo:
- 10-29 unidades: 10% off
- 30-49 unidades: 15% off
- 50+ unidades: 20% off

---

## 12. Sistema Fiscal (NF-e) {#sistema-fiscal}

- **API:** Focus NFe (ambiente de homologação)
- **Emissão automática:** Ao confirmar pagamento
- **Painel admin:** Status, DANFE (PDF), XML, cancelamento
- **Tipos:** NF-e e NFC-e
- **Requisito:** Certificado Digital A1

---

## 13. O que Está Faltando / Pendências {#pendências}

### 🔴 Crítico
1. **0 produtos cadastrados** — A loja está vazia. Necessário cadastrar produtos via Admin → Produtos
2. **Permissões do CEO incompletas** — ✅ CORRIGIDO (adicionados: production, bi, dre, audit, blog, reviews, leads)
3. **Página "Sobre" com frete desatualizado** — Mostra "Frete grátis acima de R$299,90" (deveria ser R$150/R$180)

### 🟡 Melhorias Recomendadas
4. **Webhook de confirmação de pagamento Stripe** — Não há endpoint para receber webhooks do Stripe confirmando pagamentos (depende do retorno do usuário à página de sucesso)
5. **Webhook de confirmação PIX** — InfinitePay não tem callback configurado
6. **E-mail de boas-vindas** — Não envia e-mail após cadastro do usuário
7. **Recuperação de senha** — Funcionalidade de "esqueci minha senha" não implementada
8. **Perfil do usuário** — Não há página para o usuário editar seu perfil/endereço
9. **Política de privacidade / Termos de uso** — Páginas legais ausentes
10. **Favicon personalizado** — Usando favicon genérico
11. **PWA / App mobile** — Sem manifest ou service worker
12. **Testes automatizados** — Apenas 1 teste de exemplo, sem cobertura real
13. **Cache / Performance** — Sem estratégia de cache no frontend
14. **Domínio personalizado** — Ainda usando domínio lovable.app

### 🟢 Nice-to-have
15. **Wishlist / Favoritos** — Lista de desejos para o cliente
16. **Comparador de produtos** — Comparar garrafas lado a lado
17. **Notificações push** — Alertas de promoção/status do pedido
18. **Chat ao vivo** — Além do WhatsApp
19. **Multi-idioma** — Suporte a inglês/espanhol
20. **Reviews com fotos** — Upload de fotos nas avaliações (estrutura existe, falta UI)
21. **Programa de fidelidade** — Pontos por compra

---

## 📊 Resumo de Status

| Área | Status |
|------|--------|
| Frontend (UI/UX) | ✅ Completo |
| Autenticação | ✅ Completo |
| RBAC Admin | ✅ Completo |
| Checkout Cartão | ✅ Configurado (Stripe) |
| Checkout PIX | ✅ Configurado (InfinitePay) |
| Cálculo de Frete | ✅ Funcionando (Melhor Envio) |
| E-mails Transacionais | ✅ Configurado (Resend) |
| NF-e | ✅ Homologação (Focus NFe) |
| Blog | ✅ Completo |
| B2B | ✅ Completo |
| SEO | ✅ Landing pages + sitemap |
| Produtos Cadastrados | ❌ 0 produtos |
| Webhooks de Pagamento | ⚠️ Parcial |
| Testes | ❌ Sem cobertura |
| Domínio Próprio | ❌ Não configurado |

---

*Documentação gerada automaticamente em Março/2026.*
