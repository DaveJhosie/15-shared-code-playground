"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export function useAuth() {
  const router = useRouter();
  const [auth, setAuth] = useState<{ user: any; token: string } | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("playground_token");
    const u = localStorage.getItem("playground_user");
    if (!token || !u) { router.replace("/login"); return; }
    setAuth({ token, user: JSON.parse(u) });
  }, [router]);
  const logout = () => {
    localStorage.removeItem("playground_token");
    localStorage.removeItem("playground_user");
    router.replace("/login");
  };
  return { auth, logout };
}
