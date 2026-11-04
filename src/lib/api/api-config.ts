import { isSupabaseEnabled, MOBILE_API_URL } from '../supabase';

export const API_CONFIG = {
  baseUrl: MOBILE_API_URL,
  isDemoMode: !isSupabaseEnabled(),
  simulatedDelayMs: 120,
};

export async function simulateNetworkDelay(ms = API_CONFIG.simulatedDelayMs): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
