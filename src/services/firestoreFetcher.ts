// services/firestoreFetcher.ts
import { getDocs, collection } from "firebase/firestore";
import { db } from "../config/firebase";

export const firestoreFetcher = async (key: string) => {
  const [_, path] = key.split(":"); // ejemplo: "firestore:territories"
  const snap = await getDocs(collection(db, path));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
