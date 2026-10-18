/**
 * Backfill de moneda para órdenes y registros de pago pre-existentes.
 *
 * Contexto: se eliminó @default("USD") del schema de Prisma (Order.currency y
 * PaymentRecord.currency ya no tienen default). Las órdenes creadas ANTES de
 * que existiera el campo quedaron SIN el campo (en MongoDB eso es null/missing
 * en el documento, NO string vacío), por eso el filtro usa `in: ['', null]`.
 *
 * Uso: CURRENCY_ID=ARS npx ts-node scripts/backfill-currency.ts
 * (toma CURRENCY_ID del .env; fallback 'ARS'.)
 */
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
config()

const prisma = new PrismaClient()

async function main() {
  const currency = (process.env.CURRENCY_ID ?? 'ARS').toUpperCase()

  // ¿Qué cuenta como "sin moneda"? Campo vacío o campo AUSENTE (en MongoDB,
  // { campo: null } matchea documentos sin el campo: órdenes creadas antes de
  // que existiera currency). Prisma no tipa null para String requerido, de
  // ahí el cast.
  const missingFilter = {
    OR: [{ currency: '' }, { currency: null as unknown as string }],
  };

  const ordersMissing = await prisma.order.count({ where: missingFilter })
  const paymentsMissing = await prisma.paymentRecord.count({ where: missingFilter })

  console.log(`[backfill-currency] Moneda objetivo: ${currency}`)
  console.log(`[backfill-currency] Orders sin moneda: ${ordersMissing}`)
  console.log(`[backfill-currency] PaymentRecords sin moneda: ${paymentsMissing}`)

  if (ordersMissing === 0 && paymentsMissing === 0) {
    console.log('[backfill-currency] Nada que actualizar.')
    return
  }

  const updatedOrders = await prisma.order.updateMany({
    where: missingFilter,
    data: { currency },
  })

  const updatedPayments = await prisma.paymentRecord.updateMany({
    where: missingFilter,
    data: { currency },
  })

  console.log(`[backfill-currency] Orders actualizadas a ${currency}: ${updatedOrders.count}`)
  console.log(`[backfill-currency] PaymentRecords actualizados a ${currency}: ${updatedPayments.count}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })