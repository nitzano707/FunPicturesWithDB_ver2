// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // בדוק אם יש משתמש מחובר בעת טעינת האפליקציה
    const checkUser = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    checkUser();

    // האזן לשינויי התחברות
    const { data: { subscription } } = authService.onAuthStateChange((newUser) => {
      setUser(newUser);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await authService.signInWithGoogle();
      if (error) {
        console.error('Error signing in:', error);
        setLoading(false);
      }
      // אחרי הצלחת התחברות, הuser יתעדכן דרך onAuthStateChange
    } catch (error) {
      console.error('Error signing in:', error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await authService.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
    setLoading(false);
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
