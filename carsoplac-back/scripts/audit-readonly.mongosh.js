// ─────────────────────────────────────────────────────────────────────────────
// scripts/audit-readonly.mongosh.js
// Auditoría PRE-Fase-1 — 100% SOLO LECTURA (no escribe, no crea índices).
//
// Requisito (una sola vez):  brew install mongosh
//
// Uso (reemplazá $DATABASE_URL por la URI de Atlas; probá primero en PRUEBAS):
//   mongosh "$DATABASE_URL" --file scripts/audit-readonly.mongosh.js
//
// Reporta: 1) docs por colección  2) categorías duplicadas (case/acento)
// 3) categoryId huérfanos  4) productos sin stock  5) usuarios sin email
// 6) checklist de datos faltantes para los índices únicos de Fase 1.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

// Prisma (sin @@map) nombra las colecciones como el modelo: "Product", etc.
// Resolvemos el nombre real de forma tolerante a mayúsculas/plural.
function col(base) {
  const names = db.getCollectionNames();
  const candidates = [base, base.toLowerCase(), base + 's', base.toLowerCase() + 's',
    base[0].toUpperCase() + base.slice(1).toLowerCase()];
  for (const c of candidates) if (names.indexOf(c) !== -1) return db.getCollection(c);
  return null;
}

