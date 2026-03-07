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
11. [Carrinho Compartilhado](#carrinho-compartilhado)
12. [Portal B2B](#portal-b2b)
13. [Sistema Fiscal (NF-e)](#sistema-fiscal)
14. [Módulos Financeiros](#módulos-financeiros)
15. [Estoque Interno](#estoque-interno)
16. [Pendências & Melhorias](#pendências)

---

## 1. Visão Geral

**Case Lab** é um e-commerce especializado em **garrafas térmicas personalizadas**. O sistema inclui:

- Loja virtual com catálogo de produtos personalizáveis
- Carrinho de compras e checkout (PIX + Cartão via Stripe)
- Painel administrativo completo com 25+ módulos
- Portal B2B para vendas corporativas
- Sistema de emissão de Nota Fiscal Eletrônica (NF-e)
- Blog integrado com SEO
- Sistema de indicação (referral)
- Rastreamento de pedidos
- Recuperação de carrinhos abandonados
- Carrinho compartilhado com restrição de pagamento

---

## 2. Arquitetura do Projeto

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
├── test/              # Testes unitários
└── types/             # Tipos TypeScript

supabase/
└── functions/         # 14 Edge Functions (backend serverless)
```

---

## 3. Páginas Públicas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Index | Home com hero banner, categorias e grid de produtos |
| `/produto/:id` | ProductPage | Página de produto com simulador 3D |
| `/auth` | Auth | Login e cadastro de usuários |
| `/checkout` | Checkout | Dados pessoais, endereço, frete e pagamento |
| `/payment-success` | PaymentSuccess | Confirmação de pagamento |
| `/payment-canceled` | PaymentCanceled | Pagamento cancelado |
| `/meus-pedidos` | MyOrders | Histórico de pedidos do usuário |
| `/perfil` | Profile | Edição de perfil do usuário |
| `/indicar` | Referral | Sistema de indicação com cupom |
| `/carrinho/:id` | SharedCart | Carrinho montado pelo admin |
| `/blog` | Blog | Listagem de posts |
| `/blog/:slug` | BlogPost | Post individual |
| `/b2b` | B2B | Portal de vendas corporativas |
| `/sobre` | About | Página institucional |
| `/termos` | Terms | Termos de uso |
| `/privacidade` | Privacy | Política de privacidade |
| `/reset-password` | ResetPassword | Recuperação de senha |
| `/garrafa-personalizada-academia` | SEO Landing | Landing page SEO |
| `/brindes-corporativos-personalizados` | SEO Landing | Landing page SEO |
| `/garrafa-termica-com-logo` | SEO Landing | Landing page SEO |

---

## 4. Painel Administrativo

Todas as rotas começam com `/admin/`. Acesso restrito via RBAC.

### Vendas & Operações
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `dashboard` | KPIs, gráficos de receita, pedidos recentes |
| Pedidos | `orders` | Lista de pedidos, status, tracking, detalhes |
| Produção | `production` | Fila de produção com status por pedido |
| Montar Carrinho | `shared-cart` | Criar carrinho para cliente com método de pagamento |

### Catálogo
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Produtos | `products` | CRUD de produtos, upload de imagens, variantes |
| Categorias | `categories` | Categorias de produtos com ícones |
| Estoque | `stock` | Controle de estoque por produto |
| Estoque Interno | `internal_stock` | Insumos e materiais (altura, circunferência, fornecedor) |

### Clientes & Marketing
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Clientes | `customers` | Base de clientes com perfis e endereços |
| Leads | `leads` | Leads capturados pelo popup |
| B2B | `b2b` | Aprovação de empresas, gestão de orçamentos |

### Financeiro
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Financeiro | `financial` | Despesas, vendas manuais, gastos fixos (com edição) |
| DRE | `dre` | Demonstrativo de Resultado do Exercício |
| Pagamentos | `payments` | Gateway ativo, configurações PIX/cartão |
| Cupons | `coupons` | Criar/gerenciar cupons de desconto |
| Propostas | `proposals` | Propostas comerciais |

### Conteúdo
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Blog | `blog` | Editor de posts com SEO meta tags |
| Avaliações | `reviews` | Moderação de avaliações de produtos |
| Newsletter | `newsletter` | Envio de newsletters |
| Banner | `banner` | Configuração do hero banner da home |
| Designer | `designer` | Gerenciador de arquivos (pastas + upload) |

### Fiscal & Documentos
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Notas Fiscais | `fiscal` | Emissão, consulta e cancelamento de NF-e |
| Documentos | `documents` | Geração de documentos PDF |

### Administração
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Equipe | `team` | Membros da equipe e atribuição de cargos |
| Cargos | `roles` | RBAC dinâmico — criar/editar cargos com permissões |
| Auditoria | `audit` | Log de ações administrativas |

### Ferramentas
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Lembretes | `reminders` | Lembretes com data/hora e WhatsApp |
| Notas | `notes` | Notas internas com cores |
| BI Avançado | `bi` | Business Intelligence e métricas avançadas |
| Documentação | `docs` | Documentação técnica do sistema |

---

## 5. Autenticação & RBAC

### Autenticação
- **Método:** Email + Senha (verificação por e-mail obrigatória)
- **Provider:** Lovable Cloud Auth
- **Trigger:** Ao criar conta → cria `profiles` + `user_roles` (role: "user")

### RBAC (Role-Based Access Control)
- **Tabela `user_roles`:** `user_id`, `role` (admin/user), `position` (cargo)
- **Tabela `custom_positions`:** Cargos dinâmicos com permissões granulares
- **Funções SQL:** `is_admin()` e `has_role(user_id, role)` (SECURITY DEFINER)

### Permissões por Cargo
Cada cargo tem um array de permissões que controla quais abas do admin são visíveis. O CEO tem acesso a todas as abas automaticamente.

---

## 6. Banco de Dados

### Tabelas Principais (29 tabelas)

| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `profiles` | Dados do usuário (nome, CPF, endereço) | ✅ |
| `user_roles` | Roles e cargos dos usuários | ✅ |
| `custom_positions` | Cargos personalizados com permissões | ✅ |
| `products` | Catálogo de produtos | ✅ |
| `categories` | Categorias dos produtos | ✅ |
| `orders` | Pedidos | ✅ |
| `order_items` | Itens dos pedidos | ✅ |
| `coupons` | Cupons de desconto | ✅ |
| `shared_carts` | Carrinhos montados com método de pagamento | ✅ |
| `internal_stock` | Estoque interno (insumos, medidas) | ✅ |
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
| `site_settings` | Configurações do site | ✅ |
| `designer_files` / `designer_folders` | Arquivos do designer | ✅ |

### Storage Buckets
- **product-images** (público) — Imagens dos produtos
- **designer-files** (público) — Arquivos de design

---

## 7. Edge Functions (Backend)

| Função | Descrição |
|--------|-----------|
| `calculate-shipping` | Calcula frete via Melhor Envio. Frete grátis: R$150 (DF) / R$180 (outros) |
| `create-checkout` | Cria sessão Stripe para pagamento com cartão |
| `create-pix-checkout` | Gera link PIX |
| `stripe-webhook` | Webhook para confirmação de pagamento Stripe |
| `send-order-email` | E-mails transacionais via Resend |
| `send-newsletter` | Envio de newsletters |
| `auto-emit-nfe` | Emite NF-e automaticamente após pagamento |
| `focus-nfe` | Integração com API Focus NFe |
| `generate-pdf` | Gera PDFs (orçamentos, notas) |
| `generate-sitemap` | Gera sitemap XML dinâmico |
| `order-status-webhook` | Webhook para atualização de status |
| `process-product-image` | Processa imagens de produtos |
| `recover-abandoned-carts` | Recuperação de carrinhos abandonados |
| `retry-payment` | Retry de pagamentos falhados |
| `smart-repurchase` | Sugestão inteligente de recompra |

---

## 8. Integrações Externas

| Serviço | Uso | Secret |
|---------|-----|--------|
| **Stripe** | Pagamentos com cartão | `STRIPE_SECRET_KEY` |
| **Melhor Envio** | Cálculo de frete (PAC/SEDEX) | `MELHOR_ENVIO_TOKEN` |
| **Resend** | E-mails transacionais | `RESEND_API_KEY` |
| **Focus NFe** | Emissão de NF-e | `FOCUS_NFE_TOKEN` |

---

## 9. SEO & Marketing

### SEO
- Componente `SEOHead` com title, meta description, OG tags
- 3 landing pages otimizadas para SEO
- Geração dinâmica de sitemap via Edge Function
- Blog com meta tags customizáveis

### Marketing
- **Popup de lead capture** — Captura email na primeira visita
- **Sistema de indicação** — Cupom para quem indica e indicado
- **Recuperação de carrinho** — Automação via Edge Function
- **WhatsApp flutuante** — Botão de contato em todas as páginas
- **Tracking integrado** — Pixel de conversão via admin

---

## 10. Fluxo de Compra

```
1. Usuário navega → Adiciona ao carrinho
2. Vai para /checkout
3. Preenche dados pessoais (nome, e-mail, telefone, CPF)
4. Preenche endereço (CEP com autopreenchimento via ViaCEP)
5. Frete calculado automaticamente (Melhor Envio)
   → Frete grátis: ≥ R$150 (DF) / ≥ R$180 (outros)
6. Cupom de desconto (opcional)
7. Pagamento:
   → 📱 PIX → Pedido criado + WhatsApp
   → 💳 Cartão → Stripe Checkout
8. Confirmação → E-mail via Resend
9. NF-e automática (Focus NFe)
10. Fila de produção
```

---

## 11. Carrinho Compartilhado

O admin pode montar carrinhos personalizados para clientes:

1. **Admin** seleciona produtos/variantes em `/admin/shared-cart`
2. **Admin** define forma de pagamento: PIX, Cartão ou Ambos
3. Sistema gera link compartilhável `/carrinho/:id`
4. **Cliente** acessa o link → vê os produtos selecionados
5. **Cliente** adiciona ao carrinho → checkout com método restrito
6. Se admin selecionou "Somente PIX", o cliente só vê PIX no checkout

---

## 12. Portal B2B

- Cadastro de empresa com CNPJ
- Simulador de preços com descontos progressivos
- Solicitação de orçamentos
- Painel admin para aprovação

### Descontos por Volume
Configuráveis pelo admin (tabela `volume_discounts`).

---

## 13. Sistema Fiscal (NF-e)

- **API:** Focus NFe (ambiente de homologação)
- **Emissão automática:** Ao confirmar pagamento
- **Painel:** Status, DANFE (PDF), XML, cancelamento
- **Tipos:** NF-e e NFC-e

---

## 14. Módulos Financeiros

### Despesas Variáveis
- CRUD completo com edição inline
- Categorias, datas, vencimento
- Status: pendente/pago com toggle
- Alerta de despesas vencidas

### Gastos Fixos
- Despesas recorrentes (mensal/semanal/anual)
- Ativar/desativar com toggle
- Edição de valor, categoria, recorrência

### Vendas Manuais
- Registro de vendas fora do e-commerce
- Edição completa (descrição, valor, cliente, data)
- Integrado ao cálculo de receita total

### DRE
- Demonstrativo de Resultado do Exercício
- Consolidação automática de receitas e despesas

---

## 15. Estoque Interno

Módulo privado para controle de insumos e materiais de produção:

- **Campos:** Nome, descrição, categoria, quantidade, mínimo, custo unitário
- **Medidas:** Altura (cm) e Circunferência (cm)
- **Extras:** Fornecedor, localização, observações
- **KPIs:** Total de itens, valor em estoque, alertas de estoque baixo
- **Categorias:** Garrafas, Tampas, Embalagens, Adesivos, Tintas, Outros

---

## 16. Pendências & Melhorias

### 🟡 Recomendado
- Webhook de confirmação de pagamento Stripe (parcial)
- E-mail de boas-vindas após cadastro
- PWA / Service Worker
- Testes automatizados com cobertura real
- Cache / Performance otimizations
- Domínio personalizado

### 🟢 Nice-to-have
- Wishlist / Favoritos
- Comparador de produtos
- Notificações push
- Chat ao vivo
- Multi-idioma
- Reviews com fotos (estrutura existe)
- Programa de fidelidade

---

## 📊 Resumo de Status

| Área | Status |
|------|--------|
| Frontend (UI/UX) | ✅ Completo |
| Autenticação | ✅ Completo |
| RBAC Admin | ✅ Completo |
| Checkout Cartão (Stripe) | ✅ Configurado |
| Checkout PIX (WhatsApp) | ✅ Configurado |
| Cálculo de Frete | ✅ Funcionando |
| E-mails Transacionais | ✅ Configurado |
| NF-e | ✅ Homologação |
| Blog | ✅ Completo |
| B2B | ✅ Completo |
| SEO | ✅ Landing pages + sitemap |
| Carrinho Compartilhado | ✅ Com restrição de pagamento |
| Estoque Interno | ✅ Com medidas |
| Financeiro | ✅ CRUD completo com edição |

---

*Documentação atualizada em Março/2026.*
