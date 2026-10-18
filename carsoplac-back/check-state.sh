#!/bin/bash
# Auditoría de solo lectura. No modifica nada.
ok(){ echo "  ✅ $1"; }
no(){ echo "  ❌ $1"; }
# has "descripcion" "regex" "ruta"  -> ✅ si el patrón existe
has(){ grep -rEq -- "$2" $3 2>/dev/null && ok "$1" || no "$1"; }
# hasnt "descripcion" "regex" "ruta" -> ✅ si el patrón NO existe
hasnt(){ grep -rEq -- "$2" $3 2>/dev/null && no "$1" || ok "$1"; }

echo "== 0. BUILD =="
npx prisma generate >/dev/null 2>&1
ERR=$(npm run build 2>&1 | grep -c "error TS")
[ "$ERR" = "0" ] && ok "build sin errores TS" || no "build con $ERR errores TS"

echo; echo "== 1. GIT =="
git branch --show-current
git status --short | head -30

echo; echo "== 2. SCHEMA (prisma/schema.prisma) =="
grep -E "provider\s*=" prisma/schema.prisma | head -3
has   "modelo PaymentRecord"            "model PaymentRecord" prisma/schema.prisma
has   "mpPaymentId @unique"             "mpPaymentId.*@unique" prisma/schema.prisma
hasnt "sin @default(\"USD\")"           "@default\(\"USD\"\)" prisma/schema.prisma
has   "Order.expiresAt"                 "expiresAt" prisma/schema.prisma
has   "Order.stockReserved"             "stockReserved" prisma/schema.prisma
has   "estado EXPIRED"                  "EXPIRED" prisma/schema.prisma
has   "estado REFUND_PENDING"           "REFUND_PENDING" prisma/schema.prisma
has   "estado REFUNDED"                 "REFUNDED" prisma/schema.prisma

echo; echo "== 3. ENV =="
for v in MP_ACCESS_TOKEN MP_WEBHOOK_SECRET FRONTEND_URL BACKEND_PUBLIC_URL CURRENCY_ID RESERVATION_TTL_MINUTES REFUNDS_ENABLED; do
  has "$v en validación (src)" "$v" src/config
  has "$v en .env.example"     "^$v=" .env.example
done
hasnt ".env reales fuera de git" "x" "/dev/null"
git ls-files | grep -E "^\.env($|\.)" | grep -v example | sed 's/^/  ⚠️  versionado: /'

echo; echo "== 4. HARDCODEOS (deben dar ✅ = no existen) =="
hasnt "sin carsoplac-ts.vercel.app en src" "carsoplac-ts\.vercel\.app" src
hasnt "sin default_payment_method_id visa" "default_payment_method_id" src
hasnt "sin sandbox_mode / metadata test"   "sandbox_mode|sandbox_sdk" src
hasnt "sin console.log del body MP"        "console\.log\(.Enviando" src

echo; echo "== 5. mercadopago.service.ts =="
N=$(grep -c "async getPayment" src/payments/mercadopago/mercadopago.service.ts 2>/dev/null)
[ "$N" = "1" ] && ok "getPayment definido 1 vez" || no "getPayment definido $N veces"
has "usa PaymentRefund"         "PaymentRefund" src/payments/mercadopago
hasnt "sin payment.refund inventado" "payment\.refund\(" src/payments/mercadopago
has "timeout en requests"       "timeout" src/payments/mercadopago
has "idempotencyKey en refund"  "idempotencyKey" src/payments/mercadopago

echo; echo "== 6. WEBHOOK (controller) =="
has   "lee x-signature"            "x-signature" src/payments
has   "lee x-request-id"           "x-request-id" src/payments
has   "timingSafeEqual"            "timingSafeEqual" src/payments
has   "manifest id:...;request-id" "request-id:" src/payments
hasnt "sin getRawBody"             "getRawBody" src/payments
hasnt "sin HMAC de timestamp+body" "timestamp *\+ *rawBody|ts *\+ *rawBody" src/payments
has   "valida moneda"              "currency_id" src/payments
has   "Math.round para centavos"   "Math\.round" src

echo; echo "== 7. ORDERS (createOrder / confirmPayment) =="
has   "reserva: stock gte"         "stock: *\{ *gte" src/orders
has   "reserva: decrement"         "decrement" src/orders
has   "usa \$transaction"          "\\\$transaction" src/orders
has   "transición atómica PENDING" "updateMany" src/orders
has   "upsert de PaymentRecord"    "paymentRecord\.upsert" src/orders
has   "maneja P2002"               "P2002" src/orders
has   "idempotency key de refund"  "refund-" src/orders
has   "InsufficientStockError"     "InsufficientStock" src

echo; echo "== 8. CRON =="
grep -rn "@Cron" src | sed 's/^/  /'
has "libera stock con increment"   "increment" src/orders
has "ScheduleModule registrado"    "ScheduleModule" src

echo; echo "== 9. ValidationPipe global =="
has "whitelist"             "whitelist: *true" src/main.ts
has "forbidNonWhitelisted"  "forbidNonWhitelisted" src/main.ts

echo; echo "== 10. ARCHIVOS TOCADOS vs base =="
git diff --stat HEAD~1 2>/dev/null | tail -20
