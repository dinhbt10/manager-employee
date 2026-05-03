#!/bin/bash

# Script test backend trên Render

BACKEND_URL="https://manager-employee-2.onrender.com"

echo "========================================="
echo "Testing Backend on Render"
echo "========================================="
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
echo "URL: $BACKEND_URL/actuator/health"
echo ""
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BACKEND_URL/actuator/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health Check: PASSED"
    echo "Response: $BODY"
else
    echo "❌ Health Check: FAILED (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
echo ""

# Test 2: Login API
echo "2️⃣  Testing Login API..."
echo "URL: $BACKEND_URL/api/auth/login"
echo "Credentials: admin / admin123"
echo ""
LOGIN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$LOGIN_RESPONSE" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Login API: PASSED"
    echo "Response: $BODY" | head -c 200
    echo "..."
else
    echo "❌ Login API: FAILED (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
echo ""

# Test 3: DB Info (Debug endpoint)
echo "3️⃣  Testing DB Info (Debug)..."
echo "URL: $BACKEND_URL/api/debug/db-info"
echo ""
DB_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BACKEND_URL/api/debug/db-info")
HTTP_CODE=$(echo "$DB_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$DB_RESPONSE" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ DB Info: PASSED"
    echo "Response: $BODY"
else
    echo "⚠️  DB Info: Not available (HTTP $HTTP_CODE)"
    echo "Note: This is optional, only works if DebugController is enabled"
fi
echo ""

# Summary
echo "========================================="
echo "Summary"
echo "========================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo ""
echo "Next steps:"
echo "1. If all tests passed ✅ → Backend is ready!"
echo "2. If health check failed ❌ → Check Render logs"
echo "3. If login failed ❌ → Check database connection"
echo ""
echo "View logs:"
echo "https://dashboard.render.com → manager-employee-2 → Logs"
echo ""
