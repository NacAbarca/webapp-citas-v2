#!/usr/bin/env bash
set -euo pipefail

# Load Railway credentials from backend/.env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../backend/.env"

if [[ -f "$ENV_FILE" ]]; then
  export $(grep -E '^RAILWAY_' "$ENV_FILE" | xargs)
fi

: "${RAILWAY_HOST:?RAILWAY_HOST no definido en backend/.env}"
: "${RAILWAY_PORT:?RAILWAY_PORT no definido en backend/.env}"
: "${RAILWAY_DB:?RAILWAY_DB no definido en backend/.env}"
: "${RAILWAY_USER:?RAILWAY_USER no definido en backend/.env}"
: "${RAILWAY_PASS:?RAILWAY_PASS no definido en backend/.env}"

echo "==> Conectando a Railway: $RAILWAY_HOST:$RAILWAY_PORT / $RAILWAY_DB"

# 1. Schema
echo "==> Aplicando schema..."
mysql -h "$RAILWAY_HOST" -P "$RAILWAY_PORT" -u "$RAILWAY_USER" \
  -p"$RAILWAY_PASS" "$RAILWAY_DB" \
  < "$SCRIPT_DIR/../sql/schema.sql"

# 2. Exportar datos locales
echo "==> Exportando datos locales (webapp_citas)..."
mysqldump -u root --no-create-info --insert-ignore webapp_citas \
  users pacientes appointments appointment_status_history login_logs \
  > /tmp/webapp_data.sql

echo "==> Importando datos en Railway..."
mysql -h "$RAILWAY_HOST" -P "$RAILWAY_PORT" -u "$RAILWAY_USER" \
  -p"$RAILWAY_PASS" "$RAILWAY_DB" \
  < /tmp/webapp_data.sql

rm -f /tmp/webapp_data.sql

# 3. Verificar
echo "==> Verificando conteos..."
mysql -h "$RAILWAY_HOST" -P "$RAILWAY_PORT" -u "$RAILWAY_USER" \
  -p"$RAILWAY_PASS" "$RAILWAY_DB" -e "
    SELECT 'users'        AS tabla, COUNT(*) AS total FROM users       UNION ALL
    SELECT 'pacientes',            COUNT(*)           FROM pacientes   UNION ALL
    SELECT 'appointments',         COUNT(*)           FROM appointments;
  "

echo "==> Migración completada."
