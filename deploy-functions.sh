#!/bin/bash
SUPABASE_ACCESS_TOKEN="sbp_0723a6c53fb56c80e3551c70657c4af0e7a7c901"
PROJECT_ID="hdeyegqokbtvbvptbuga"
CLI=~/supabase

export SUPABASE_ACCESS_TOKEN

echo "🔑 Fazendo login..."
$CLI login --token $SUPABASE_ACCESS_TOKEN

echo "🚀 Iniciando deploy das Edge Functions..."

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
  $CLI functions deploy $func --project-ref $PROJECT_ID --no-verify-jwt 2>&1 | tail -2
  echo "---"
done

echo "✅ Deploy concluído!"
