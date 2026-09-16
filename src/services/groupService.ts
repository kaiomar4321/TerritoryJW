import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '~/config/firebase';
import { localDB } from './localDB';
import { Group } from '~/types/Group';
import { getCurrentCongregationId } from './session';

export const GROUPS_KEY = 'groups';

export const groupService = {
  // 🔹 Obtener grupos locales
  async getLocalGroups(): Promise<Group[]> {
    return await localDB.getCollection<Group>(GROUPS_KEY);
  },

  // 🔹 Guardar grupos locales
  async saveLocalGroups(groups: Group[]) {
    await localDB.saveCollection<Group>(GROUPS_KEY, groups);
  },

  // 🔹 Obtener todos los grupos de Firestore
  async getRemoteGroups(): Promise<Group[]> {
    const congregationId = await getCurrentCongregationId();
    const q = query(collection(db, 'groups'), where('congregationId', '==', congregationId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Group)
    );
  },

  // 🔹 Sincronizar (solo si hay cambios)
  async syncAll() {
    const [local, remote] = await Promise.all([
      this.getLocalGroups(),
      this.getRemoteGroups(),
    ]);

    // Si son diferentes (por contenido o cantidad)
    const changed = JSON.stringify(local) !== JSON.stringify(remote);

    if (changed) {
      console.log('🔄 Sincronizando grupos locales con Firestore');
      await this.saveLocalGroups(remote);
    }
  },

  // 🔹 Crear grupo
  async saveGroup(group: Omit<Group, 'id' | 'updatedAt' | 'congregationId'>): Promise<Group> {
    const congregationId = await getCurrentCongregationId();
    const data = { ...group, congregationId, updatedAt: Date.now().toString() };
    const ref = await addDoc(collection(db, 'groups'), data);
    const newGroup = { id: ref.id, ...data };

    // Guardar localmente
    const local = await this.getLocalGroups();
    await this.saveLocalGroups([...local, newGroup]);

    return newGroup;
  },

  // 🔹 Actualizar grupo
  async updateGroup(id: string, updates: Partial<Group>) {
    const ref = doc(db, 'groups', id);
    await updateDoc(ref, { ...updates, updatedAt: Date.now().toString() });

    const local = await this.getLocalGroups();
    const updated = local.map((g) =>
      g.id === id ? { ...g, ...updates, updatedAt: Date.now().toString() } : g
    );
    await this.saveLocalGroups(updated);
  },

  // 🔹 Eliminar grupo
  async deleteGroup(id: string) {
    await deleteDoc(doc(db, 'groups', id));

    const local = await this.getLocalGroups();
    const filtered = local.filter((g) => g.id !== id);
    await this.saveLocalGroups(filtered);
  },

  // 🔹 Asignar territorio a grupo
async assignTerritory(groupId: string, territoryId: string) {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);

    if (!snap.exists()) throw new Error('El grupo no existe');

    const data = snap.data();
    const current = Array.isArray(data.territoryIds) ? data.territoryIds : [];

    if (current.includes(territoryId)) {
      console.log('⚠️ El territorio ya está asignado a este grupo');
      return;
    }

    await updateDoc(groupRef, {
      territoryIds: [...current, territoryId],
    });

    // ✅ También puedes marcar en Firestore que el territorio pertenece al grupo
    const territoryRef = doc(db, 'territories', territoryId);
    await updateDoc(territoryRef, { groupId });
  },

  // 🔹 Quitar territorio del grupo
   async unassignTerritory(groupId: string, territoryId: string) {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);

    if (!snap.exists()) throw new Error('El grupo no existe');

    const data = snap.data();
    const current = Array.isArray(data.territoryIds) ? data.territoryIds : [];

    await updateDoc(groupRef, {
      territoryIds: current.filter((id) => id !== territoryId),
    });

    // ❌ Liberar el territorio
    const territoryRef = doc(db, 'territories', territoryId);
    await updateDoc(territoryRef, { groupId: null });
  },

};
