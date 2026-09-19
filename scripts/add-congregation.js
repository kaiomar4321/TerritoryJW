// Crea una congregación, o actualiza sus datos si ya existe (se busca por nombre).
// Opcionalmente deja a un usuario ya registrado como su superadmin.
//
// Uso:
//   node scripts/add-congregation.js "Nombre" --city="Pátzcuaro" --state="Michoacán"
//   node scripts/add-congregation.js "Nombre" --lat=19.51 --lng=-101.60
//   node scripts/add-congregation.js "Nombre" --email=correo@ejemplo.com
//   node scripts/add-congregation.js "Nombre" --rename="Nombre nuevo"
//
// --email: la persona debe haberse registrado primero en la app.
// Requiere scripts/serviceAccountKey.json (gitignored).

const admin = require('firebase-admin');

admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

function parseArgs() {
  const [name, ...rest] = process.argv.slice(2);
  const flags = {};
  for (const arg of rest) {
    const m = arg.match(/^--([a-z]+)=(.*)$/);
    if (m) flags[m[1]] = m[2];
  }
  return { name, flags };
}

async function main() {
  const { name, flags } = parseArgs();
  if (!name) {
    console.error('Uso: node scripts/add-congregation.js "Nombre" [--city=..] [--state=..] [--lat=..] [--lng=..] [--email=..] [--rename=..]');
    process.exit(1);
  }

  const data = {};
  if (flags.city) data.city = flags.city;
  if (flags.state) data.state = flags.state;
  if (flags.lat) data.latitude = Number(flags.lat);
  if (flags.lng) data.longitude = Number(flags.lng);
  if (flags.rename) data.name = flags.rename;

  const existing = await db.collection('congregations').where('name', '==', name).get();
  let ref;
  if (existing.empty) {
    ref = await db.collection('congregations').add({
      name,
      createdBy: 'script',
      createdAt: Date.now(),
      ...data,
    });
    console.log(`✅ Congregación creada: ${name} (${ref.id})`);
  } else {
    ref = existing.docs[0].ref;
    if (Object.keys(data).length > 0) {
      await ref.update(data);
      console.log(`✅ Actualizada: ${name} -> ${JSON.stringify(data)}`);
    } else {
      console.log(`ℹ️ Ya existía: ${name} (${ref.id})`);
    }
  }

  if (flags.email) {
    const users = await db.collection('users').where('email', '==', flags.email).get();
    if (users.empty) {
      console.error(`❌ No hay ningún usuario con el correo ${flags.email}. Debe registrarse primero en la app.`);
      process.exit(1);
    }
    await users.docs[0].ref.update({ congregationId: ref.id, role: 'superadmin' });
    console.log(`✅ ${flags.email} ahora es superadmin de ${data.name ?? name}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
