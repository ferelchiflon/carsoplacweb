import { MongoClient } from 'mongodb';
import { assertExpectedDb } from './lib/guard';

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function main() {
  const dbName = assertExpectedDb();
  const apply = process.argv.includes('--apply');
  console.log(`Base: ${dbName}`);
  console.log(`Modo: ${apply ? 'APLICANDO CAMBIOS' : 'DRY-RUN (sin cambios)'}`);

  const client = new MongoClient(process.env.DATABASE_URL as string);
  try {
    await client.connect();
    const categories = client.db().collection('Category');
    const all = await categories.find({}).toArray();
    const used = new Set<string>(all.filter((c) => c.slug).map((c) => String(c.slug)));

    let updated = 0;
    let pending = 0;
    for (const cat of all) {
      if (cat.slug) continue;
      pending++;
      const base = slugify(String(cat.name ?? '')) || 'categoria';
      let slug = base;
      let n = 2;
      while (used.has(slug)) slug = `${base}-${n++}`;
      used.add(slug);

      if (apply) {
        await categories.updateOne({ _id: cat._id }, { $set: { slug } });
        updated++;
      } else {
        console.log(`[DRY-RUN] "${cat.name}" -> ${slug}`);
      }
    }

    console.log(`Categorías: ${all.length}, sin slug: ${pending}, actualizadas: ${apply ? updated : 0}`);
    if (!apply) console.log('Para aplicar: volver a ejecutar con --apply');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});