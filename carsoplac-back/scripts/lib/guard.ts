// Verifica que DATABASE_URL apunte a la base esperada. No se conecta ni imprime la URI.
function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

export function assertExpectedDb(): string {
  const uri = process.env.DATABASE_URL;
  const expected = process.env.EXPECTED_DB;
  if (!uri) fail('DATABASE_URL no definida');
  if (!expected) fail('EXPECTED_DB no definida (ej: carsoplac_test)');

  const noQuery = uri.split('?')[0];
  const name = decodeURIComponent(noQuery.slice(noQuery.lastIndexOf('/') + 1));
  if (!/^[A-Za-z0-9_-]+$/.test(name)) {
    fail('No se pudo leer el nombre de la base desde DATABASE_URL (falta /nombre_de_base antes del "?")');
  }
  if (name !== expected) {
    fail(`Base incorrecta: DATABASE_URL apunta a "${name}" y se esperaba "${expected}". Abortando.`);
  }
  return name;
}