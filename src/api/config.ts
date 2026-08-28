const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname.startsWith('10.') || 
   window.location.hostname.startsWith('192.168.'));

export const API_BASE_URL = isLocal
  ? `http://${window.location.hostname}:8000/api/v1`
  : (import.meta.env.VITE_API_BASE_URL || 'https://drone-backend-c1j9.onrender.com/api/v1');

export const SOCKET_URL = isLocal
  ? `http://${window.location.hostname}:8000`
  : (import.meta.env.VITE_SOCKET_URL || 'https://drone-backend-c1j9.onrender.com');

export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDQ9RcBM265XRW3KXJDqecHs2STMk0jvk8';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson?.error) errMsg = errorJson.error;
        else if (errorJson?.message) errMsg = errorJson.message;
      } catch {
        // use statusText fallback
      }
      throw new Error(errMsg);
    }

    const json = await res.json();
    return json.data as T;
  } catch (error) {
    console.warn(`[API Client] Failed fetching ${url}:`, error);
    throw error;
  }
}
