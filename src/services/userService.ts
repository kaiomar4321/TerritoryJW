import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth } from '~/config/firebase';

const db = getFirestore();

export const userService = {
  /**
   * 🔹 Cambiar rol de un usuario
   * - Admin: solo puede promover `user → admin`
   * - Superadmin: puede cambiar entre cualquier rol
   */
  async changeUserRole(targetUserId: string, newRole: 'user' | 'admin' | 'superadmin') {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No hay usuario autenticado');

    const currentRef = doc(db, 'users', currentUser.uid);
    const currentSnap = await getDoc(currentRef);
    const currentRole = currentSnap.data()?.role;

    if (!currentRole) throw new Error('No se encontró el rol del usuario actual');

    if (currentRole === 'admin' && newRole !== 'admin') {
      throw new Error('Los administradores solo pueden ascender a usuarios a admin.');
    }

    if (currentRole === 'user') {
      throw new Error('Los usuarios no pueden cambiar roles.');
    }

    const targetRef = doc(db, 'users', targetUserId);
    await updateDoc(targetRef, { role: newRole });

    return { message: `Rol actualizado a ${newRole}` };
  },
};
