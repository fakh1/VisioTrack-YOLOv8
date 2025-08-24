import React, { useEffect } from 'react';
import { 
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export const AuthProvider = ({ children }) => {
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        await setPersistence(auth, browserSessionPersistence);
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('User signed in:', result.user);
        }
      } catch (error) {
        console.error('Authentication error:', error);
      }
    };
    
    handleRedirect();
  }, []);

  return children;
};