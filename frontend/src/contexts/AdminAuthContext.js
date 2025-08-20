import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AdminAuthContext = createContext({});

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(null);

  // Admin session timeout (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  useEffect(() => {
    checkAdminSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await checkAdminRole(session.user);
      } else {
        setAdmin(null);
        clearSessionTimeout();
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearSessionTimeout();
    };
  }, []);

  const checkAdminSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await checkAdminRole(session.user);
      } else {
        setAdmin(null);
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminRole = async (user) => {
    try {
      // Use the service role to bypass RLS for admin checks
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        // If we can't check the role, assume not admin for security
        setAdmin(null);
        clearSessionTimeout();
        return false;
      }

      if (!userData || (userData.role !== 'admin' && userData.role !== 'verification_officer')) {
        console.log('User is not an admin. Role:', userData?.role || 'none');
        setAdmin(null);
        clearSessionTimeout();
        return false;
      }

      console.log('Admin login successful. Role:', userData.role);
      setAdmin({ ...user, role: userData.role });
      resetSessionTimeout();
      return true;
    } catch (error) {
      console.error('Error checking admin role:', error);
      setAdmin(null);
      clearSessionTimeout();
      return false;
    }
  };

  const resetSessionTimeout = () => {
    clearSessionTimeout();
    const timeoutId = setTimeout(() => {
      handleSessionTimeout();
    }, SESSION_TIMEOUT);
    setSessionTimeout(timeoutId);
  };

  const clearSessionTimeout = () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
  };

  const handleSessionTimeout = async () => {
    try {
      await supabase.auth.signOut();
      setAdmin(null);
      clearSessionTimeout();
    } catch (error) {
      console.error('Error during session timeout:', error);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is admin
      const isAdmin = await checkAdminRole(data.user);
      
      if (!isAdmin) {
        // Sign out the user since they're not an admin
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      return { user: data.user };
    } catch (error) {
      setAdmin(null);
      clearSessionTimeout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      
      // Admin signup requires special invitation/verification
      // For now, we'll just create the user and manually set role to admin
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: userData.display_name,
            role: 'admin' // This should be controlled server-side in production
          }
        }
      });

      if (error) throw error;

      return { user: data.user };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      clearSessionTimeout();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAdmin(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset session timeout on user activity
  const resetTimeout = () => {
    if (admin) {
      resetSessionTimeout();
    }
  };

  useEffect(() => {
    if (admin) {
      // Listen for user activity to reset timeout
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      const resetTimeoutHandler = () => resetTimeout();
      
      events.forEach(event => {
        document.addEventListener(event, resetTimeoutHandler, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, resetTimeoutHandler, true);
        });
      };
    }
  }, [admin]);

  const value = {
    admin,
    loading,
    signIn,
    signUp,
    signOut,
    resetTimeout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
