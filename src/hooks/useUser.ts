// hooks/useUser.ts
import { useState, useEffect } from 'react';
import { auth } from '~/config/firebase';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

export const useUser = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const docRef = doc(getFirestore(), 'users', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setUserData({ uid, ...snap.data() });
        } else {
          setUserData({ uid, displayName: auth.currentUser?.displayName, photoURL: auth.currentUser?.photoURL });
        }
      } catch (e) {
        console.error('Error cargando usuario:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [uid]);

  const updateUser = async (data: { displayName?: string; photoURL?: string; [key: string]: any }) => {
    if (!uid) return;

    // Actualizar Firestore
    const docRef = doc(getFirestore(), 'users', uid);
    await updateDoc(docRef, data);

    // Actualizar Auth si hay displayName o photoURL
    if (data.displayName || data.photoURL) {
      await updateProfile(auth.currentUser!, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });
    }

    // Actualizar state local
    setUserData((prev: any) => ({ ...prev, ...data }));
  };

  return { userData, updateUser, loading };
};
