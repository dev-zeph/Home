import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true)
      
      // First check if username is already taken
      if (userData.username) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .eq('username', userData.username)
          .single()
        
        if (existingUser) {
          throw new Error('Username is already taken')
        }
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: userData.role || 'tenant',
            display_name: userData.displayName || '',
            username: userData.username || '',
            phone: userData.phone || ''
          }
        }
      })
      
      if (error) throw error
      
      // If signup successful and we have a user, create the profile
      if (data.user && userData.username) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            display_name: userData.displayName || '',
            username: userData.username,
            phone: userData.phone || '',
            role: userData.role || 'tenant'
          })
        
        if (profileError) {
          console.error('Error creating user profile:', profileError)
          // Don't throw here as the auth user was created successfully
        }
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isOwner: user?.user_metadata?.role === 'owner',
    isTenant: user?.user_metadata?.role === 'tenant',
    isAdmin: user?.user_metadata?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
