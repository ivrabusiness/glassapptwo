import { supabase } from './supabase';
import { createClient, User } from '@supabase/supabase-js';

export interface DeviceRegistrationData {
  deviceName: string;
  email: string;
  password: string;
}

export interface DeviceLoginData {
  email: string;
  password: string;
}

export interface DeviceAuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface DeviceInfo {
  id: string;
  device_name: string;
  device_code: string;
  tenant_id: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  created_at: string;
}

/**
 * Generate a cryptographically secure random string
 */
function generateSecureRandom(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues for better security
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  
  return result;
}

/**
 * Generate a unique device code
 */
function generateDeviceCode(): string {
  const prefix = 'DEV';
  const timestamp = Date.now().toString(36).toUpperCase();
  const secureRandom = generateSecureRandom(8);
  return `${prefix}-${timestamp}-${secureRandom}`;
}

/**
 * Generate a secure device password
 */
function generateDevicePassword(): string {
  // Generate a strong password with mixed case, numbers, and symbols
  const uppercase = generateSecureRandom(3);
  const lowercase = generateSecureRandom(3);
  const numbers = generateSecureRandom(3).replace(/[a-zA-Z]/g, (c) => String(Math.floor(Math.random() * 10)));
  const symbols = '!@#$%';
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  
  // Combine and shuffle
  const combined = (uppercase + lowercase + numbers + symbol).split('');
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  
  return combined.join('');
}

/**
 * Generate a session token
 */
function generateSessionToken(): string {
  return generateSecureRandom(32) + Date.now().toString(36);
}

/**
 * Register a new device using Supabase Auth Admin API
 */
export async function registerDevice(
  tenantId: string, 
  deviceData: DeviceRegistrationData
): Promise<DeviceAuthResponse & { deviceCode?: string; email?: string; password?: string }> {
  try {
    // Generate unique device code
    const deviceCode = generateDeviceCode();
    
    // Require email and password from UI (no auto-generation)
    const email = deviceData.email?.trim();
    const password = deviceData.password;
    if (!email || !password) {
      return {
        success: false,
        error: 'Email i lozinka su obavezni'
      };
    }
    
    // Create a temporary Supabase client that does NOT persist or broadcast session changes
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // Create device user in Supabase Auth using the ephemeral client to avoid affecting current session
    const { data: authData, error: authError } = await tempSupabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          device_name: deviceData.deviceName,
          device_code: deviceCode,
          tenant_id: tenantId,
          user_type: 'device',
          status: 'active'
        }
      }
    });
    
    if (authError) {
      console.error('Device registration error:', authError);
      return {
        success: false,
        error: authError.message.includes('already registered') 
          ? 'Email već postoji za drugi uređaj'
          : 'Greška pri registraciji uređaja'
      };
    }
    
    if (!authData.user) {
      return {
        success: false,
        error: 'Greška pri kreiranju korisnika'
      };
    }
    // Create device_info record
    const { error: deviceInfoError } = await supabase
      .from('device_info')
      .insert({
        device_name: deviceData.deviceName,
        device_code: deviceCode,
        tenant_id: tenantId,
        auth_user_id: authData.user.id,
        status: 'active'
      });
    
    if (deviceInfoError) {
      console.error('Device info creation error:', deviceInfoError);
      // Continue anyway, device is created in auth
    }
    
    return {
      success: true,
      user: authData.user,
      deviceCode,
      // Provide credentials back to caller so UI can display them once
      // Note: do NOT log these values anywhere
      email,
      password,
    } as DeviceAuthResponse & { deviceCode?: string; email?: string; password?: string };
    
  } catch (error) {
    console.error('Device registration error:', error);
    return {
      success: false,
      error: 'Neočekivana greška pri registraciji'
    };
  }
}

/**
 * Login device using Supabase Auth
 */
export async function loginDevice(loginData: DeviceLoginData): Promise<DeviceAuthResponse> {
  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password
    });
    
    if (authError || !authData.user) {
      return {
        success: false,
        error: 'Neispravni podaci za prijavu'
      };
    }
    
    // Check if this is a device user
    const userMetadata = authData.user.user_metadata;
    if (userMetadata.user_type !== 'device') {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Neispravni podaci za prijavu'
      };
    }
    
    // Check device status
    if (userMetadata.status !== 'active') {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Uređaj nije aktivan'
      };
    }
    
    return {
      success: true,
      user: authData.user
    };
    
  } catch (error) {
    console.error('Device login error:', error);
    return {
      success: false,
      error: 'Neočekivana greška pri prijavi'
    };
  }
}

/**
 * Validate device session using Supabase Auth
 */
export async function validateDeviceSession(): Promise<DeviceAuthResponse> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return {
        success: false,
        error: 'Nevažeća sesija'
      };
    }
    
    // Check if this is a device user
    const userMetadata = user.user_metadata;
    if (userMetadata.user_type !== 'device') {
      return {
        success: false,
        error: 'Nevažeća sesija'
      };
    }
    
    // Check device status
    if (userMetadata.status !== 'active') {
      return {
        success: false,
        error: 'Uređaj nije aktivan'
      };
    }
    
    return {
      success: true,
      user
    };
    
  } catch (error) {
    console.error('Session validation error:', error);
    return {
      success: false,
      error: 'Greška pri validaciji sesije'
    };
  }
}

/**
 * Logout device using Supabase Auth
 */
export async function logoutDevice(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Greška pri odjavi'
      };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: 'Neočekivana greška pri odjavi'
    };
  }
}

/**
 * Get devices for a tenant using Supabase Auth Admin API
 */
export async function getDevicesForTenant(tenantId: string): Promise<DeviceInfo[]> {
  try {
    // Note: This would require admin access to list users
    // For now, we'll store device info in a separate table
    // that references auth.users but doesn't store passwords
    
    const { data: devices, error } = await supabase
      .from('device_info')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get devices error:', error);
      return [];
    }
    
    return devices || [];
    
  } catch (error) {
    console.error('Get devices error:', error);
    return [];
  }
}

/**
 * Update device status
 */
export async function updateDeviceStatus(
  deviceId: string, 
  status: 'active' | 'inactive' | 'suspended'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('device_info')
      .update({ status })
      .eq('id', deviceId);
    
    if (error) {
      console.error('Update device status error:', error);
      return {
        success: false,
        error: 'Greška pri ažuriranju statusa uređaja'
      };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Update device status error:', error);
    return {
      success: false,
      error: 'Neočekivana greška pri ažuriranju statusa'
    };
  }
}

/**
 * Delete device
 */
export async function deleteDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First get the auth_user_id
    const { data: deviceInfo } = await supabase
      .from('device_info')
      .select('auth_user_id')
      .eq('id', deviceId)
      .single();
    
    // Delete from device_info table
    const { error: deviceInfoError } = await supabase
      .from('device_info')
      .delete()
      .eq('id', deviceId);
    
    if (deviceInfoError) {
      console.error('Delete device info error:', deviceInfoError);
      return {
        success: false,
        error: 'Greška pri brisanju uređaja'
      };
    }
    
    // TODO: Also delete from auth.users if needed
    // This would require admin privileges
    
    return { success: true };
    
  } catch (error) {
    console.error('Delete device error:', error);
    return {
      success: false,
      error: 'Neočekivana greška pri brisanju uređaja'
    };
  }
}

