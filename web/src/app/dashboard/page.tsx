"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Project = {
  id: string | number;
  name: string;
  description?: string | null;
  role: string;
  memberCount: number;
};

function FolderIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 7.5A2.5 2.5 0 015.5 5H10l2 2h6.5A2.5 2.5 0 0121 9.5v8a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 17.5v-10z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 10h17"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 7v5h-5M4 17v-5h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 9A7 7 0 0117 5l3 2M4 17l3 2a7 7 0 0011.5-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8zM20 8a4 4 0 01-1 7.9M20 21v-2a4 4 0 00-3-3.87"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProjectSkeleton() {
  return (
    <div className="scp-dash-skeleton" aria-hidden="true">
      <div className="scp-dash-skeleton-top">
        <div className="scp-dash-skeleton-icon" />
        <div className="scp-dash-skeleton-badge" />
      </div>

      <div className="scp-dash-skeleton-line scp-dash-skeleton-title" />
      <div className="scp-dash-skeleton-line scp-dash-skeleton-description" />
      <div className="scp-dash-skeleton-line scp-dash-skeleton-short" />
    </div>
  );
}

export default function Dashboard() {
  const { auth, logout } = useAuth();

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const load = useCallback(async () => {
    setErr("");

    try {
      const data = await api("/projects");

      if (!Array.isArray(data)) {
        throw new Error("The server returned an unexpected project list.");
      }

      setProjects(data as Project[]);
    } catch (error: unknown) {
      setErr(
        error instanceof Error
          ? error.message
          : "Unable to load your projects. Please try again."
      );
    }
  }, []);

  useEffect(() => {
    if (auth) {
      void load();
    }
  }, [auth, load]);

  async function refreshProjects() {
    setRefreshing(true);

    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (busy) return;

    if (!name.trim()) {
      setErr("Please enter a project name.");
      return;
    }

    setBusy(true);
    setErr("");

    try {
      await api("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: desc.trim() || undefined,
        }),
      });

      setName("");
      setDesc("");
      setShowCreateForm(false);

      await load();
    } catch (error: unknown) {
      setErr(
        error instanceof Error
          ? error.message
          : "Unable to create your project. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!auth) return null;

  const firstName = auth.user.name?.trim().split(/\s+/)[0] || "Developer";
  const initial = auth.user.name?.trim().charAt(0).toUpperCase() || "U";

  const owned = projects?.filter((p) => p.role === "owner").length ?? 0;

  const shared = projects
    ? projects.filter((p) => p.role !== "owner").length
    : 0;

  const stats = [
    {
      label: "Total projects",
      value: projects?.length ?? "—",
      icon: <FolderIcon />,
      color: "blue",
      note: "Across your workspace",
    },
    {
      label: "Owned by you",
      value: projects ? owned : "—",
      icon: <SparkleIcon />,
      color: "purple",
      note: "Your projects",
    },
    {
      label: "Shared with you",
      value: projects ? shared : "—",
      icon: <UsersIcon />,
      color: "cyan",
      note: "Collaborative projects",
    },
  ];

  return (
    <div className="scp-dashboard">
      {/* Background effects */}
      <div className="scp-dash-background" aria-hidden="true">
        <div className="scp-dash-grid" />
        <div className="scp-dash-orb scp-dash-orb-one" />
        <div className="scp-dash-orb scp-dash-orb-two" />
      </div>

      {/* Navigation */}
      <header className="scp-dash-nav">
        <div className="scp-dash-nav-inner">
          <Link href="/" className="scp-dash-brand">
            <span className="scp-dash-logo">SCP</span>

            <span className="scp-dash-brand-text">
              <strong>Shared Code</strong>
              <small>PLAYGROUND</small>
            </span>

            <span className="scp-dash-nav-divider" />

            <span className="scp-dash-nav-label">Workspace</span>
          </Link>

          <div className="scp-dash-nav-right">
            <div className="scp-dash-online">
              <span />
              Workspace
            </div>

            <div className="scp-dash-user">
              <div className="scp-dash-avatar">{initial}</div>

              <div className="scp-dash-user-info">
                <strong>{auth.user.name}</strong>
                <span>Developer</span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="scp-dash-logout"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 17l5-5-5-5M15 12H3m9-8h6a2 2 0 012 2v12a2 2 0 01-2 2h-6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="scp-dash-main">
        {/* Welcome section */}
        <section className="scp-dash-welcome">
          <div className="scp-dash-welcome-content">
            <div className="scp-dash-eyebrow">
              <span />
              YOUR DEVELOPMENT SPACE
            </div>

            <h1>
              Welcome back, <span>{firstName}</span>
            </h1>

            <p>
              Your ideas are waiting. Pick up where you left off or
              start building something new.
            </p>

            <div className="scp-dash-welcome-meta">
              <span className="scp-dash-meta-icon">
                <SparkleIcon />
              </span>

              <span>
                <strong>Your workspace, your rules.</strong>
                <small>Code, collaborate, and create together.</small>
              </span>
            </div>
          </div>

          <div className="scp-dash-welcome-action">
            <div className="scp-dash-action-decoration" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className="scp-dash-action-icon">
              <FolderIcon />
            </div>

            <h2>Have a new idea?</h2>

            <p>Turn it into a project and bring your team along.</p>

            <button
              type="button"
              className="scp-dash-primary-btn"
              onClick={() => {
                setErr("");
                setShowCreateForm((previous) => !previous);
              }}
            >
              <PlusIcon />
              {showCreateForm ? "Close form" : "Create a project"}
            </button>
          </div>
        </section>

        {/* Statistics */}
        <section className="scp-dash-stats" aria-label="Project statistics">
          {stats.map((stat, index) => (
            <article
              key={stat.label}
              className={`scp-dash-stat scp-dash-stat-${stat.color}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="scp-dash-stat-top">
                <span className="scp-dash-stat-label">{stat.label}</span>

                <span className="scp-dash-stat-icon">{stat.icon}</span>
              </div>

              <div className="scp-dash-stat-value">{stat.value}</div>

              <div className="scp-dash-stat-note">
                <span />
                {stat.note}
              </div>
            </article>
          ))}
        </section>

        {/* Project creation form */}
        {showCreateForm && (
          <section className="scp-dash-create-panel">
            <div className="scp-dash-section-heading">
              <div>
                <span className="scp-dash-section-eyebrow">
                  LET'S BUILD SOMETHING
                </span>

                <h2>Create a new project</h2>

                <p>Give your project a name and an optional description.</p>
              </div>

              <button
                type="button"
                className="scp-dash-close"
                onClick={() => setShowCreateForm(false)}
                aria-label="Close create project form"
              >
                ×
              </button>
            </div>

            <form onSubmit={create} className="scp-dash-create-form">
              <div className="scp-dash-form-field">
                <label htmlFor="project-name">Project name</label>

                <input
                  id="project-name"
                  name="projectName"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (err) setErr("");
                  }}
                  placeholder="e.g. My first application"
                  maxLength={120}
                  autoComplete="off"
                  disabled={busy}
                  required
                />
              </div>

              <div className="scp-dash-form-field">
                <label htmlFor="project-description">
                  Description <span>(optional)</span>
                </label>

                <input
                  id="project-description"
                  name="projectDescription"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="What are you building?"
                  maxLength={500}
                  disabled={busy}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="scp-dash-primary-btn scp-dash-create-btn"
              >
                {busy ? (
                  <>
                    <span className="scp-dash-spinner" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon />
                    Create project
                  </>
                )}
              </button>
            </form>
          </section>
        )}

        {/* Project list heading */}
        <section className="scp-dash-project-section">
          <div className="scp-dash-project-heading">
            <div>
              <span className="scp-dash-section-eyebrow">
                YOUR WORKSPACE
              </span>

              <h2>Your projects</h2>

              <p>
                {projects
                  ? `${projects.length} ${
                      projects.length === 1 ? "project" : "projects"
                    } in your workspace`
                  : "Your collaborative coding space"}
              </p>
            </div>

            <button
              type="button"
              className="scp-dash-refresh"
              onClick={refreshProjects}
              disabled={refreshing}
              aria-label="Refresh projects"
            >
              <span className={refreshing ? "scp-dash-refresh-spinning" : ""}>
                <RefreshIcon />
              </span>

              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>

          {/* Error state */}
          {err && (
            <div className="scp-dash-error" role="alert" aria-live="polite">
              <span className="scp-dash-error-icon">!</span>

              <div>
                <strong>Something went wrong</strong>
                <p>{err}</p>
              </div>

              <button type="button" onClick={refreshProjects}>
                Try again
              </button>
            </div>
          )}

          {/* Loading state */}
          {!projects && !err && (
            <div className="scp-dash-project-grid">
              {[1, 2, 3, 4].map((item) => (
                <ProjectSkeleton key={item} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {projects?.length === 0 && !err && (
            <div className="scp-dash-empty">
              <div className="scp-dash-empty-icon">
                <FolderIcon />
              </div>

              <h3>Your workspace is ready.</h3>

              <p>
                You haven't created or joined any projects yet.
                Start with your first project and watch your ideas grow.
              </p>

              <button
                type="button"
                className="scp-dash-primary-btn"
                onClick={() => setShowCreateForm(true)}
              >
                <PlusIcon />
                Create your first project
              </button>
            </div>
          )}

          {/* Project cards */}
          {projects && projects.length > 0 && (
            <div className="scp-dash-project-grid">
              {projects.map((project, index) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="scp-dash-project-card"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="scp-dash-card-top">
                    <div className="scp-dash-project-icon">
                      {project.name?.charAt(0)?.toUpperCase() || (
                        <FolderIcon />
                      )}
                    </div>

                    <span
                      className={`scp-dash-role ${
                        project.role === "owner"
                          ? "scp-dash-role-owner"
                          : "scp-dash-role-member"
                      }`}
                    >
                      <span />
                      {project.role === "owner" ? "Owner" : project.role}
                    </span>
                  </div>

                  <div className="scp-dash-card-content">
                    <h3>{project.name}</h3>

                    <p>
                      {project.description?.trim() ||
                        "A new space for ideas, collaboration, and code."}
                    </p>
                  </div>

                  <div className="scp-dash-card-footer">
                    <span className="scp-dash-member-count">
                      <UsersIcon />
                      {project.memberCount ?? 0}{" "}
                      {(project.memberCount ?? 0) === 1
                        ? "member"
                        : "members"}
                    </span>

                    <span className="scp-dash-card-open">
                      Open project
                      <ArrowIcon />
                    </span>
                  </div>

                  <div
                    className="scp-dash-card-glow"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="scp-dash-footer">
          <Link href="/" className="scp-dash-footer-brand">
            <span className="scp-dash-footer-logo">SCP</span>
            Shared Code Playground
          </Link>

          <span>Built for ideas that deserve to become reality.</span>

          <span className="scp-dash-footer-team">TEAM 10</span>
        </footer>
      </main>
    </div>
  );
}