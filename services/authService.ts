// services/authService.ts
import { supabase } from './supabaseService';
import { User } from '../types';

export const authService = {
  // התחברות עם Google
  async signInWithGoogle(): Promise<{ user: User | null; error: any }> {
    try {
      // קביעת redirect URL ידנית
      const redirectUrl = window.location.hostname.includes('vercel.app') 
        ? window.location.origin 
        : 'https://fun-pictures-with-db-ver2.vercel.app';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        return { user: null, error };
      }

      // המשתמש יועבר לדף callback של Google ויחזור לאפליקציה
      return { user: null, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  // התנתקות
  async signOut(): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      // נקה את ה-URL מפרמטרי Auth אחרי התנתקות
      if (window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  },

  // קבלת המשתמש הנוכחי
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // האזנה לשינויי Auth
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      // טיפול ב-callback אחרי Google OAuth
      if (event === 'SIGNED_IN' && session?.user) {
        // נקה את ה-URL מפרמטרי Auth
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name
        };
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      } else if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  },

  // פונקציה לטיפול בSession כשהדף נטען
  async handleAuthCallback(): Promise<void> {
    try {
      // בדוק אם יש פרמטרי Auth ב-URL
      if (window.location.hash.includes('access_token')) {
        // תן לSupabase לעבד את הSession
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
        }
        
        // נקה את ה-URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Error handling auth callback:', error);
    }
  }
};
