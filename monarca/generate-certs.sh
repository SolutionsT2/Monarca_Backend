#!/usr/bin/env bash
# Genera certificados SSL autofirmados para desarrollo local.
# Los archivos se crean en ./certs/ (ignorados por .gitignore).

set -e

CERT_DIR="./certs"

if [ -f "$CERT_DIR/key.pem" ] && [ -f "$CERT_DIR/cert.pem" ]; then
  echo "✅ Los certificados ya existen en $CERT_DIR"
  exit 0
fi

mkdir -p "$CERT_DIR"

echo "🔐 Generando certificados autofirmados en $CERT_DIR ..."

openssl req -x509 -newkey rsa:2048 \
  -keyout "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/cert.pem" \
  -days 365 \
  -nodes \
  -subj "/CN=localhost"

echo "✅ Certificados generados:"
echo "   $CERT_DIR/key.pem (clave privada)"
echo "   $CERT_DIR/cert.pem (certificado)"
echo ""
echo "⚠️  Estos certificados son solo para desarrollo local."
