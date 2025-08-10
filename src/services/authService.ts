import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export const authService = {
  async getUserRole(userId: string) {
    try {
      console.log('Checking role for user:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));
      console.log('User doc exists:', userDoc.exists());

      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('User data:', data);
        return data.role || 'user';
      }
      return 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'user';
    }
  },

  getCurrentUser() {
    const user = auth.currentUser;
    console.log('getCurrentUser:', user?.email);
    return user;
  },

  async logout() {
    try {
      await signOut(auth);
      console.log('Usuario ha cerrado sesión.');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }
};
