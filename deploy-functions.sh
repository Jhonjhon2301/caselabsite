#!/bin/bash
# Script para fazer deploy de todas as Edge Functions no Supabase
# Execute: chmod +x deploy-functions.sh && ./deploy-functions.sh

SUPABASE_ACCESS_TOKEN="sbp_c2b3eb20ebf4393a3c4b1e7715a16590fc2cabf0"
PROJECT_ID="hdeyegqokbtvbvptbuga"

echo "🚀 Iniciando deploy das Edge Functions..."
echo ""

# Login
export SUPABASE_ACCESS_TOKEN

supabase login --token $SUPABASE_ACCESS_TOKEN 2>/dev/null || true

# Link project
supabase link --project-ref $PROJECT_ID

# Deploy all functions
FUNCTIONS=(
  "auto-emit-nfe"
  "calculate-shipping"
  "create-checkout"
  "create-pix-checkout"
  "focus-nfe"
  "generate-pdf"
  "generate-sitemap"
  "order-status-webhook"
  "process-product-image"
  "recover-abandoned-carts"
  "retry-payment"
  "send-newsletter"
  "send-order-email"
  "smart-repurchase"
  "stripe-webhook"
)

for func in "${FUNCTIONS[@]}"; do
  echo "📦 Deployando: $func"
  supabase functions deploy $func --no-verify-jwt 2>&1 | tail -2
done

echo ""
echo "✅ Deploy concluído!"
