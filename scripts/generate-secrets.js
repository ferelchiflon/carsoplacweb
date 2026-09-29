#!/usr/bin/env node
/**
 * scripts/generate-secrets.js
 *
 * Genera valores criptograficamente seguros para todas las variables
 * de entorno del proyecto Carsoplac. Usalo despues de clonar o antes
 * de un deploy a produccion.
 *
 * Uso:
 *   node scripts/generate-secrets.js
 *   node scripts/generate-secrets.js --check    # solo verifica que .env tenga secretos
 */

const crypto = require('crypto');

function gen(bytes, encoding = 'hex') {
  return crypto.randomBytes(bytes).toString(encoding);
}

function genJwtSecret() {
  return gen(64, 'hex'); // 128 caracteres hex = 512 bits
}

function genPassword(bytes = 24) {
  return gen(bytes, 'base64').replace(/[+/=]/g, ''); // seguro para URLs y .env
}

function genApiKey(bytes = 32) {
  return gen(bytes, 'hex');
}

function printBanner() {
  console.log('\n============================================================');
  console.log('  CARSOPLAC - Generador de Secretos Criptograficos');
  console.log('============================================================\n');
}

function generate() {
  printBanner();
  console.log('# Copia estos valores a tu .env. NO los commitees.\n');
  console.log('# --- JWT / Auth ---');
  console.log(`JWT_SECRET=${genJwtSecret()}`);
  console.log(`JWT_EXPIRES_IN=12h`);
  console.log('');
  console.log('# --- Admin Seed (solo primera vez) ---');
  console.log(`ADMIN_SEED_USERNAME=admin`);
  console.log(`ADMIN_SEED_PASSWORD=${genPassword(24)}`);
  console.log('');
  console.log('# --- Database ---');
  console.log(`POSTGRES_USER=carsoplac_user`);
  console.log(`POSTGRES_PASSWORD=${genPassword(24)}`);
  console.log(`POSTGRES_DB=carsoplac`);
  console.log(
    `DATABASE_URL=postgresql://carsoplac_user:__SET_PASSWORD__@localhost:5432/carsoplac?schema=public`,
  );
  console.log('');
  console.log('# --- Cloudinary (obtener de https://cloudinary.com/console) ---');
  console.log(`CLOUDINARY_CLOUD_NAME=__your_cloud_name__`);
  console.log(`CLOUDINARY_API_KEY=__your_api_key__`);
  console.log(`CLOUDINARY_API_SECRET=${genApiKey(32)}`);
  console.log('');
  console.log('# --- MercadoPago (obtener de https://www.mercadopago.com.ar/developers/panel) ---');
  console.log(`MERCADOPAGO_ACCESS_TOKEN=__your_access_token__`);
  console.log(`MERCADOPAGO_PUBLIC_KEY=__your_public_key__`);
  console.log('');
  console.log('# --- CORS ---');
  console.log(`CORS_ORIGINS=http://localhost:5173,http://localhost:5174`);
  console.log('');
  console.log('# --- Frontends ---');
  console.log(`VITE_API_URL=http://localhost:3000/api`);
  console.log('');
  console.log('IMPORTANTE:');
  console.log('   1. Reemplaza los placeholders (__your_X__) con valores reales');
  console.log('   2. Rota estos secretos cada 90 dias');
  console.log('   3. Si alguno se filtra, rotalo INMEDIATAMENTE y reinicia todos los servicios');
  console.log('   4. NUNCA commitees el archivo .env\n');
}

function check() {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env no existe. Ejecuta: node scripts/generate-secrets.js');
    process.exit(1);
  }

  const env = fs.readFileSync(envPath, 'utf8');
  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
    'POSTGRES_PASSWORD',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'MERCADOPAGO_ACCESS_TOKEN',
    'CORS_ORIGINS',
    'VITE_API_URL',
  ];

  let missing = 0;
  for (const key of required) {
    const match = env.match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (!match || match[1].includes('__') || match[1].includes('your_')) {
      console.error(`ERROR: ${key} no configurado o tiene placeholder`);
      missing++;
    } else {
      console.log(`OK: ${key}`);
    }
  }

  if (missing > 0) {
    console.error(`\n${missing} variable(s) requieren configuracion.`);
    process.exit(1);
  }
  console.log('\nTodas las variables requeridas estan configuradas.');
}

const arg = process.argv[2];
if (arg === '--check') check();
else generate();
