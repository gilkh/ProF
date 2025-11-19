/**
 * Fetch wrapper that adds Capacitor identification headers
 * This helps the server identify mobile app requests for proper cookie handling
 */

let isCapacitorDetected: boolean | null = null;

function isCapacitor(): boolean {
  if (isCapacitorDetected !== null) return isCapacitorDetected;
  
  if (typeof window === 'undefined') {
    isCapacitorDetected = false;
    return false;
  }
  
  isCapacitorDetected = !!(window as any).Capacitor?.isNativePlatform?.();
  return isCapacitorDetected;
}

/**
 * Enhanced fetch that adds Capacitor platform header
 */
export async function fetchWithCapacitorHeaders(
  url: string | URL | Request,
  options?: RequestInit
): Promise<Response> {
  if (!isCapacitor()) {
    return fetch(url, options);
  }
  
  // Add Capacitor identification header
  const headers = new Headers(options?.headers);
  const platform = (window as any).Capacitor?.getPlatform?.() || 'unknown';
  headers.set('X-Capacitor-Platform', platform);
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important: ensure cookies are sent and received
  });
}
