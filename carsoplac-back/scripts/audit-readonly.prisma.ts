/**
 * scripts/audit-readonly.prisma.ts — Alternativa al script de mongosh,
 * por si preferís no instalar nada: usa el PrismaClient ya generado.
 * 100% SOLO LECTURA.
 *
 * Uso (desde carsoplac-back/, con el .env que apunte a la base a auditar):
 *   npx ts-node --transpile-only scripts/audit-readonly.prisma.ts
 *
 * Limitación vs mongosh: no lista colecciones arbitrarias. Cuenta las tres
 * modeladas (Product, Category, User) y, vía $runCommandRaw (crudo, sin
 * depender del schema), las colecciones legacy (Order, OrderItem,
 * PaymentRecord, UserFavorite) y los usuarios sin email.
 */
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** minúsculas, sin acentos, sin espacios extremos (igual que el front). */
function norm(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

async function main() {
  console.log('Auditoría solo lectura. No se modifica nada.\n');

  // 1) Documentos por colección modelada
  const [prodCount, catCount, userCount] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.user.count(),
  ]);
  console.log('1) Documentos por colección:');
  console.log(`   Product: ${prodCount}`);
  console.log(`   Category: ${catCount}`);
  console.log(`   User: ${userCount}`);
  // Colecciones legacy fuera del schema actual: consultadas en crudo para no
  // depender de que existan en schema.prisma.
  for (const legacy of ['Order', 'OrderItem', 'PaymentRecord', 'UserFavorite']) {
    try {
      const res = (await prisma.$runCommandRaw({
        aggregate: legacy,
        pipeline: [{ $match: {} }, { $count: 'n' }],
        cursor: {},
      } as unknown as Prisma.InputJsonObject)) as unknown as {
        cursor?: { firstBatch?: Array<{ n?: number }> };
      };
      const n = res.cursor?.firstBatch?.[0]?.n ?? 0;
      console.log(`   ${legacy} (colección legacy): ${n}`);
    } catch {
      console.log(`   ${legacy}: no se pudo consultar (el script de mongosh lista todo)`);
    }
  }

  // 2) Categorías duplicadas (case/acento-insensitive)
  const cats = await prisma.category.findMany({ select: { id: true, name: true } });
  const byNorm = new Map<string, string[]>();
  for (const c of cats) {
    const k = norm(c.name);
    if (!k) continue;
    byNorm.set(k, [...(byNorm.get(k) ?? []), c.name]);
  }
  const dups = [...byNorm.entries()].filter(([, v]) => v.length > 1);
  console.log('\n2) Categorías duplicadas (case/acento-insensitive):');
  if (dups.length === 0) console.log('   ✓ ninguna');
  else dups.forEach(([k, v]) => console.log(`   ✗ "${v[0]}" → ${v.length} variantes: ${v.join(' | ')}`));

  // 3) Productos con categoryId huérfano
  const catIds = new Set(cats.map((c) => c.id));
  const prods = await prisma.product.findMany({
    select: { id: true, name: true, categoryId: true, stock: true },
  });
  const orphans = prods.filter((p) => p.categoryId && !catIds.has(p.categoryId));
  console.log('\n3) Productos con categoryId huérfano:');
  if (orphans.length === 0) console.log('   ✓ ninguno');
  else orphans.forEach((p) => console.log(`   ✗ "${p.name}" (${p.id}) → categoryId ${p.categoryId}`));

  // 4) Productos sin stock definido
  const noStock = prods.filter((p) => p.stock === null || p.stock === undefined);
  console.log('\n4) Productos sin stock definido (null):');
  if (noStock.length === 0) console.log('   ✓ todos tienen stock');
  else {
    console.log(`   ✗ ${noStock.length} producto(s):`);
    noStock.slice(0, 10).forEach((p) => console.log(`   - "${p.name}" (${p.id})`));
  }

  // 5) Usuarios sin email — vía $runCommandRaw porque el schema actual
  //    todavía NO tiene User.email (la auditoría corre ANTES del push).
  console.log('\n5) Usuarios sin email:');
  try {
    const res = (await prisma.$runCommandRaw({
      aggregate: 'User',
      pipeline: [{ $project: { username: 1, email: 1, role: 1 } }, { $sort: { _id: 1 } }],
      cursor: {},
    } as unknown as Prisma.InputJsonObject)) as unknown as {
      cursor?: {
        firstBatch?: Array<{ _id?: unknown; username?: string; email?: string; role?: string }>;
      };
    };
    const users = res.cursor?.firstBatch ?? [];
    console.log(`   Total usuarios: ${users.length}`);
    const noEmail = users.filter((u) => !u.email);
    if (noEmail.length === 0) console.log('   ✓ todos tienen email');
    else
      noEmail.forEach((u) =>
        console.log(
          `   ✗ ${u.username ?? '(sin username)'} [${u.role ?? '?'}] ${String(u._id)}`,
        ),
      );
  } catch {
    console.log(
      '   ⚠ No se pudo consultar User vía $runCommandRaw; usá el script de mongosh para este punto.',
    );
  }
}

main()
  .catch((e) => {
    console.error('Error en auditoría:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
