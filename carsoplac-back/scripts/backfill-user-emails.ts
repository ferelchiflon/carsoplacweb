import { MongoClient } from 'mongodb';
import { assertExpectedDb } from './lib/guard';

// ADMIN_EMAIL_MAP="usuario=email,usuario2=email2"
function parseEmailMap(raw: string | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  for (const pair of (raw ?? '').split(',')) {
    const i = pair.indexOf('=');
    if (i < 1) continue;
    const username = pair.slice(0, i).trim();
    const email = pair.slice(i + 1).trim().toLowerCase();
    if (username && email) map[username] = email;
  }
  return map;
}

async function main() {
  const dbName = assertExpectedDb();
  const apply = process.argv.includes('--apply');
  const emailMap = parseEmailMap(process.env.ADMIN_EMAIL_MAP);
  console.log(`Base: ${dbName}`);
  console.log(`Modo: ${apply ? 'APLICANDO CAMBIOS' : 'DRY-RUN (sin cambios)'}`);

  const client = new MongoClient(process.env.DATABASE_URL as string);
  try {
    await client.connect();
    const users = client.db().collection('User');
    const pending = await users
      .find({ $or: [{ email: { $exists: false } }, { email: null }] })
      .toArray();

    let updated = 0;
    let placeholders = 0;
    for (const user of pending) {
      const username = String(user.username ?? user._id);
      const mapped = emailMap[username];
      const email = mapped ?? `${username.toLowerCase()}@pendiente.carsoplac.local`;
      if (!mapped) {
        placeholders++;
        console.warn(`ADVERTENCIA: "${username}" no está en ADMIN_EMAIL_MAP, se usa placeholder: ${email}`);
      }
      if (apply) {
        await users.updateOne({ _id: user._id }, { $set: { email } });
        updated++;
      } else {
        console.log(`[DRY-RUN] ${username} -> ${email}`);
      }
    }

    console.log(`Usuarios sin email: ${pending.length}, con placeholder: ${placeholders}, actualizados: ${apply ? updated : 0}`);
    if (!apply) console.log('Para aplicar: volver a ejecutar con --apply');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});