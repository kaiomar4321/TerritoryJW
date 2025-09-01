import { db } from "../config/firebase";
import { collection, addDoc, query, onSnapshot, doc, updateDoc, getDocs, setDoc } from "firebase/firestore";
import { mutate } from "swr";
import { Territory } from "~/types/Territory";
import { territoryUtils } from "~/utils/territoryUtils";
import { localDB } from "./localDB";
import NetInfo from "@react-native-community/netinfo";

export const TERRITORIES_KEY = "firestore:territories";

export const territoryService = {
  async saveTerritory(coordinates: any[], userId: string) {
    if (!coordinates || coordinates.length < 3) {
      throw new Error("Se necesitan al menos 3 puntos para crear un territorio");
    }

    const newTerritory: Territory = {
      id: Date.now().toString(), // id temporal si offline
      coordinates,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      color: "rgba(255, 0, 0, 0.8)",
      name: "Territorio Nuevo",
      number: 0,
      lastModified: Date.now(),
      synced: false,
    };

    // guardar en local primero
    const local = await localDB.getTerritories();
    await localDB.saveTerritories([...local, newTerritory]);
    mutate(TERRITORIES_KEY);

    // si hay internet, subir a Firestore
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      const docRef = await addDoc(collection(db, "territories"), newTerritory);
      // reemplazar id temporal por id real
      const updated = { ...newTerritory, id: docRef.id, synced: true };
      await localDB.saveTerritories([...local, updated]);
      mutate(TERRITORIES_KEY);
      return updated;
    }

    return newTerritory;
  },

  async updateTerritory(id: string, updates: Partial<Territory>) {
    const local = await localDB.getTerritories();
    const updatedAt = Date.now();

    const newData = local.map((t) =>
      t.id === id ? { ...t, ...updates, lastModified: updatedAt, synced: false } : t
    );

    await localDB.saveTerritories(newData);
    mutate(TERRITORIES_KEY);

    const state = await NetInfo.fetch();
    if (state.isConnected) {
      const territoryRef = doc(db, "territories", id);
      await updateDoc(territoryRef, { ...updates, lastModified: updatedAt });
      const syncedData = newData.map((t) =>
        t.id === id ? { ...t, synced: true } : t
      );
      await localDB.saveTerritories(syncedData);
      mutate(TERRITORIES_KEY);
    }

    return updates;
  },

  // 🔄 sincronizar todo
  async syncAll() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return localDB.getTerritories();

    // 1. subir pendientes
    const local = await localDB.getTerritories();
    for (const t of local.filter((t) => !t.synced)) {
      const ref = doc(db, "territories", t.id);
      await setDoc(ref, { ...t, synced: true });
    }

    // 2. bajar desde firebase
    const snapshot = await getDocs(collection(db, "territories"));
    const remote = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Territory[];
    console.log('sacando territorios de firebase')
    await localDB.saveTerritories(remote);
    mutate(TERRITORIES_KEY, remote, false);
    return remote;
  },

  async getLocalTerritories() {
    return localDB.getTerritories();
  },

  // funciones batch (igual que ya tenías)
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
