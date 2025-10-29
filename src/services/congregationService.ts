import { db } from '~/config/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Congregation } from '~/types/Congregation';

const congregationRef = collection(db, 'congregations');

export const congregationService = {
  async getAll(): Promise<Congregation[]> {
    const snap = await getDocs(congregationRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Congregation[];
  },

  async getById(id: string): Promise<Congregation | null> {
    const ref = doc(db, 'congregations', id);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Congregation) : null;
  },

  async create(data: Omit<Congregation, 'id'>) {
    return await addDoc(congregationRef, data);
  },

  async update(id: string, data: Partial<Congregation>) {
    const ref = doc(db, 'congregations', id);
    await updateDoc(ref, data);
  },
};
