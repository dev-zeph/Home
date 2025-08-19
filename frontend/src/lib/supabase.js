import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const auth = {
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: () => {
    return supabase.auth.getUser()
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helper functions
export const db = {
  // Properties
  getProperties: async (filters = {}) => {
    let query = supabase
      .from('properties')
      .select(`
        *,
        media (*),
        owner:users!properties_owner_id_fkey (*)
      `)
      .eq('published', true)

    if (filters.city) query = query.ilike('city', `%${filters.city}%`)
    if (filters.propertyType) query = query.eq('type', filters.propertyType)
    if (filters.minPrice) query = query.gte('price_ngn', filters.minPrice)
    if (filters.maxPrice) query = query.lte('price_ngn', filters.maxPrice)
    if (filters.beds) query = query.eq('beds', filters.beds)
    if (filters.baths) query = query.eq('baths', filters.baths)

    const { data, error } = await query
    return { data, error }
  },

  getProperty: async (id) => {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        media (*),
        owner:users!properties_owner_id_fkey (*),
        applications (*, tenant:users!applications_tenant_id_fkey (*))
      `)
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  createProperty: async (propertyData) => {
    const { data, error } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
    
    return { data, error }
  },

  // Applications
  createApplication: async (applicationData) => {
    const { data, error } = await supabase
      .from('applications')
      .insert([applicationData])
      .select()
    
    return { data, error }
  },

  getUserApplications: async (userId) => {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        property:properties (*),
        owner:users!applications_property_id_fkey (*)
      `)
      .eq('tenant_id', userId)
    
    return { data, error }
  }
}
