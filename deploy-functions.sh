#!/bin/bash
export SUPABASE_ACCESS_TOKEN="sbp_505e198eba8ef835622c5941b0709a7d98cb2ad6"
PROJECT_ID="hdeyegqokbtvbvptbuga"
CLI=~/supabase

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
