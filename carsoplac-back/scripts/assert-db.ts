// Verifica que DATABASE_URL apunte a la base esperada. No se conecta ni imprime la URI.
function dbNameFromUri(uri: string): string {
  const noQuery = uri.split('?')[0];
  const name = decodeURIComponent(noQuery.slice(noQuery.lastIndexOf('/') + 1));
  return /^[A-Za-z0-9_-]+$/.test(name) ? name : '';
}

const uri = process.env.DATABASE_URL;
const expected = process.env.EXPECTED_DB;

if (!uri) {
  console.error('DATABASE_URL no definida');
  process.exit(1);
}
if (!expected) {
  console.error('EXPECTED_DB no definida (ej: carsoplac_test)');
  process.exit(1);
}

const actual = dbNameFromUri(uri);
if (!actual) {
  console.error('No se pudo leer el nombre de la base desde DATABASE_URL (falta /nombre_de_base antes del "?")');
  process.exit(1);
}
if (actual !== expected) {
  console.error(`Base incorrecta: DATABASE_URL apunta a "${actual}" y se esperaba "${expected}". Abortando.`);
  process.exit(1);
}

console.log(`OK: base "${actual}"`);
export {};