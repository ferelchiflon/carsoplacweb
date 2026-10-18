import { MongoClient } from 'mongodb';
async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL no definida');
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const dbName = client.db().databaseName;
    const expectedDb = process.env.EXPECTED_DB;
    if (!expectedDb) {
      throw new Error('Variable de entorno EXPECTED_DB no definida. Ejemplo: EXPECTED_DB=carsoplac_test');
    }
    console.log(`Base: ${dbName}`);
    if (dbName !== expectedDb) {
      throw new Error(`Intento de escritura en base '\
pero
se
esperaba
\'. Abortando por seguridad.`);
    }
    
    const db = client.db();
    const products = db.collection('Product');
    
    const apply = process.argv.includes('--apply');
    console.log(`🧪 Modo: ${apply ? 'APLICANDO CAMBIOS' : 'DRY-RUN (sin cambios)'}`);
    
    if (apply) {
      const result = await products.updateMany(
        {
          $or: [
            { lowStockThreshold: { $exists: false } },
            { lowStockThreshold: null }
          ]
        },
        { $set: { lowStockThreshold: 5 } }
      );
      
      console.log(`\n📊 Resumen:`);
      console.log(`   - Productos actualizados: ${result.modifiedCount}`);
      console.log(`   - Umbral aplicado: 5 unidades`);
    } else {
      const count = await products.countDocuments({
        $or: [
          { lowStockThreshold: { $exists: false } },
          { lowStockThreshold: null }
        ]
      });
      
      console.log(`\n📊 Resumen (DRY-RUN):`);
      console.log(`   - Productos que serían actualizados: ${count}`);
      console.log(`   - Umbral que se aplicaría: 5 unidades`);
    }
    
    console.log(`\n✅ Para aplicar cambios, vuelva a ejecutar con: --apply`);
  } finally {
    await client.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
