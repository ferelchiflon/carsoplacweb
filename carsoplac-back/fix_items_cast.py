"""confirmPayment: cast seguro de items (productId nullable en OrderItem)."""
p = 'src/orders/orders.service.ts'
with open(p) as f:
    s = f.read()

old = (
    "        // Parse order.items (stored as Json) to get product IDs and quantities\n"
    "        const items = effective.items as Array<{ productId: string; quantity: number }>;\n"
    "        // Sort by productId to avoid deadlocks\n"
    "        const sortedItems = [...items].sort((a, b) =>\n"
    "          a.productId.localeCompare(b.productId)\n"
    "        );"
)
new = (
    "        // Items de la orden (relacion OrderItem): productId es nullable\n"
    "        // (onDelete: SetNull si el producto fue borrado) -> se excluyen, no\n"
    "        // hay stock que reservar de un producto inexistente.\n"
    "        const items = effective.items as Array<{\n"
    "          productId: string | null;\n"
    "          quantity: number;\n"
    "        }>;\n"
    "        // Sort by productId to avoid deadlocks\n"
    "        const sortedItems = items\n"
    "          .filter((item): item is { productId: string; quantity: number } =>\n"
    "            Boolean(item.productId),\n"
    "          )\n"
    "          .sort((a, b) => a.productId.localeCompare(b.productId));"
)
assert s.count(old) == 1, ('items-cast', s.count(old))
s = s.replace(old, new)

with open(p, 'w') as f:
    f.write(s)
print('items cast: OK')
