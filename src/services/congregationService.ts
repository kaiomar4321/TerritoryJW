import { db } from '~/config/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where } from 'firebase/firestore';
import { Congregation } from '~/types/Congregation';

const congregationRef = collection(db, 'congregations');

export const congregationService = {
  async getAll(): Promise<Congregation[]> {
    const snap = await getDocs(congregationRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Congregation[];
  },

  // Usado en el registro: ¿ya existe una congregación con este nombre?
  async getByName(name: string): Promise<Congregation | null> {
    const q = query(congregationRef, where('name', '==', name));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Congregation;
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
