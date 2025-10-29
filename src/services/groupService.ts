// groupService.ts
import { db } from "../config/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { mutate } from "swr";
import NetInfo from "@react-native-community/netinfo";
import { localDB } from './localDB';
import { Group } from '~/types/Group';

export const GROUPS_KEY = 'firestore:groups';
const LOCAL_STORAGE_KEY = 'groups';

export const groupService = {
  // Obtener grupos locales
  async getLocalGroups(): Promise<Group[]> {
    return await localDB.getCollection<Group>(LOCAL_STORAGE_KEY);
  },

  // Guardar grupos locales
  async saveLocalGroups(groups: Group[]) {
    await localDB.saveCollection<Group>(LOCAL_STORAGE_KEY, groups);
  },

  // Obtener todos
  async getAll(): Promise<Group[]> {
    return await this.getLocalGroups();
  },

  // 🔥 Guardar un grupo (CON FIREBASE)
  async saveGroup(groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> {
    // ✅ Checar conexión
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      console.log("🚫 No hay internet, no se guardó en Firestore");
      throw new Error("No hay conexión a internet");
    }

    const newGroup: Omit<Group, 'id'> = {
      ...groupData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 🔥 Guardar en Firebase
    const docRef = await addDoc(collection(db, "groups"), newGroup);
    console.log("✅ Grupo guardado en Firestore con id:", docRef.id);

    const savedGroup = { ...newGroup, id: docRef.id };
    
    // Guardar localmente también
    const local = await this.getLocalGroups();
    local.push(savedGroup);
    await this.saveLocalGroups(local);

    mutate(GROUPS_KEY);
    return savedGroup;
  },

  // 🔥 Actualizar un grupo (CON FIREBASE)
  async updateGroup(id: string, updates: Partial<Group>): Promise<void> {
    const local = await this.getLocalGroups();
    const index = local.findIndex(g => g.id === id);
    
    if (index === -1) {
      throw new Error(`Group with id ${id} not found`);
    }
    
    const updatedGroup = {
      ...local[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    local[index] = updatedGroup;
    await this.saveLocalGroups(local);
    mutate(GROUPS_KEY);

    // 🔥 Actualizar en Firebase si hay internet
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      const groupRef = doc(db, "groups", id);
      await updateDoc(groupRef, { ...updates, updatedAt: new Date().toISOString() });
      console.log("✏️ Grupo actualizado en Firestore:", id);
    }
  },

  // 🔥 Eliminar un grupo (CON FIREBASE)
  async deleteGroup(id: string): Promise<void> {
    const local = await this.getLocalGroups();
    const filtered = local.filter(g => g.id !== id);
    
    if (filtered.length === local.length) {
      throw new Error(`Group with id ${id} not found`);
    }
    
    await this.saveLocalGroups(filtered);
    mutate(GROUPS_KEY, filtered, false);

    // 🔥 Eliminar de Firebase si hay internet
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      const groupRef = doc(db, "groups", id);
      await deleteDoc(groupRef);
      console.log("🗑️ Grupo eliminado de Firestore:", id);
    }
  },

  // 🔄 Sincronizar con Firebase
  async syncAll(): Promise<Group[]> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      console.log("📦 Usando grupos locales (sin internet)");
      return this.getLocalGroups();
    }

    // 🔥 Descargar desde Firebase
    const snapshot = await getDocs(collection(db, "groups"));
    const remote = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Group[];
    console.log("⬇️ Grupos cargados desde Firestore:", remote.length);
    
    await this.saveLocalGroups(remote);
    mutate(GROUPS_KEY, remote, false);
    return remote;
  },
};