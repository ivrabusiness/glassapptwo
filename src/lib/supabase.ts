import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// KLJUČNO: Ove varijable će biti postavljene kada se poveže Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Kreiraj Supabase klijent s TypeScript tipovima
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
};

// Helper funkcije za provjeru konekcije
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

export const testConnection = async () => {
  try {
    // Get current user ID for tenant filtering
    const userId = await getCurrentUserId();
    
    // Test connection with tenant_id filter
    const { data, error } = await supabase
      .from('inventory')
      .select('count')
      .eq('tenant_id', userId)
      .limit(1);
      
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
};
