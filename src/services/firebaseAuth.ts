import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../config/firebase';
import { api } from './api';

// Connexion avec Google
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    
    // Envoyer le token au backend
    const response = await api.post('/auth/firebase', { token });
    
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Erreur connexion Google:', error);
    throw error;
  }
};

// Connexion avec Facebook
export const loginWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    const token = await result.user.getIdToken();
    
    // Envoyer le token au backend
    const response = await api.post('/auth/firebase', { token });
    
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Erreur connexion Facebook:', error);
    throw error;
  }
};

// Connexion avec Email/Password (utilise Firebase)
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    
    // Envoyer le token au backend
    const response = await api.post('/auth/firebase', { token });
    
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Erreur connexion email:', error);
    throw error;
  }
};

// Inscription avec Email/Password (utilise Firebase)
export const registerWithEmail = async (email: string, password: string, prenom: string, nom: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    
    // Envoyer au backend avec les infos supplémentaires
    const response = await api.post('/auth/firebase', { 
      token,
      prenom,
      nom
    });
    
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Erreur inscription:', error);
    throw error;
  }
};
