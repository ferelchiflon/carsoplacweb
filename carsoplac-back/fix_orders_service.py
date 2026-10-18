"""Fix orders.service.ts type errors + functional itemsSnapshot shadow bug."""
import sys

# ---------- orders.service.ts ----------
p = 'src/orders/orders.service.ts'
with open(p) as f:
    lines = f.readlines()

# Sanity checks (1-based lines 68..85 -> indices 67..84)
assert lines[67].strip().startswith('const currency'), repr(lines[67])
assert lines[68].strip().startswith('let itemsSnapshot'), repr(lines[68])
assert lines[73].strip() == '}> = [];', repr(lines[73])
assert lines[74].strip() == '', repr(lines[74])
assert 'Start transaction' in lines[75], repr(lines[75])
assert '$transaction' in lines[76], repr(lines[76])
assert 'Reserve stock' in lines[77], repr(lines[77])
assert lines[78].strip().startswith('let itemsSnapshot'), repr(lines[78])
assert lines[83].strip() == '}> = [];', repr(lines[83])
assert lines[84].strip().startswith('let total'), repr(lines[84])

# 1) Single itemsSnapshot declaration (OUTSIDE the tx) + remove inner shadow.
#    The shadowed inner var made the post-commit preference always empty.
lines[67:85] = [
    "    const currency = this.configService.get<string>('CURRENCY_ID') ?? 'ARS';\n",
    "    let itemsSnapshot: Array<{\n",
    "      productId: string;\n",
    "      name: string;\n",
    "      quantity: number;\n",
    "      unitPrice: number;\n",
    "    }> = [];\n",
    "\n",
    "    // Start transaction: reserve stock and create order PENDING\n",
    "    const order = await this.prisma.$transaction(async (tx) => {\n",
    "      // Reserve stock for each item. itemsSnapshot se declara FUERA de la tx:\n",
    "      // despues del commit se usa para armar la preferencia de MercadoPago.\n",
    "      let total = 0;\n",
]
s = ''.join(lines)

# 2) confirmPayment: drop the over-narrow select (we need status/paymentId/items).
old_sel = (
    "      const order = await tx.order.findUnique({\n"
    "        where: { id: orderId },\n"
    "        select: { items: true },\n"
    "      });\n"
    "\n"
    "      if (!order) {\n"
    "        throw new BadRequestException(`Order not found: ${orderId}`);\n"
    "      }"
)
new_sel = (
    "      const order = await tx.order.findUnique({\n"
    "        where: { id: orderId },\n"
    "      });\n"
    "\n"
    "      if (!order) {\n"
    "        throw new BadRequestException(`Order not found: ${orderId}`);\n"
    "      }"
)
assert s.count(old_sel) == 1, ('select-block', s.count(old_sel))
s = s.replace(old_sel, new_sel)

# 3) amountCents -> amount (schema uses Float 'amount'; MP transaction_amount
#    is already in major units, no cents conversion).
old_ac = "          amountCents: Math.round((payment.transaction_amount ?? 0) * 100),"
new_ac = "          amount: payment.transaction_amount ?? 0,"
assert s.count(old_ac) == 2, ('amountCents', s.count(old_ac))
s = s.replace(old_ac, new_ac)

with open(p, 'w') as f:
    f.write(s)
print('orders.service.ts: OK')

# ---------- mercadopago.service.ts ----------
p2 = 'src/payments/mercadopago/mercadopago.service.ts'
s2 = open(p2).read()

old_sig = (
    "    successUrl?: string;\n"
    "    failureUrl?: string;\n"
    "    pendingUrl?: string;\n"
    "  }) {"
)
new_sig = (
    "    successUrl?: string;\n"
    "    failureUrl?: string;\n"
    "    pendingUrl?: string;\n"
    "    additionalPreferenceParams?: {\n"
    "      expiration_date_from?: string;\n"
    "      expiration_date_to?: string;\n"
    "      payment_methods?: {\n"
    "        excluded_payment_types?: { id: string }[];\n"
    "      };\n"
    "    };\n"
    "  }) {"
)
assert s2.count(old_sig) == 1, ('sig', s2.count(old_sig))
s2 = s2.replace(old_sig, new_sig)

old_body = (
    "      // A\u00f1adir flag de sandbox expl\u00edcitamente\n"
    "      additional_info: \"sandbox_mode=true\",\n"
    "    };"
)
new_body = (
    "      // A\u00f1adir flag de sandbox expl\u00edcitamente\n"
    "      additional_info: \"sandbox_mode=true\",\n"
    "      // Overrides opcionales del llamador (expiracion, exclusion de medios\n"
    "      // de pago, etc.): al final para que tengan precedencia.\n"
    "      ...(params.additionalPreferenceParams ?? {}),\n"
    "    };"
)
assert s2.count(old_body) == 1, ('body', s2.count(old_body))
s2 = s2.replace(old_body, new_body)

with open(p2, 'w') as f:
    f.write(s2)
print('mercadopago.service.ts: OK')
