const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("playground_token") : null;
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check that the API is running.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/login") && !path.startsWith("/auth/register")) {
      localStorage.removeItem("playground_token");
      localStorage.removeItem("playground_user");
      window.location.href = "/login";
    }
    const m = data?.message;
    throw new ApiError(res.status, Array.isArray(m) ? m.join(", ") : m || "Something went wrong");
  }
  return data as T;
}
