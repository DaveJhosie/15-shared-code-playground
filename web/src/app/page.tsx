"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { auth, logout } = useAuth();
  const [projects, setProjects] = useState<any[] | null>(null);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => api("/projects").then(setProjects).catch((e) => setErr(e.message));
  useEffect(() => { if (auth) load(); }, [auth]);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setErr("Enter a project name.");
    setBusy(true); setErr("");
    try { await api("/projects", { method: "POST", body: JSON.stringify({ name: name.trim() }) }); setName(""); await load(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  if (!auth) return null;
  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">My projects</h1>
        <div className="text-sm">{auth.user.name} <button onClick={logout} className="ml-3 text-[#3794ff] underline">Log out</button></div>
      </header>
      <form onSubmit={create} className="mb-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New project name"
          className="flex-1 rounded border border-[#3c3c3c] bg-[#252526] px-3 py-2 text-white outline-none focus:border-[#007acc]" />
        <button disabled={busy} className="rounded bg-[#007acc] px-4 text-white disabled:opacity-50">New project</button>
      </form>
      {err && <p role="alert" className="mb-3 text-sm text-red-400">{err}</p>}
      {!projects && !err && <p>Loading projects...</p>}
      {projects && projects.length === 0 && <p>No projects yet. Create one above to get started.</p>}
      <ul className="space-y-2">
        {projects?.map((p) => (
          <li key={p.id}>
            <Link href={`/projects/${p.id}`} className="block rounded border border-[#3c3c3c] bg-[#252526] p-4 hover:border-[#007acc]">
              <span className="font-medium text-white">{p.name}</span>
              <span className="ml-3 text-sm">{p.role} · {p.memberCount} member{p.memberCount === 1 ? "" : "s"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
