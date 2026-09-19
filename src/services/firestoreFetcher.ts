// services/firestoreFetcher.ts
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { houseService } from "./houseService";
import { getCurrentCongregationId } from "./session";

export const firestoreFetcher = async (key: string) => {
  // Si la key ya incluye el prefijo, úsala directamente
  const path = key.startsWith('firestore:') ? key.split(":")[1] : key;
  const snap = await getDocs(collection(db, path));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Fetcher específico para territorios con validación
export const territoriesFetcher = async () => {
  const congregationId = await getCurrentCongregationId();
  const q = query(collection(db, 'territories'), where('congregationId', '==', congregationId));
  const snap = await getDocs(q);
  const territories: any[] = [];
  
  snap.docs.forEach((doc) => {
    const data = doc.data();
    // Asegurarse de que las coordenadas existan y sean válidas
    if (data.coordinates && data.coordinates.length >= 3) {
      territories.push({
        id: doc.id,
        ...data,
      });
    }
  });
  
  return territories;
};

// Fetcher específico para houses que extrae el territoryId de la key
export const housesFetcher = async (key: string) => {
  // La key viene como "houses:territoryId"
  const territoryId = key.split(":")[1];
  if (!territoryId) {
    throw new Error('Territory ID is required');
  }
  
  return await houseService.getHousesByTerritory(territoryId);
};