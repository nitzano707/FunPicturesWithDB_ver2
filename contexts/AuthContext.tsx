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
    let mounted = true;

    const initAuth = async () => {
      try {
        // טפל בauth callback אם קיים
        await authService.handleAuthCallback();
        
        // בדוק אם יש משתמש מחובר
        const currentUser = await authService.getCurrentUser();
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // האזן לשינויי התחברות
    const { data: { subscription } } = authService.onAuthStateChange((newUser) => {
      if (mounted) {
        setUser(newUser);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
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
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
