import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { resetTerritorySync } from '../hooks/useTerritory';

export const authService = {
  async getUserRole(userId: string): Promise<'user' | 'admin' | 'superadmin'> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return (data.role as 'user' | 'admin' | 'superadmin') || 'user';
      }
      return 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'user';
    }
  },

  getCurrentUser() {
    return auth.currentUser;
  },

  async logout() {
    try {
      await signOut(auth);
      // 🔄 Resetear la sincronización de territorios al cerrar sesión
      resetTerritorySync();
      console.log('Usuario ha cerrado sesión.');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  },

  // 🔹 Extra: utilidades para verificar roles
  isAdmin(role?: string) {
    return role === 'admin' || role === 'superadmin';
  },

  isSuperAdmin(role?: string) {
    return role === 'superadmin';
  },
};
