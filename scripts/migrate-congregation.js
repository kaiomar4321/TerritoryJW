// Migración única: le pone congregationId a TODOS los datos existentes
// (todos ellos compartían un solo Firestore sin separación por congregación)
// antes de publicar el firestore.rules nuevo, que lo exige en todo.
//
// Requiere una service account (Admin SDK ignora las rules por completo):
// Firebase Console -> Project settings -> Service accounts -> Generate new
// private key -> guardar como scripts/serviceAccountKey.json (gitignored).
//
// Uso: node scripts/migrate-congregation.js
//
// Ya se corrió una vez para jw-territories-patz (congregación
// "La Estacion Patzcuaro", id XC4rpIsirX6APXGzNMnP). Solo hace falta
// volver a correrlo si algún día se necesita re-etiquetar todo de cero.

const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function loadEnvLatLng() {
  const envPath = path.join(__dirname, '..', '.env');
  const raw = fs.readFileSync(envPath, 'utf8');
  const lat = Number(raw.match(/EXPO_PUBLIC_INITIAL_LATITUDE=(.*)/)?.[1]);
  const lng = Number(raw.match(/EXPO_PUBLIC_INITIAL_LONGITUDE=(.*)/)?.[1]);
  return { lat, lng };
}

async function tagCollection(col, congregationId) {
  const snap = await db.collection(col).get();
  if (snap.empty) {
    console.log(`✅ ${col}: 0 documentos`);
    return;
  }
  const batch = db.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { congregationId }));
  await batch.commit();
  console.log(`✅ ${col}: ${snap.size} documento(s) etiquetados`);
}

async function main() {
  console.log(`Proyecto: ${serviceAccount.project_id}`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const congregationName = await rl.question('Nombre de la congregación: ');
  const founderUid = await rl.question('Uid de quien queda como createdBy/superadmin: ');
  rl.close();

  const { lat, lng } = loadEnvLatLng();

  // 1. Crear la congregación (con la ubicación que ya tenías en .env)
  const congregationRef = await db.collection('congregations').add({
    name: congregationName.trim(),
    createdBy: founderUid.trim(),
    createdAt: Date.now(),
    latitude: lat,
    longitude: lng,
  });
  const congregationId = congregationRef.id;
  console.log(`✅ Congregación creada: ${congregationId}`);

  // 2. Etiquetar TODOS los usuarios existentes (conservan su role actual)
  // 3. Etiquetar todos los territorios / grupos / avoidHouses existentes
  for (const col of ['users', 'territories', 'groups', 'avoidHouses']) {
    await tagCollection(col, congregationId);
  }

  console.log('\nListo. Ahora sí puedes pegar el firestore.rules nuevo en Firebase Console.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
