import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export const locationService = {
  async saveLocation(locationData) {
    try {
      const docRef = await addDoc(collection(db, 'locations'), {
        name: locationData.name,
        coordinates: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
        createdAt: new Date(),
        type: locationData.type || 'default',
        description: locationData.description || ''
      });
      console.log('Location saved with ID: ', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving location: ', error);
      throw error;
    }
  }
};