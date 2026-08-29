import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// Bug connu des types du SDK Firebase web (moduleResolution "bundler") :
// getReactNativePersistence existe bien au runtime (Metro résout la version
// React Native), mais son type n'est pas exposé par le module "firebase/auth".
// @ts-expect-error
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clé publique du SDK web Firebase : pas un secret, elle est protégée par les
// règles de sécurité Firestore/Auth, pas par sa confidentialité.
const firebaseConfig = {
  apiKey: 'AIzaSyBI15MeqhXqjDMqNV6R-UCyCagwC0ZCgSo',
  authDomain: 'zonekite.firebaseapp.com',
  projectId: 'zonekite',
  storageBucket: 'zonekite.firebasestorage.app',
  messagingSenderId: '502435639254',
  appId: '1:502435639254:web:f2562703d99174daf0be77',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// La base Firestore a été créée sous l'ID "zonekite" (pas l'ID par défaut
// "(default)") depuis la console Firebase, donc on le précise ici.
export const db = getFirestore(app, 'zonekite');
