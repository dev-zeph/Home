import { supabase } from '../lib/supabase';

export const propertyService = {
  // Get all properties with optional filters
  async getProperties(filters = {}) {
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_media(url, type),
        user_id(display_name, email)
      `)
      .eq('status', 'active');

    // Apply filters
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters.state) {
      query = query.ilike('state', `%${filters.state}%`);
    }
    if (filters.property_type) {
      query = query.eq('property_type', filters.property_type);
    }
    if (filters.min_price) {
      query = query.gte('price', filters.min_price);
    }
    if (filters.max_price) {
      query = query.lte('price', filters.max_price);
    }
    if (filters.bedrooms) {
      query = query.gte('bedrooms', filters.bedrooms);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Get a single property by ID
  async getProperty(id) {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_media(url, type),
        user_id(display_name, email, phone)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Create a new property listing
  async createProperty(propertyData) {
    const { data, error } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Update a property
  async updateProperty(id, updates) {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Delete a property
  async deleteProperty(id) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Upload property media
  async uploadPropertyMedia(propertyId, file, type = 'image') {
    const fileName = `${propertyId}/${Date.now()}-${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-media')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('property-media')
      .getPublicUrl(fileName);

    // Save media record to database
    const { data, error } = await supabase
      .from('property_media')
      .insert([{
        property_id: propertyId,
        url: urlData.publicUrl,
        type: type
      }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
};
