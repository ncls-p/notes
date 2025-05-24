// Placeholder for access token storage and retrieval
// In a real app, this would come from a state management solution (Zustand, Context, etc.)
let inMemoryAccessToken: string | null = null;
let refreshTokenPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (token === null) {
    // If access token is cleared, clear any ongoing refresh promise
    refreshTokenPromise = null;
  }
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

// This function would be called when the user logs out or refresh fails definitively
export function clearAuthTokens() {
  setAccessToken(null);
  // Here you would also clear the refresh token cookie if possible from client,
  // or rely on server to invalidate it / clear it on next response.
  // For HttpOnly, client-side deletion is not direct.
  // The server should clear it upon logout or failed refresh.
}
// --- End of placeholder ---

interface ApiClientOptions extends RequestInit {
  // We can add custom options here if needed in the future
  isRetry?: boolean; // Internal flag to prevent infinite refresh loops
}

async function refreshToken(): Promise<string | null> {
  try {
    // Using fetch directly to avoid circular dependency with apiClient
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Important if your server expects it
      },
      // body: JSON.stringify({}), // No body needed if refresh token is from cookie
    });

    if (!response.ok) {
      // If refresh fails, clear tokens and throw to prevent retries with old token
      clearAuthTokens();
      // Potentially trigger a global logout event or redirect here
      // For now, just throw an error that will be caught by the original request's handler
      throw new Error(`Refresh token failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      return data.accessToken;
    } else {
      clearAuthTokens();
      throw new Error('Refresh token response did not contain accessToken');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    clearAuthTokens(); // Ensure tokens are cleared on any refresh error
    // Potentially trigger a global logout event or redirect here
    throw error; // Re-throw to be handled by the caller
  }
}


async function apiClient<T = unknown>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const makeRequest = async (tokenForRequest: string | null): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (tokenForRequest) {
      headers.append('Authorization', `Bearer ${tokenForRequest}`);
    }

    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      if (!headers.has('Content-Type')) {
        headers.append('Content-Type', 'application/json');
      }
      body = JSON.stringify(body);
    }

    return fetch(endpoint, {
      ...options,
      headers,
      body: body as BodyInit | null | undefined, // Ensure body type matches fetch expectation
    });
  };

  const currentToken = getAccessToken();
  let response = await makeRequest(currentToken);

  if (response.status === 401 && !options.isRetry) {
    // Unauthorized, potentially expired token
    if (!refreshTokenPromise) { // If not already refreshing
      refreshTokenPromise = refreshToken().finally(() => {
        refreshTokenPromise = null; // Reset promise once completed
      });
    }

    try {
      const newAccessToken = await refreshTokenPromise;
      if (newAccessToken) {
        // Retry the original request with the new token
        response = await makeRequest(newAccessToken);
      } else {
        // Refresh failed to get a new token, original 401 stands or refresh threw
        // If refresh threw, it would have been caught below.
        // If it resolved to null without throwing, it's an issue in refreshToken logic.
        // The original response (401) will be processed.
      }
    } catch (refreshError) {
      // Refresh token itself failed (e.g., expired, invalid, network error during refresh)
      // The original 401 response will be processed.
      // clearAuthTokens() should have been called within refreshToken() on failure.
      console.error('Failed to refresh token, original request failed:', refreshError);
      // No need to throw here, let the original response handling take over.
    }
  }


  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (_e) {
      errorData = { message: response.statusText };
    }
    const error = new Error(errorData.message || `API request to ${endpoint} failed with status ${response.status}`) as Error & { response?: Response; status?: number; data?: unknown };
    error.response = response;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  const contentType = response.headers.get('content-type');
  if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export default apiClient;