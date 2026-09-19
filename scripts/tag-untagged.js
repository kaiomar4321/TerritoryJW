// Etiqueta con una congregación todos los documentos que no tengan
// congregationId: los que crearon las apps viejas (que no lo mandan).
// Correrlo de vez en cuando mientras haya gente con la versión vieja.
//
// Uso: node scripts/tag-untagged.js "La Estacion Patzcuaro"
//
// Requiere scripts/serviceAccountKey.json (gitignored).

const admin = require('firebase-admin');

admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.error('Uso: node scripts/tag-untagged.js "Nombre de la congregación"');
    process.exit(1);
  }

  const cong = await db.collection('congregations').where('name', '==', name).get();
  if (cong.empty) {
    console.error(`❌ No existe la congregación "${name}"`);
    process.exit(1);
  }
  const congregationId = cong.docs[0].id;

  for (const col of ['users', 'territories', 'groups', 'avoidHouses']) {
    const snap = await db.collection(col).get();
    const untagged = snap.docs.filter((d) => !d.data().congregationId);
    if (untagged.length === 0) {
      console.log(`✅ ${col}: nada por etiquetar`);
      continue;
    }
    const batch = db.batch();
    untagged.forEach((d) => batch.update(d.ref, { congregationId }));
    await batch.commit();
    console.log(`✅ ${col}: ${untagged.length} etiquetados`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
