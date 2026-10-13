#!/bin/bash
# Script to test throttler: 12 failed logins and 30 GET /products
# Do not run in production

BACKEND_URL="http://localhost:3000"
LOGIN_ENDPOINT="${BACKEND_URL}/auth/login"
PRODUCTS_ENDPOINT="${BACKEND_URL}/products"

echo "Testing throttler: 12 failed logins"
for i in {1..12}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${LOGIN_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d '{"username":"wronguser","password":"wrongpass"}')
  echo "Login attempt $i: $response"
done

echo "Testing throttler: 30 GET /products"
for i in {1..30}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "${PRODUCTS_ENDPOINT}")
  echo "GET /products attempt $i: $response"
done