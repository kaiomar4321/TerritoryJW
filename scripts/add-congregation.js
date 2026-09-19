// Crea una congregación (si no existe) y, opcionalmente, deja a un usuario
// ya registrado como su superadmin.
//
// Uso:
//   node scripts/add-congregation.js "Camecuaro"
//   node scripts/add-congregation.js "Camecuaro" correo@ejemplo.com
//
// La persona debe haberse registrado primero en la app (para tener cuenta).
// Requiere scripts/serviceAccountKey.json (gitignored).

const admin = require('firebase-admin');

admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function main() {
  const [name, email] = process.argv.slice(2);
  if (!name) {
    console.error('Uso: node scripts/add-congregation.js "Nombre" [correo]');
    process.exit(1);
  }

  const existing = await db.collection('congregations').where('name', '==', name).get();
  let congregationId;
  if (existing.empty) {
    const ref = await db.collection('congregations').add({
      name,
      createdBy: 'script',
      createdAt: Date.now(),
    });
    congregationId = ref.id;
    console.log(`✅ Congregación creada: ${name} (${congregationId})`);
  } else {
    congregationId = existing.docs[0].id;
    console.log(`ℹ️ Ya existía: ${name} (${congregationId})`);
  }

  if (email) {
    const users = await db.collection('users').where('email', '==', email).get();
    if (users.empty) {
      console.error(`❌ No hay ningún usuario con el correo ${email}. Debe registrarse primero en la app.`);
      process.exit(1);
    }
    await users.docs[0].ref.update({ congregationId, role: 'superadmin' });
    console.log(`✅ ${email} ahora es superadmin de ${name}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
