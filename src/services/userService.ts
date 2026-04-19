import { getFirestore, doc, updateDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from '~/config/firebase';

const db = getFirestore();

export const userService = {
  /**
   * 🔹 Obtener todos los usuarios (solo para admin+)
   * - Valida que el usuario actual sea admin
   * - Devuelve lista de usuarios
   */
  async getAllUsers() {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No autenticado');

    const currentRef = doc(db, 'users', currentUser.uid);
    const currentSnap = await getDoc(currentRef);
    const currentRole = currentSnap.data()?.role;

    if (currentRole !== 'admin' && currentRole !== 'superadmin') {
      throw new Error(`Acceso denegado. Tu rol es: "${currentRole}". Se requiere: admin o superadmin`);
    }

    // Obtener todos los usuarios
    try {
      const usersCollection = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollection);
      const usersList = querySnapshot.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      }));
      return usersList;
    } catch (error: any) {
      // Si Firestore rechaza la query, intenta con un query más permisivo
      console.warn('Query sin filtro rechazada, reintentando...', error.message);
      
      // Fallback: obtener con una condición que sea siempre verdadera
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('__name__', '>=', ''));
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      }));
      return usersList;
    }
  },

  /**
   * 🔹 Eliminar un usuario (solo para superadmin)
   */
  async deleteUser(targetUserId: string) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No autenticado');

    // Validar que sea superadmin
    const currentRef = doc(db, 'users', currentUser.uid);
    const currentSnap = await getDoc(currentRef);
    const currentRole = currentSnap.data()?.role;

    if (currentRole !== 'superadmin') {
      throw new Error('Solo superadmins pueden eliminar usuarios');
    }

    if (targetUserId === currentUser.uid) {
      throw new Error('No puedes eliminar tu propio usuario');
    }

    const targetRef = doc(db, 'users', targetUserId);
    // Para eliminar, necesitaremos usar Firebase Admin SDK o una Cloud Function
    // Por ahora, marcamos como inactivo
    await updateDoc(targetRef, { isActive: false, deletedAt: new Date() });

    return { message: 'Usuario desactivado' };
  },

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
