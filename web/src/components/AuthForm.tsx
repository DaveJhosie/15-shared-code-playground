"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const reg = mode === "register";
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (typeof window !== "undefined" && localStorage.getItem("playground_token")) router.replace("/");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (reg && !f.name.trim()) return setErr("Enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Enter a valid email address.");
    if (f.password.length < 8) return setErr("Password must be at least 8 characters.");
    if (reg && f.password !== f.confirm) return setErr("Passwords do not match.");
    setBusy(true);
    try {
      const body = reg ? { name: f.name.trim(), email: f.email, password: f.password } : { email: f.email, password: f.password };
      const d = await api(reg ? "/auth/register" : "/auth/login", { method: "POST", body: JSON.stringify(body) });
      localStorage.setItem("playground_token", d.accessToken);
      localStorage.setItem("playground_user", JSON.stringify(d.user));
      router.push("/");
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  const fields: [keyof typeof f, string, string][] = [
    ...(reg ? [["name", "Name", "text"] as [keyof typeof f, string, string]] : []),
    ["email", "Email", "email"], ["password", "Password", "password"],
    ...(reg ? [["confirm", "Confirm password", "password"] as [keyof typeof f, string, string]] : []),
  ];
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded border border-[#3c3c3c] bg-[#252526] p-6">
        <h1 className="text-xl font-semibold text-white">{reg ? "Create your account" : "Log in"}</h1>
        {fields.map(([k, label, type]) => (
          <label key={k} className="block text-sm">{label}
            <input type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}
              className="mt-1 w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-white outline-none focus:border-[#007acc]" />
          </label>
        ))}
        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        <button disabled={busy} className="w-full rounded bg-[#007acc] py-2 font-medium text-white hover:bg-[#0a8ae0] disabled:opacity-50">
          {busy ? "Please wait..." : reg ? "Register" : "Log in"}
        </button>
        <p className="text-sm">{reg ? "Already registered? " : "No account yet? "}
          <Link className="text-[#3794ff] underline" href={reg ? "/login" : "/register"}>{reg ? "Log in" : "Register"}</Link>
        </p>
      </form>
    </main>
  );
}
