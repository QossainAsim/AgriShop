// supabaseClient.js
// Create this file in your src folder

import { createClient } from '@supabase/supabase-js';

// ============================================
// SUPABASE CONFIGURATION
// ============================================
// Get these values from your Supabase project settings:
// 1. Go to https://app.supabase.com
// 2. Select your project
// 3. Go to Settings > API
// 4. Copy "Project URL" and "anon/public key"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment values. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// ============================================
// HELPER FUNCTIONS FOR YOUR APP
// ============================================

// Test connection
export const testConnection = async () => {
  try {
    const { error } = await supabase.from('categories').select('*').limit(1);
    if (error) throw error;
    console.log(' Supabase connection successful!');
    return true;
  } catch (error) {
    console.error(' Supabase connection failed:', error);
    return false;
  }
};

// Get today's stats
export const getTodayStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_today_stats');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching today stats:', error);
    return null;
  }
};