// Normaliza: minúsculas, sin acentos, sin espacios extremos.
function norm(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Convierte un nombre en slug URL: "Placas de Yeso" → "placas-de-yeso".
function slugify(s) {
  return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function hr(title) {
  print('\n══════════════════════════════════════════════════');
  print('  ' + title);
  print('══════════════════════════════════════════════════');
}

print('Base de datos: ' + db.getName() + '  (solo lectura, no se modifica nada)');

// ── 1) Documentos por colección ──────────────────────────────────────────────
hr('1) Documentos por colección');
const names = db.getCollectionNames().sort();
if (names.length === 0) print('  (la base está vacía)');
names.forEach(function (c) {
  print('  ' + c + ': ' + db.getCollection(c).countDocuments({}));
});
const known = ['Product', 'Category', 'User'];
const extra = names.filter(function (n) { return known.indexOf(n) === -1; });
if (extra.length > 0) {
  print('  ⚠ Colecciones FUERA del schema actual (posibles leftovers): ' + extra.join(', '));
}

// ── 2) Categorías duplicadas (case/acento-insensitive) ──────────────────────
hr('2) Categorías: nombres duplicados (ignorando mayúsculas/acentos)');
const categories = col('Category');
let dupCount = 0;
if (!categories) {
  print('  ⚠ No se encontró la colección de categorías.');
} else {
  const cats = categories.find({}, { name: 1, slug: 1 }).toArray();
  const byNorm = {};
  cats.forEach(function (c) {
    const k = norm(c.name);
    if (!k) return;
    if (!byNorm[k]) byNorm[k] = [];
    byNorm[k].push({ _id: c._id.toString(), name: c.name, slug: c.slug || null });
  });
  Object.keys(byNorm).forEach(function (k) {
    const group = byNorm[k];
    if (group.length > 1) {
      dupCount++;
      print('  ✗ "' + group[0].name + '" → ' + group.length + ' variantes: ' + JSON.stringify(group));
    }
  });
  if (dupCount === 0) print('  ✓ Sin duplicados (case/acento-insensitive).');
}

// ── 3) Productos con categoryId huérfano ────────────────────────────────────
hr('3) Productos con categoryId huérfano');
const products = col('Product');
if (!categories || !products) {
  print('  ⚠ No se encontraron las colecciones Category/Product.');
} else {
  const catsAll = categories.find({}, { name: 1 }).toArray();
  const catIds = {};
  catsAll.forEach(function (c) { catIds[c._id.toString()] = c.name; });
  const prods = products.find({}, { name: 1, categoryId: 1, stock: 1, price: 1 }).toArray();
  let orphanCount = 0;
  prods.forEach(function (p) {
    if (p.categoryId && !catIds[p.categoryId.toString()]) {
      orphanCount++;
      print('  ✗ "' + p.name + '" (' + p._id + ') → categoryId ' + p.categoryId + ' no existe en Category');
    }
  });
  if (orphanCount === 0) print('  ✓ Ningún huérfano.');

  // ── 4) Productos sin stock definido ───────────────────────────────────────
  hr('4) Productos sin stock definido (null o ausente)');
  const noStock = prods.filter(function (p) {
    return p.stock === null || p.stock === undefined;
  });
  if (noStock.length === 0) {
    print('  ✓ Todos los productos tienen stock definido.');
  } else {
    print('  ✗ ' + noStock.length + ' producto(s) sin stock:');
    noStock.slice(0, 15).forEach(function (p) {
      print('     - "' + p.name + '" (' + p._id + ')');
    });
  }

  // ── 4b) Precios raros (riesgo conocido: price es Float) ───────────────────
  hr('4b) Productos con price null, ausente o <= 0');
  const badPrice = prods.filter(function (p) {
    return p.price === null || p.price === undefined || !(p.price > 0);
  });
  if (badPrice.length === 0) {
    print('  ✓ Ninguno.');
  } else {
    badPrice.forEach(function (p) {
      print('  ✗ "' + p.name + '" (' + p._id + ') → price: ' + p.price);
    });
  }

  // ── 6a) Slugs propuestos para Category (checklist índice único) ───────────
  hr('6a) Category: slugs propuestos para el índice único de Fase 1');
  const seenSlugs = {};
  let slugCollisions = 0;
  const slugPreview = [];
  catsAll.forEach(function (c) {
    let s = slugify(c.name);
    if (!s) s = 'categoria-' + c._id;
    if (seenSlugs[s]) {
      slugCollisions++;
      print('  ✗ Colisión de slug "' + s + '": "' + seenSlugs[s] + '" y "' + c.name + '"');
    }
    seenSlugs[s] = c.name;
    slugPreview.push(c.name + ' → ' + s);
  });
  print('  ' + slugPreview.join('  |  '));
  if (slugCollisions === 0) print('  ✓ Sin colisiones de slug.');
  if (dupCount > 0) {
    print('  ⚠ Hay ' + dupCount + ' grupo(s) de nombres duplicados: resolver ANTES del índice único de name.');
  }
}

// ── 5) Usuarios sin email ────────────────────────────────────────────────────
hr('5) Usuarios sin email');
const users = col('User');
if (!users) {
  print('  ⚠ No se encontró la colección de usuarios.');
} else {
  const us = users.find({}, { username: 1, email: 1, role: 1 }).toArray();
  print('  Total usuarios: ' + us.length);
  let sinEmail = 0;
  const byEmail = {};
  us.forEach(function (u) {
    if (!u.email) {
      sinEmail++;
      print('  ✗ Sin email: "' + (u.username || String(u._id)) + '" [role: ' + (u.role || '?') + ']');
    } else {
      const k = norm(u.email);
      byEmail[k] = (byEmail[k] || 0) + 1;
    }
  });
  if (sinEmail === 0) print('  ✓ Todos tienen email.');
  Object.keys(byEmail).forEach(function (k) {
    if (byEmail[k] > 1) print('  ✗ Email duplicado (normalizado): ' + k + ' ×' + byEmail[k]);
  });
  print('  Nota: Mongo permite muchos documentos SIN el campo email, pero NO dos con null explícito.');
}

// ── 6b) Índices existentes (verificación, solo lectura) ──────────────────────
hr('6b) Índices existentes por colección');
['Product', 'Category', 'User'].forEach(function (n) {
  const c = col(n);
  if (!c) return;
  print('  ' + n + ':');
  c.getIndexes().forEach(function (ix) {
    print('    - ' + ix.name + ' ' + JSON.stringify(ix.key) + (ix.unique ? ' [unique]' : ''));
  });
});

print('\nFin de la auditoría. Ningún dato fue modificado (solo lectura).');
