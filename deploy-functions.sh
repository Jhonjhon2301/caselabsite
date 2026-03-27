#!/bin/bash
SUPABASE_ACCESS_TOKEN="sbp_c2b3eb20ebf4393a3c4b1e7715a16590fc2cabf0"
PROJECT_ID="hdeyegqokbtvbvptbuga"
CLI=~/supabase

export SUPABASE_ACCESS_TOKEN

echo "🔑 Fazendo login..."
$CLI login --token $SUPABASE_ACCESS_TOKEN

echo "🔗 Linkando projeto..."
$CLI link --project-ref $PROJECT_ID --password ""

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
  $CLI functions deploy $func --project-ref $PROJECT_ID --no-verify-jwt 2>&1 | tail -3
  echo "---"
done

echo "✅ Deploy concluído!"
