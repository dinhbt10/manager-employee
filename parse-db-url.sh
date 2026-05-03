#!/bin/bash

# Script để parse Database URL từ Render thành các biến môi trường

echo "==================================="
echo "Parse Render Database URL"
echo "==================================="
echo ""
echo "Paste Internal Database URL từ Render (dạng: postgresql://user:pass@host:5432/dbname):"
read -r DATABASE_URL

if [[ -z "$DATABASE_URL" ]]; then
    echo "❌ Bạn chưa nhập URL!"
    exit 1
fi

# Parse URL
# postgresql://user:pass@host:5432/dbname
# Bỏ postgresql://
URL_WITHOUT_PROTOCOL="${DATABASE_URL#postgresql://}"

# Tách user:pass@host:port/dbname
USER_PASS="${URL_WITHOUT_PROTOCOL%%@*}"
HOST_PORT_DB="${URL_WITHOUT_PROTOCOL#*@}"

# Tách user và pass
DB_USER="${USER_PASS%%:*}"
DB_PASSWORD="${USER_PASS#*:}"

# Tách host:port và dbname
HOST_PORT="${HOST_PORT_DB%%/*}"
DB_NAME="${HOST_PORT_DB#*/}"

# Tách host và port
DB_HOST="${HOST_PORT%%:*}"
DB_PORT="${HOST_PORT#*:}"

echo ""
echo "==================================="
echo "✅ Parsed thành công!"
echo "==================================="
echo ""
echo "Copy các biến sau vào Render Backend Service → Environment:"
echo ""
echo "SPRING_PROFILES_ACTIVE=docker"
echo "DB_HOST=$DB_HOST"
echo "DB_PORT=$DB_PORT"
echo "DB_NAME=$DB_NAME"
echo "DB_USER=$DB_USER"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "JWT_SECRET=change-this-to-random-32-chars-or-more"
echo "CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app"
echo ""
echo "==================================="
echo "Hoặc dùng DATABASE_URL trực tiếp:"
echo "==================================="
echo ""
echo "SPRING_PROFILES_ACTIVE=docker"
echo "DATABASE_URL=$DATABASE_URL"
echo "JWT_SECRET=change-this-to-random-32-chars-or-more"
echo "CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app"
echo ""
