const TOKEN_KEY = "oe_token";

export type AuthUser = { id: string; email: string; role: string };

function decodePayload(token: string): (AuthUser & { sub: string; exp?: number }) | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;
  const payload = decodePayload(token);
  if (!payload) return null;
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    clearToken();
    return null;
  }
  return { id: payload.sub, email: payload.email, role: payload.role };
}

export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}
