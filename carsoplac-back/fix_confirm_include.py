"""confirmPayment: usar include (no select) para tener escalares + items."""
p = 'src/orders/orders.service.ts'
with open(p) as f:
    s = f.read()

# 1) findUnique principal de confirmPayment
old_a = (
    "      const order = await tx.order.findUnique({\n"
    "        where: { id: orderId },\n"
    "      });\n"
    "\n"
    "      if (!order) {\n"
    "        throw new BadRequestException(`Order not found: ${orderId}`);\n"
    "      }"
)
new_a = (
    "      // include (no select): se necesitan los escalares (status, paymentId)\n"
    "      // Y los items. En Prisma 6 el fetch por defecto no trae relaciones.\n"
    "      const order = await tx.order.findUnique({\n"
    "        where: { id: orderId },\n"
    "        include: { items: true },\n"
    "      });\n"
    "\n"
    "      if (!order) {\n"
    "        throw new BadRequestException(`Order not found: ${orderId}`);\n"
    "      }"
)
assert s.count(old_a) == 1, ('main-findUnique', s.count(old_a))
s = s.replace(old_a, new_a)

# 2) re-lectura tras perder la carrera (se asigna a 'effective', debe tener items)
old_b = (
    "        const currentOrder = await tx.order.findUnique({\n"
    "          where: { id: orderId },\n"
    "        });"
)
new_b = (
    "        const currentOrder = await tx.order.findUnique({\n"
    "          where: { id: orderId },\n"
    "          include: { items: true },\n"
    "        });"
)
assert s.count(old_b) == 1, ('currentOrder', s.count(old_b))
s = s.replace(old_b, new_b)

with open(p, 'w') as f:
    f.write(s)
print('confirmPayment include: OK')
