import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBTspYlYcecISsizE8NARckppuCHv5N3rE',
  appId: '1:791985764276:web:b0d6cbcda39ce8defa24e1',
  messagingSenderId: '791985764276',
  projectId: 'uniunion-1c239',
  storageBucket: 'uniunion-1c239.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);