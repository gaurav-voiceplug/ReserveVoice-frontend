export interface FetchWithTokenOptions extends RequestInit {
  headers?: Record<string, string>;
}

export interface FetchWithTokenResponse<T = any> {
  ok: boolean;
  data: T;
}

const fetchWithToken = async <T = any>(
  url: string,
  options: FetchWithTokenOptions = {}
): Promise<FetchWithTokenResponse<T>> => {
  let token = localStorage.getItem("authToken");
  let refreshToken = localStorage.getItem("refreshToken");
  let headers: Record<string, string> = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (refreshToken) headers["x-refresh-token"] = refreshToken;

  let response = await fetch(url, { ...options, headers });
  if (response.status === 401 && refreshToken) {
    // Try to refresh token
    const refreshRes = await fetch("/api/users/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      if (refreshData.token) {
        localStorage.setItem("authToken", refreshData.token);
        token = refreshData.token;
        headers.Authorization = `Bearer ${token}`;
        // Retry original request
        response = await fetch(url, { ...options, headers });
      }
    } else {
      // Refresh failed, logout
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      return { ok: false, data: null as any };
    }
  }
  let data: T = await response.json().catch(() => ({} as T));
  if ((data as any).token) localStorage.setItem("authToken", (data as any).token);
  return { ok: response.ok, data };
};

export default fetchWithToken;