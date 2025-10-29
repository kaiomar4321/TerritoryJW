import { db } from "../config/firebase";
import { collection, addDoc, query, onSnapshot, doc, updateDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { mutate } from "swr";
import { Territory } from "~/types/Territory";
import { territoryUtils } from "~/utils/territoryUtils";
import { localDB } from "./localDB";
import NetInfo from "@react-native-community/netinfo";

export const TERRITORIES_KEY = "firestore:territories";
const LOCAL_STORAGE_KEY = "territories"; // 🔑 Key para AsyncStorage

export const territoryService = {
  async saveTerritory(coordinates: any[], userId: string) {
    if (!coordinates || coordinates.length < 3) {
      throw new Error("Se necesitan al menos 3 puntos para crear un territorio");
    }

    // ✅ Checar conexión antes de guardar
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      console.log("🚫 No hay internet, no se guardó en Firestore");
      throw new Error("No hay conexión a internet");
    }

    const newTerritory: Omit<Territory, "id"> = {
      coordinates,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      color: "rgba(255, 0, 0, 0.8)",
      name: "Territorio Nuevo",
      number: 0,
      lastModified: Date.now(),
      synced: true,
    };

    const docRef = await addDoc(collection(db, "territories"), newTerritory);
    console.log("✅ Territorio guardado en Firestore con id:", docRef.id);

    mutate(TERRITORIES_KEY);
    return { ...newTerritory, id: docRef.id };
  },

  async deleteTerritory(id: string) {
    if (!id) throw new Error("Se necesita un id para eliminar el territorio");

    try {
      // 🔹 1. Eliminar localmente usando localDB
      const local = await localDB.getCollection<Territory>(LOCAL_STORAGE_KEY);
      const updatedLocal = local.filter((t) => t.id !== id);
      await localDB.saveCollection(LOCAL_STORAGE_KEY, updatedLocal);
      mutate(TERRITORIES_KEY, updatedLocal, false);

      // 🔹 2. Si hay internet, eliminar en Firestore
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        const territoryRef = doc(db, "territories", id);
        await deleteDoc(territoryRef);
        console.log("🗑️ Territorio eliminado de Firestore:", id);
      }

      return true;
    } catch (error) {
      console.error("Error eliminando territorio:", error);
      throw error;
    }
  },

  async updateTerritory(id: string, updates: Partial<Territory>) {
    const local = await localDB.getCollection<Territory>(LOCAL_STORAGE_KEY);
    const updatedAt = Date.now();

    const newData = local.map((t) =>
      t.id === id ? { ...t, ...updates, lastModified: updatedAt, synced: false } : t
    );

    await localDB.saveCollection(LOCAL_STORAGE_KEY, newData);
    mutate(TERRITORIES_KEY);

    const state = await NetInfo.fetch();
    if (state.isConnected) {
      const territoryRef = doc(db, "territories", id);
      await updateDoc(territoryRef, { ...updates, lastModified: updatedAt });
      const syncedData = newData.map((t) =>
        t.id === id ? { ...t, synced: true } : t
      );
      await localDB.saveCollection(LOCAL_STORAGE_KEY, syncedData);
      mutate(TERRITORIES_KEY);
      console.log("✏️ Territorio actualizado en Firestore:", id);
    }

    return updates;
  },

  // 🔄 sincronizar todo
  async syncAll() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      console.log("📦 Usando territorios locales (sin internet)");
      return localDB.getCollection<Territory>(LOCAL_STORAGE_KEY);
    }

    // 1. subir pendientes
    const local = await localDB.getCollection<Territory>(LOCAL_STORAGE_KEY);
    for (const t of local.filter((t) => !t.synced)) {
      const ref = doc(db, "territories", t.id);
      await setDoc(ref, { ...t, synced: true });
      console.log("⬆️ Sincronizado a Firestore:", t.id);
    }

    // 2. bajar desde firebase
    const snapshot = await getDocs(collection(db, "territories"));
    const remote = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Territory[];
    console.log("⬇️ Territorios cargados desde Firestore:", remote.length);
    await localDB.saveCollection(LOCAL_STORAGE_KEY, remote);
    mutate(TERRITORIES_KEY, remote, false);
    return remote;
  },

  async getLocalTerritories() {
    return localDB.getCollection<Territory>(LOCAL_STORAGE_KEY);
  },

  // funciones batch
  async updateMultipleTerritories(updates: Partial<Territory>[]) {
    const promises = updates.map((u) => this.updateTerritory(u.id!, u));
    return Promise.all(promises);
  },

  async markAllAsReady(territories: Territory[]) {
    const updates = territoryUtils.prepareReadyUpdates(territories);
    return this.updateMultipleTerritories(updates);
  },

  async markAllAsCompleted(territories: Territory[]) {
    const updates = territoryUtils.prepareCompletedUpdates(territories);
    return this.updateMultipleTerritories(updates);
  },
};