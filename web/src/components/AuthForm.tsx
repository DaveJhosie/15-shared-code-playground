"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const reg = mode === "register";
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (localStorage.getItem("playground_token")) router.replace("/dashboard"); }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (reg && !f.name.trim()) return setErr("Enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Enter a valid email address.");
    if (f.password.length < 8) return setErr("Password must be at least 8 characters.");
    if (reg && f.password !== f.confirm) return setErr("Passwords do not match.");
    setBusy(true);
    try {
      const body = reg ? { name: f.name.trim(), email: f.email.trim(), password: f.password } : { email: f.email.trim(), password: f.password };
      const d = await api(reg ? "/auth/register" : "/auth/login", { method: "POST", body: JSON.stringify(body) });
      localStorage.setItem("playground_token", d.accessToken);
      localStorage.setItem("playground_user", JSON.stringify(d.user));
      router.push("/dashboard");
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  const fields: [keyof typeof f, string, string][] = [
    ...(reg ? [["name", "Full name", "text"] as [keyof typeof f, string, string]] : []),
    ["email", "Email", "email"], ["password", "Password", "password"],
    ...(reg ? [["confirm", "Confirm password", "password"] as [keyof typeof f, string, string]] : []),
  ];
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="hidden flex-col justify-between bg-gradient-to-br from-[#007acc] via-[#0b3a63] to-[#06111f] p-10 text-white md:flex">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/20 text-sm">SCP</span>Shared Code Playground</Link>
        <div><h2 className="text-3xl font-bold leading-snug">Code together. Save versions. Run it instantly.</h2><p className="mt-3 max-w-sm text-white/80">One workspace for your whole team, right in the browser.</p></div>
        <p className="text-sm text-white/60">Team 10 project</p>
      </section>
      <section className="flex items-center justify-center bg-[#1e1e1e] p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-white">{reg ? "Create your account" : "Welcome back"}</h1>
          <p className="text-sm">{reg ? "It takes less than a minute." : "Log in to continue to your projects."}</p>
          {fields.map(([k, label, type]) => (
            <label key={k} className="block text-sm">{label}
              <input type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} autoComplete={type === "password" ? (reg ? "new-password" : "current-password") : type === "email" ? "email" : "name"}
                className="mt-1 w-full rounded-lg border border-[#3c3c3c] bg-[#252526] px-3 py-2.5 text-white outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc]" />
            </label>))}
          {err && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{err}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-[#007acc] py-2.5 font-medium text-white hover:bg-[#0a8ae0] disabled:opacity-50">{busy ? "Please wait..." : reg ? "Create account" : "Log in"}</button>
          <p className="text-center text-sm">{reg ? "Already have an account? " : "New to SCP? "}<Link className="text-[#3794ff] underline" href={reg ? "/login" : "/register"}>{reg ? "Log in" : "Create an account"}</Link></p>
        </form>
      </section>
    </main>
  );
}
