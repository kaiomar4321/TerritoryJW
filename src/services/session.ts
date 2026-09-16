import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '~/config/firebase';

// Congregación del usuario actualmente logueado.
// Cada servicio la usa para filtrar sus queries y no mezclar datos entre congregaciones.
export async function getCurrentCongregationId(): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No autenticado');

  const snap = await getDoc(doc(db, 'users', uid));
  const congregationId = snap.data()?.congregationId;

  if (!congregationId) throw new Error('Tu usuario no tiene una congregación asignada');

  return congregationId;
}
