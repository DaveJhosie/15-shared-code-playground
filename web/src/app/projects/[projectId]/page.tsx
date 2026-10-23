 "use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import CollabEditor from "@/components/CollabEditor";

type ModalState =
  | { type: "new-file" }
  | { type: "save-version" }
  | {
      type: "confirm";
      title: string;
      description: string;
      confirmLabel: string;
      danger?: boolean;
      onConfirm: () => Promise<void>;
    }
  | null;

function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="scp-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="scp-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scp-modal-title"
        tabIndex={-1}
      >
        <div className="scp-modal-heading">
          <div>
            <h2 id="scp-modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button
            type="button"
            className="scp-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Workspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const { auth, logout } = useAuth();
  const router = useRouter();

  const [pEmail, setPEmail] = useState("");
  const [pRole, setPRole] = useState("editor");
  const [project, setProject] = useState<any>(null);
  const [missing, setMissing] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"files" | "versions" | "people">("files");
  const [versions, setVersions] = useState<any[]>([]);
  const [out, setOut] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");
  const [conn, setConn] = useState("Connecting");
  const [peers, setPeers] = useState(1);

  const [modal, setModal] = useState<ModalState>(null);
  const [modalName, setModalName] = useState("");
  const [modalLanguage, setModalLanguage] = useState("javascript");
  const [versionLabel, setVersionLabel] = useState("");
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState("");

  const ed = useRef<{
    getValue: () => string;
    restore: (text: string) => void;
  } | null>(null);
  const act = useRef<any>({});

  const file = project?.files?.find((f: any) => f.id === fileId);
  const canEdit = !!project && project.role !== "viewer";
  const isOwner = project?.role === "owner";

  const closeModal = useCallback(() => {
    if (modalBusy) return;
    setModal(null);
    setModalError("");
  }, [modalBusy]);

  const loadProject = useCallback(async () => {
    try {
      const p = await api(`/projects/${projectId}`);
      setProject(p);
      setFileId((current) =>
        current && p.files.some((f: any) => f.id === current)
          ? current
          : p.files[0]?.id ?? null
      );
    } catch (error: any) {
      if (error.status === 403 || error.status === 404) setMissing(true);
      else setMsg(error.message || "Could not load this project.");
    }
  }, [projectId]);

  useEffect(() => {
    if (auth) void loadProject();
  }, [auth, loadProject]);

  const loadVersions = useCallback(async () => {
    if (!fileId) {
      setVersions([]);
      return;
    }
    try {
      setVersions(await api(`/files/${fileId}/versions`));
    } catch (error: any) {
      setMsg(error.message || "Could not load versions.");
    }
  }, [fileId]);

  useEffect(() => {
    ed.current = null;
    setOut(null);
    void loadVersions();
  }, [fileId, loadVersions]);

  function openNewFile() {
    setModalName("");
    setModalLanguage("javascript");
    setModalError("");
    setModal({ type: "new-file" });
  }

  async function createFile(event: React.FormEvent) {
    event.preventDefault();
    const name = modalName.trim();

    if (!name) {
      setModalError("Enter a filename to continue.");
      return;
    }
    if (name.includes("/") || name.includes("\\")) {
      setModalError("Use a filename only, without folder paths.");
      return;
    }
    if (modalLanguage !== "javascript" && modalLanguage !== "python") {
      setModalError("Choose JavaScript or Python.");
      return;
    }

    setModalBusy(true);
    setModalError("");
    try {
      const created = await api(`/projects/${projectId}/files`, {
        method: "POST",
        body: JSON.stringify({ name, language: modalLanguage }),
      });
      await loadProject();
      setFileId(created.id);
      setPanel("files");
      setModal(null);
      setMsg(`Created ${name}.`);
    } catch (error: any) {
      setModalError(error.message || "Could not create the file.");
    } finally {
      setModalBusy(false);
    }
  }

  function openSaveVersion() {
    if (!ed.current || !fileId || !canEdit) return;
    setVersionLabel("");
    setModalError("");
    setModal({ type: "save-version" });
  }

  async function saveVersionWithLabel(event: React.FormEvent) {
    event.preventDefault();
    if (!ed.current || !fileId || !canEdit) return;

    const content = ed.current.getValue();
    setModalBusy(true);
    setModalError("");

    try {
      if (versions.length) {
        try {
          const last = await api(`/files/${fileId}/versions/${versions[0].id}`);
          if (last.content === content) {
            setModalBusy(false);
            setModal({
              type: "confirm",
              title: "Save an identical version?",
              description:
                "The code matches the latest saved version. Do you still want to create another version?",
              confirmLabel: "Save anyway",
              onConfirm: async () => {
                await performSaveVersion(content, versionLabel.trim());
              },
            });
            return;
          }
        } catch {
          // Continue with saving if the previous version cannot be checked.
        }
      }

      await api(`/files/${fileId}/versions`, {
        method: "POST",
        body: JSON.stringify({
          label: versionLabel.trim() || undefined,
          content,
        }),
      });
      setModal(null);
      setMsg("Version saved successfully.");
      await loadVersions();
    } catch (error: any) {
      setModalError(error.message || "Could not save this version.");
    } finally {
      setModalBusy(false);
    }
  }

  async function performSaveVersion(content: string, label: string) {
    setModalBusy(true);
    try {
      await api(`/files/${fileId}/versions`, {
        method: "POST",
        body: JSON.stringify({ label: label || undefined, content }),
      });
      setModal(null);
      setMsg("Version saved successfully.");
      await loadVersions();
    } catch (error: any) {
      setModalError(error.message || "Could not save this version.");
    } finally {
      setModalBusy(false);
    }
  }

  async function restore(id: string) {
    if (!ed.current || !fileId) return;
    try {
      const version = await api(`/files/${fileId}/versions/${id}`);
      ed.current.restore(version.content);
      setMsg(
        `Restored version ${version.versionNumber}. Save a new version to keep it.`
      );
    } catch (error: any) {
      setMsg(error.message || "Could not restore this version.");
    }
  }

  async function run() {
    if (!ed.current || !fileId || !canEdit || running) return;
    setRunning(true);
    setOut(null);
    try {
      setOut(
        await api(`/files/${fileId}/run`, {
          method: "POST",
          body: JSON.stringify({ code: ed.current.getValue() }),
        })
      );
    } catch (error: any) {
      setOut({
        status: "unavailable",
        stdout: "",
        stderr: error.message || "Execution failed.",
      });
    } finally {
      setRunning(false);
    }
  }

  async function addPerson(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(pEmail.trim())) {
      setMsg("Enter a valid email address.");
      return;
    }

    try {
      await api(`/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({
          email: pEmail.trim().toLowerCase(),
          role: pRole,
        }),
      });
      setPEmail("");
      setMsg("Person added successfully.");
      await loadProject();
    } catch (error: any) {
      setMsg(
        error.status === 404
          ? "No account uses that email. Ask them to register first."
          : error.message || "Could not add this person."
      );
    }
  }

  async function changeRole(userId: string, role: string) {
    try {
      await api(`/projects/${projectId}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await loadProject();
      setMsg("Member role updated.");
    } catch (error: any) {
      setMsg(error.message || "Could not update the role.");
    }
  }

  function confirmRemovePerson(userId: string) {
    const leaving = userId === auth?.user.id;
    setModalError("");
    setModal({
      type: "confirm",
      title: leaving ? "Leave this project?" : "Remove this person?",
      description: leaving
        ? "You will lose access to this project unless the owner invites you again."
        : "This person will lose access to the project. This action cannot be undone.",
      confirmLabel: leaving ? "Leave project" : "Remove person",
      danger: true,
      onConfirm: async () => {
        setModalBusy(true);
        try {
          await api(`/projects/${projectId}/members/${userId}`, {
            method: "DELETE",
          });
          setModal(null);
          if (leaving) {
            router.push("/dashboard");
            return;
          }
          setMsg("Person removed from the project.");
          await loadProject();
        } catch (error: any) {
          setModalError(error.message || "Could not complete this action.");
        } finally {
          setModalBusy(false);
        }
      },
    });
  }

  act.current = { run, saveVersion: openSaveVersion };

  useEffect(() => {
    const handleShortcuts = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        act.current.run();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        act.current.saveVersion();
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, []);

  if (missing) notFound();
  if (!auth || !project) {
    return (
      <div className="scp-workspace-loading">
        <div className="scp-loading-spinner" />
        <p>Loading workspace...</p>
      </div>
    );
  }

  const tab = (id: "files" | "versions" | "people", label: string) => (
    <button
      key={id}
      onClick={() => setPanel(id)}
      className={`scp-workspace-tab ${panel === id ? "active" : ""}`}
    >
      {label}
    </button>
  );

  return (
    <div className="scp-workspace">
      <header className="scp-workspace-header">
        <div className="scp-workspace-crumbs">
          <Link href="/dashboard">Projects</Link>
          <span>/</span>
          <strong>{project.name}</strong>
        </div>
        <div className="scp-workspace-header-actions">
          <button
            onClick={() => setPanel("people")}
            className="scp-button scp-button-primary scp-button-small"
          >
            Share project
          </button>
          <span className="scp-header-username">{auth.user.name}</span>
          <button onClick={logout} className="scp-button scp-button-quiet">
            Log out
          </button>
        </div>
      </header>

      <div className="scp-workspace-body">
        <aside className="scp-workspace-sidebar">
          <div className="scp-workspace-tabs">
            {tab("files", "Explorer")}
            {tab("versions", "Versions")}
            {tab("people", "People")}
          </div>

          {panel === "files" ? (
            <div className="scp-sidebar-content">
              {canEdit && (
                <button
                  onClick={openNewFile}
                  className="scp-button scp-button-secondary scp-sidebar-new-file"
                >
                  <span>＋</span> New file
                </button>
              )}
              {project.files.length === 0 && (
                <div className="scp-sidebar-empty">
                  <span>▤</span>
                  <p>No files yet.</p>
                  <small>Create a file to start coding.</small>
                </div>
              )}
              {project.files.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => setFileId(item.id)}
                  className={`scp-file-item ${item.id === fileId ? "active" : ""}`}
                >
                  <span className="scp-file-type">
                    {item.language === "python" ? "Py" : "JS"}
                  </span>
                  <span className="scp-file-name">{item.name}</span>
                </button>
              ))}
            </div>
          ) : panel === "people" ? (
            <div className="scp-sidebar-content scp-people-content">
              {isOwner ? (
                <form onSubmit={addPerson} className="scp-add-person-form">
                  <label htmlFor="member-email">Invite a teammate</label>
                  <input
                    id="member-email"
                    value={pEmail}
                    onChange={(event) => setPEmail(event.target.value)}
                    placeholder="teammate@example.com"
                    type="email"
                    required
                  />
                  <select
                    value={pRole}
                    onChange={(event) => setPRole(event.target.value)}
                    aria-label="New member role"
                  >
                    <option value="editor">Editor — can edit and run</option>
                    <option value="viewer">Viewer — read only</option>
                  </select>
                  <button className="scp-button scp-button-primary" type="submit">
                    Add teammate
                  </button>
                </form>
              ) : (
                <p className="scp-sidebar-note">
                  Only the owner can add or change people.
                </p>
              )}

              <div className="scp-member-list">
                {project.members.map((member: any) => (
                  <div key={member.userId} className="scp-member-card">
                    <div className="scp-member-avatar">
                      {(member.name?.[0] || member.email?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="scp-member-details">
                      <strong>
                        {member.name}
                        {member.userId === auth.user.id ? " (you)" : ""}
                      </strong>
                      <span>{member.email}</span>
                      <div className="scp-member-controls">
                        {isOwner && member.role !== "owner" ? (
                          <select
                            value={member.role}
                            onChange={(event) =>
                              changeRole(member.userId, event.target.value)
                            }
                            aria-label={`Role for ${member.name}`}
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className="scp-role-badge">{member.role}</span>
                        )}
                        {((isOwner && member.role !== "owner") ||
                          (member.userId === auth.user.id &&
                            member.role !== "owner")) && (
                          <button
                            className="scp-text-danger"
                            onClick={() => confirmRemovePerson(member.userId)}
                          >
                            {member.userId === auth.user.id ? "Leave" : "Remove"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="scp-sidebar-content">
              {!fileId && (
                <div className="scp-sidebar-empty">
                  <span>◷</span>
                  <p>No file selected</p>
                  <small>Open a file to view its saved versions.</small>
                </div>
              )}
              {fileId && versions.length === 0 && (
                <div className="scp-sidebar-empty">
                  <span>◷</span>
                  <p>No saved versions</p>
                  <small>Press Ctrl+S to save a version.</small>
                </div>
              )}
              {versions.map((version) => (
                <div key={version.id} className="scp-version-card">
                  <strong>
                    v{version.versionNumber}
                    {version.label ? ` · ${version.label}` : ""}
                  </strong>
                  <span>{version.createdBy?.name || "Unknown author"}</span>
                  <small>
                    {new Date(version.createdAt).toLocaleString()}
                  </small>
                  {canEdit && (
                    <button
                      onClick={() => restore(version.id)}
                      className="scp-version-restore"
                    >
                      Restore version
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>

        <main className="scp-workspace-main">
          <div className="scp-editor-toolbar">
            <div className="scp-editor-file-label">
              <span className="scp-live-dot" />
              <span>{file ? file.name : "No file open"}</span>
              {!canEdit && <span className="scp-view-only-badge">View only</span>}
            </div>
            <div className="scp-editor-actions">
              <button
                onClick={openSaveVersion}
                disabled={!canEdit || !file}
                className="scp-button scp-button-secondary"
              >
                Save version
                <kbd>Ctrl S</kbd>
              </button>
              <button
                onClick={run}
                disabled={!canEdit || !file || running}
                className="scp-button scp-button-primary"
              >
                {running ? <span className="scp-button-spinner" /> : "▶"}
                {running ? "Running..." : "Run code"}
                {!running && <kbd>Ctrl ↵</kbd>}
              </button>
            </div>
          </div>

          {msg && (
            <div className="scp-workspace-message" role="status">
              <span>{msg}</span>
              <button onClick={() => setMsg("")} aria-label="Dismiss message">
                ×
              </button>
            </div>
          )}

          <div className="scp-editor-container">
            {file ? (
              <CollabEditor
                key={file.id}
                fileId={file.id}
                token={auth.token}
                user={auth.user}
                language={file.language}
                readOnly={!canEdit}
                onReady={(handle) => (ed.current = handle)}
                onStatus={setConn}
                onPeers={setPeers}
              />
            ) : (
              <div className="scp-editor-empty">
                <div className="scp-editor-empty-icon">{"</>"}</div>
                <h2>Ready when you are</h2>
                <p>Select a file from Explorer or create a new one to start coding.</p>
                {canEdit && (
                  <button
                    onClick={openNewFile}
                    className="scp-button scp-button-primary"
                  >
                    ＋ Create your first file
                  </button>
                )}
              </div>
            )}
          </div>

          <section className="scp-output-panel">
            <div className="scp-output-heading">
              <div>
                <span className="scp-output-terminal-icon">›_</span>
                <strong>Terminal output</strong>
              </div>
              <span>{running ? "Executing…" : out ? "Finished" : "Ready"}</span>
            </div>
            <div className="scp-output-content">
              {running && (
                <p className="scp-output-muted">
                  <span className="scp-button-spinner" /> Running your code...
                </p>
              )}
              {!running && !out && (
                <p className="scp-output-muted">
                  Press Run code or Ctrl + Enter to see your output.
                </p>
              )}
              {out?.status === "timeout" && (
                <p className="scp-output-warning">
                  Execution took longer than 10 seconds.
                </p>
              )}
              {out?.status === "unavailable" && (
                <p className="scp-output-error">
                  The run service is unavailable. {out.stderr}
                </p>
              )}
              {out && out.status !== "unavailable" && (
                <>
                  {out.stdout && <pre>{out.stdout}</pre>}
                  {out.stderr && <pre className="scp-output-error">{out.stderr}</pre>}
                  {out.truncated && (
                    <p className="scp-output-warning">Output was truncated.</p>
                  )}
                  {out.durationMs != null && (
                    <p className="scp-output-meta">
                      Exit code {out.exitCode} · {out.durationMs} ms
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        </main>
      </div>

      <footer className="scp-workspace-statusbar">
        <span>{file?.language ?? "No language selected"}</span>
        <span>
          <i /> {conn} · {peers} in file · {project.role}
        </span>
      </footer>

      {modal?.type === "new-file" && (
        <Modal
          title="Create a new file"
          description="Choose a name and language for your workspace file."
          onClose={closeModal}
        >
          <form onSubmit={createFile} className="scp-modal-form">
            <label htmlFor="new-file-name">File name</label>
            <input
              id="new-file-name"
              autoFocus
              value={modalName}
              onChange={(event) => setModalName(event.target.value)}
              placeholder="e.g. app.js or main.py"
              maxLength={120}
            />
            <label htmlFor="new-file-language">Language</label>
            <select
              id="new-file-language"
              value={modalLanguage}
              onChange={(event) => setModalLanguage(event.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
            {modalError && (
              <p className="scp-modal-error" role="alert">{modalError}</p>
            )}
            <div className="scp-modal-actions">
              <button
                type="button"
                className="scp-button scp-button-secondary"
                onClick={closeModal}
                disabled={modalBusy}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="scp-button scp-button-primary"
                disabled={modalBusy}
              >
                {modalBusy ? "Creating..." : "Create file"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === "save-version" && (
        <Modal
          title="Save a version"
          description="Create a snapshot of the current code so you can restore it later."
          onClose={closeModal}
        >
          <form onSubmit={saveVersionWithLabel} className="scp-modal-form">
            <label htmlFor="version-label">Version label <span>(optional)</span></label>
            <input
              id="version-label"
              autoFocus
              value={versionLabel}
              onChange={(event) => setVersionLabel(event.target.value)}
              placeholder="e.g. First working version"
              maxLength={100}
            />
            {modalError && (
              <p className="scp-modal-error" role="alert">{modalError}</p>
            )}
            <div className="scp-modal-actions">
              <button
                type="button"
                className="scp-button scp-button-secondary"
                onClick={closeModal}
                disabled={modalBusy}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="scp-button scp-button-primary"
                disabled={modalBusy}
              >
                {modalBusy ? "Saving..." : "Save version"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === "confirm" && (
        <Modal
          title={modal.title}
          description={modal.description}
          onClose={closeModal}
        >
          {modalError && (
            <p className="scp-modal-error scp-modal-confirm-error" role="alert">
              {modalError}
            </p>
          )}
          <div className="scp-modal-actions">
            <button
              type="button"
              className="scp-button scp-button-secondary"
              onClick={closeModal}
              disabled={modalBusy}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`scp-button ${modal.danger ? "scp-button-danger" : "scp-button-primary"}`}
              disabled={modalBusy}
              onClick={async () => {
                setModalError("");
                try {
                  await modal.onConfirm();
                } catch (error: any) {
                  setModalError(error.message || "Something went wrong.");
                }
              }}
            >
              {modalBusy ? "Please wait..." : modal.confirmLabel}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
