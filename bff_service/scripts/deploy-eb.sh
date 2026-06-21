#!/usr/bin/env bash
set -euo pipefail

APP_NAME="VladTarnovskiy-bff-api"
ENV_NAME="${1:-prod}"
CNAME="${APP_NAME}-${ENV_NAME}"
REGION="eu-west-1"
PLATFORM="Node.js 20 running on 64bit Amazon Linux 2023"

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${product:?Set product in bff_service/.env before deploy}"
: "${products:?Set products in bff_service/.env before deploy}"
: "${cart:?Set cart in bff_service/.env before deploy}"

if [[ ! -d .elasticbeanstalk ]]; then
  eb init "$APP_NAME" --platform "$PLATFORM" --region "$REGION"
fi

if eb status "$ENV_NAME" >/dev/null 2>&1; then
  HEALTH="$(eb status "$ENV_NAME" | awk -F': ' '/Health:/ {print $2}')"
  if [[ "$HEALTH" == "Grey" || "$HEALTH" == "Red" ]]; then
    echo "Environment $ENV_NAME is unhealthy ($HEALTH). Rebuilding..."
    eb rebuild "$ENV_NAME"
  else
    echo "Deploying to existing environment: $ENV_NAME"
    eb deploy "$ENV_NAME"
  fi
else
  echo "Creating environment: $ENV_NAME"
  eb create "$ENV_NAME" --single --cname "$CNAME"
fi

eb setenv \
  product="$product" \
  products="$products" \
  cart="$cart" \
  --environment "$ENV_NAME"

eb status "$ENV_NAME"
