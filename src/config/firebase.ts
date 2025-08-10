import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyD7gzO7g_Nk_xTSTba4jGJsqfzX4O6XG8w",
  authDomain: "jw-territories-patz.firebaseapp.com",
  projectId: "jw-territories-patz",
  storageBucket: "jw-territories-patz.firebasestorage.app",
  messagingSenderId: "356836688476",
  appId: "1:356836688476:android:708d1a950469b0a9d6dc99"
};

const app = initializeApp(firebaseConfig);

// Inicializar Auth con persistencia
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);