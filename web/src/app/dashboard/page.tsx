"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const { auth, logout } = useAuth();
  const [projects, setProjects] = useState<any[] | null>(null);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => api("/projects").then(setProjects).catch((e) => setErr(e.message));
  useEffect(() => { if (auth) load(); }, [auth]);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setErr("Enter a project name.");
    setBusy(true); setErr("");
    try { await api("/projects", { method: "POST", body: JSON.stringify({ name: name.trim(), description: desc.trim() || undefined }) }); setName(""); setDesc(""); await load(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  if (!auth) return null;
  const owned = projects?.filter((p) => p.role === "owner").length ?? 0;
  const stat = (label: string, v: number | string) => (
    <div className="rounded-xl border border-[#3c3c3c] bg-[#252526] p-5"><div className="text-3xl font-bold text-white">{v}</div><div className="text-sm">{label}</div></div>);
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#12141a] to-[#1e1e1e]">
      <nav className="flex items-center justify-between border-b border-[#3c3c3c] px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-white"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#007acc] text-xs">SCP</span>Dashboard</Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#37373d] font-semibold text-white">{auth.user.name?.[0]?.toUpperCase()}</span>
          <span className="text-white">{auth.user.name}</span>
          <button onClick={logout} className="rounded-lg border border-[#3c3c3c] px-3 py-1 hover:bg-[#252526]">Log out</button>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold text-white">Welcome back, {auth.user.name.split(" ")[0]}</h1>
        <p className="mb-6 text-sm">Pick a project to keep coding, or start a new one.</p>
        <div className="mb-8 grid gap-4 sm:grid-cols-3">{stat("Projects", projects?.length ?? "-")}{stat("Owned by you", projects ? owned : "-")}{stat("Shared with you", projects ? projects.length - owned : "-")}</div>
        <form onSubmit={create} className="mb-8 grid gap-3 rounded-xl border border-[#3c3c3c] bg-[#252526] p-5 md:grid-cols-[1fr_1fr_auto]">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" className="rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-white outline-none focus:border-[#007acc]" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description (optional)" className="rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-white outline-none focus:border-[#007acc]" />
          <button disabled={busy} className="rounded-lg bg-[#007acc] px-5 py-2 font-medium text-white hover:bg-[#0a8ae0] disabled:opacity-50">{busy ? "Creating..." : "New project"}</button>
        </form>
        {err && <p role="alert" className="mb-4 text-sm text-red-400">{err}</p>}
        {!projects && !err && <div className="grid gap-4 sm:grid-cols-2">{[1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-[#252526]" />)}</div>}
        {projects?.length === 0 && <p className="rounded-xl border border-dashed border-[#3c3c3c] p-10 text-center">No projects yet. Create your first one above.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {projects?.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="group rounded-xl border border-[#3c3c3c] bg-[#252526] p-5 transition hover:border-[#007acc]">
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#007acc]/20 font-bold text-[#3794ff]">{p.name[0]?.toUpperCase()}</span>
                <span className="rounded-full bg-[#37373d] px-2 py-0.5 text-xs text-white">{p.role}</span>
              </div>
              <h3 className="mt-3 font-semibold text-white group-hover:text-[#3794ff]">{p.name}</h3>
              <p className="line-clamp-2 min-h-[2.5rem] text-sm">{p.description || "No description"}</p>
              <p className="mt-2 text-xs">{p.memberCount} member{p.memberCount === 1 ? "" : "s"}</p>
            </Link>))}
        </div>
      </main>
    </div>
  );
}
