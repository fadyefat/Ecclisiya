/**
 * API configuration and runtime settings.
 * In production, requests will route to VITE_API_BASE_URL (ASP.NET Core Web API).
 * In Demo Mode, client-side Mock Services provide full realistic interactivity.
 */
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  isDemoMode: true,
  simulatedDelayMs: 250, // simulated network latency for realistic loading skeletons
};

export async function simulateNetworkDelay(ms = API_CONFIG.simulatedDelayMs): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
