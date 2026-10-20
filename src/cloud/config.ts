import type { FirebaseOptions } from 'firebase/app'

// Datos del proyecto de Firebase. No son secretos (cualquier app web los expone):
// lo que protege los datos son las reglas de firestore.rules.
// Si se pone en null, Loppy vuelve a funcionar solo en el teléfono, sin cuentas.
export const firebaseConfig: FirebaseOptions | null = {
  apiKey: 'AIzaSyACdshpw1Lsi8tpKwqEH2Ik9p-9Nj9OO4s',
  authDomain: 'loppy-af3d7.firebaseapp.com',
  projectId: 'loppy-af3d7',
  storageBucket: 'loppy-af3d7.firebasestorage.app',
  messagingSenderId: '622090235555',
  appId: '1:622090235555:web:2f3a58e455dd5022c31916',
  measurementId: 'G-4TQBEX652P',
}
