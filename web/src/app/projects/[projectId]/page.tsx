"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import CollabEditor from "@/components/CollabEditor";

export default function Workspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const { auth, logout } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [missing, setMissing] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"files" | "versions">("files");
  const [versions, setVersions] = useState<any[]>([]);
  const [out, setOut] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");
  const [conn, setConn] = useState("Connecting");
  const [peers, setPeers] = useState(1);
  const ed = useRef<{ getValue: () => string; restore: (t: string) => void } | null>(null);
  const act = useRef<any>({});

  const file = project?.files?.find((f: any) => f.id === fileId);
  const canEdit = !!project && project.role !== "viewer";

  const loadProject = useCallback(async () => {
    try {
      const p = await api(`/projects/${projectId}`);
      setProject(p);
      setFileId((cur) => cur && p.files.some((f: any) => f.id === cur) ? cur : p.files[0]?.id ?? null);
    } catch (e: any) { if (e.status === 403 || e.status === 404) setMissing(true); else setMsg(e.message); }
  }, [projectId]);
  useEffect(() => { if (auth) loadProject(); }, [auth, loadProject]);

  const loadVersions = useCallback(async () => {
    if (!fileId) return setVersions([]);
    try { setVersions(await api(`/files/${fileId}/versions`)); } catch (e: any) { setMsg(e.message); }
  }, [fileId]);
  useEffect(() => { ed.current = null; setOut(null); loadVersions(); }, [fileId, loadVersions]);

  async function newFile() {
    const name = window.prompt("File name (for example app.js)")?.trim();
    if (!name) return;
    const language = (window.prompt("Language: javascript or python", name.endsWith(".py") ? "python" : "javascript") || "").trim().toLowerCase();
    if (language !== "javascript" && language !== "python") return setMsg("Language must be javascript or python.");
    try { const f = await api(`/projects/${projectId}/files`, { method: "POST", body: JSON.stringify({ name, language }) }); await loadProject(); setFileId(f.id); }
    catch (e: any) { setMsg(e.message); }
  }
  async function saveVersion() {
    if (!ed.current || !fileId || !canEdit) return;
    const label = window.prompt("Version label (optional)") ?? null;
    if (label === null) return;
    const content = ed.current.getValue();
    if (versions.length) {
      try { const last = await api(`/files/${fileId}/versions/${versions[0].id}`); if (last.content === content && !window.confirm("This matches the last saved version. Save anyway?")) return; } catch {}
    }
    try { await api(`/files/${fileId}/versions`, { method: "POST", body: JSON.stringify({ label: label || undefined, content }) }); setMsg("Version saved."); await loadVersions(); }
    catch (e: any) { setMsg(e.message); }
  }
  async function restore(id: string) {
    if (!ed.current || !fileId) return;
    try { const v = await api(`/files/${fileId}/versions/${id}`); ed.current.restore(v.content); setMsg(`Restored version ${v.versionNumber}. Save a new version to keep it.`); }
    catch (e: any) { setMsg(e.message); }
  }
  async function run() {
    if (!ed.current || !fileId || !canEdit || running) return;
    setRunning(true); setOut(null);
    try { setOut(await api(`/files/${fileId}/run`, { method: "POST", body: JSON.stringify({ code: ed.current.getValue() }) })); }
    catch (e: any) { setOut({ status: "unavailable", stdout: "", stderr: e.message }); }
    finally { setRunning(false); }
  }
  act.current = { run, saveVersion };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); act.current.run(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); act.current.saveVersion(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (missing) notFound();
  if (!auth || !project) return <p className="p-6">Loading workspace...</p>;

  const tab = (id: "files" | "versions", label: string) => (
    <button onClick={() => setPanel(id)} className={`px-3 py-2 text-sm ${panel === id ? "border-b-2 border-[#007acc] text-white" : ""}`}>{label}</button>
  );
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-[#3c3c3c] bg-[#2d2d2d] px-4 py-2 text-sm">
        <div><Link href="/" className="text-[#3794ff] underline">Projects</Link><span className="mx-2">/</span><span className="text-white">{project.name}</span></div>
        <div>{auth.user.name} <button onClick={logout} className="ml-3 text-[#3794ff] underline">Log out</button></div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 flex-col border-r border-[#3c3c3c] bg-[#252526]">
          <div className="flex border-b border-[#3c3c3c]">{tab("files", "Explorer")}{tab("versions", "Versions")}</div>
          {panel === "files" ? (
            <div className="flex-1 overflow-auto p-2 text-sm">
              {canEdit && <button onClick={newFile} className="mb-2 w-full rounded bg-[#333] py-1 hover:bg-[#3c3c3c]">New file</button>}
              {project.files.length === 0 && <p className="p-2">No files yet. Create one to start coding.</p>}
              {project.files.map((f: any) => (
                <button key={f.id} onClick={() => setFileId(f.id)} className={`block w-full truncate rounded px-2 py-1 text-left ${f.id === fileId ? "bg-[#37373d] text-white" : "hover:bg-[#2a2d2e]"}`}>{f.name}</button>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-2 text-sm">
              {!fileId && <p className="p-2">Open a file to see its versions.</p>}
              {fileId && versions.length === 0 && <p className="p-2">No saved versions yet. Press Ctrl+S to save one.</p>}
              {versions.map((v) => (
                <div key={v.id} className="mb-2 rounded border border-[#3c3c3c] p-2">
                  <div className="text-white">v{v.versionNumber}{v.label ? ` · ${v.label}` : ""}</div>
                  <div className="text-xs">{v.createdBy?.name} · {new Date(v.createdAt).toLocaleString()}</div>
                  {canEdit && <button onClick={() => restore(v.id)} className="mt-1 text-[#3794ff] underline">Restore</button>}
                </div>
              ))}
            </div>
          )}
        </aside>
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between bg-[#2d2d2d] px-3 py-1 text-sm">
            <span className="text-white">{file ? file.name : "No file open"}</span>
            <span className="flex gap-2">
              <button onClick={saveVersion} disabled={!canEdit || !file} className="rounded bg-[#333] px-3 py-1 disabled:opacity-40">Save version</button>
              <button onClick={run} disabled={!canEdit || !file || running} className="rounded bg-[#007acc] px-3 py-1 text-white disabled:opacity-40">{running ? "Running..." : "Run"}</button>
            </span>
          </div>
          {!canEdit && <div className="bg-[#3a3d41] px-3 py-1 text-sm">You have view-only access.</div>}
          {msg && <div className="flex justify-between bg-[#264f78] px-3 py-1 text-sm text-white">{msg}<button onClick={() => setMsg("")}>Dismiss</button></div>}
          <div className="min-h-0 flex-1">
            {file ? (
              <CollabEditor key={file.id} fileId={file.id} token={auth.token} user={auth.user} language={file.language} readOnly={!canEdit}
                onReady={(h) => (ed.current = h)} onStatus={setConn} onPeers={setPeers} />
            ) : <p className="p-6">Select or create a file to start editing.</p>}
          </div>
          <div className="h-44 overflow-auto border-t border-[#3c3c3c] bg-[#1e1e1e] p-3 font-mono text-sm">
            <div className="mb-1 text-xs text-white">Output</div>
            {running && <p>Running...</p>}
            {!running && !out && <p>Press Run or Ctrl+Enter to see output.</p>}
            {out?.status === "timeout" && <p className="text-yellow-400">Took longer than 10 seconds.</p>}
            {out?.status === "unavailable" && <p className="text-red-400">The run service is down, try again. {out.stderr}</p>}
            {out && out.status !== "unavailable" && <>
              {out.stdout && <pre className="whitespace-pre-wrap">{out.stdout}</pre>}
              {out.stderr && <pre className="whitespace-pre-wrap text-red-400">{out.stderr}</pre>}
              {out.truncated && <p className="text-yellow-400">Output truncated.</p>}
              {out.durationMs != null && <p className="text-xs">Exit {out.exitCode} · {out.durationMs} ms</p>}
            </>}
          </div>
        </section>
      </div>
      <footer className="flex justify-between bg-[#007acc] px-3 py-1 text-xs text-white">
        <span>{file?.language ?? "-"}</span><span>{conn} · {peers} in file · {project.role}</span>
      </footer>
    </div>
  );
}
