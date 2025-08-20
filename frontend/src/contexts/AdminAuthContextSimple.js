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

  useEffect(() => {
    checkAdminSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await checkAdminRole(session.user);
      } else {
        setAdmin(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
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
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin role:', error);
        setAdmin(null);
        return false;
      }

      if (userData?.role !== 'admin') {
        setAdmin(null);
        return false;
      }

      setAdmin({ ...user, role: userData.role });
      return true;
    } catch (error) {
      console.error('Error checking admin role:', error);
      setAdmin(null);
      return false;
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: userData.display_name,
            role: 'admin'
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

  const value = {
    admin,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
