const API_URL = import.meta.env.VITE_API_URL;
export const AUTH_UNAUTHORIZED_EVENT = "app:unauthorized";

export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
) {
  try {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    const error = new Error(body?.message ?? `Request failed: ${response.status}`) as Error & {
      status?: number
    };
    error.status = response.status;
      if (response.status === 401 && window.location.pathname !== "/login") {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      }
    throw error;
  }

  return response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}