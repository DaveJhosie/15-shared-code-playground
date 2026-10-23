"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type AuthFormProps = {
  mode: "login" | "register";
};

type FormFields = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};

const initialFields: FormFields = {
  name: "",
  email: "",
  password: "",
  confirm: "",
};

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9.9 5.1A10.7 10.7 0 0112 5c5.5 0 9 7 9 7a15 15 0 01-3.1 3.9M6.2 6.2C4.1 7.7 3 10 3 12c0 0 3.5 7 9 7 1.1 0 2.2-.3 3.2-.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 10V7a4 4 0 118 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const reg = mode === "register";

  const [f, setF] = useState<FormFields>(initialFields);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("playground_token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  function updateField(field: keyof FormFields, value: string) {
    setF((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (err) {
      setErr("");
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");

    if (busy) return;

    const email = f.email.trim();

    if (reg && !f.name.trim()) {
      setErr("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Please enter a valid email address.");
      return;
    }

    if (f.password.length < 8) {
      setErr("Your password must contain at least 8 characters.");
      return;
    }

    if (reg && f.password !== f.confirm) {
      setErr("Your passwords do not match. Please try again.");
      return;
    }

    setBusy(true);

    try {
      const body = reg
        ? {
            name: f.name.trim(),
            email,
            password: f.password,
          }
        : {
            email,
            password: f.password,
          };

      const d = await api(
        reg ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      if (!d?.accessToken || !d?.user) {
        throw new Error(
          "Authentication succeeded without the expected user details. Please try again."
        );
      }

      localStorage.setItem("playground_token", d.accessToken);
      localStorage.setItem("playground_user", JSON.stringify(d.user));

      router.push("/dashboard");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="scp-auth min-h-screen">
      {/* Animated background */}
      <div className="scp-auth-background" aria-hidden="true">
        <div className="scp-auth-grid" />
        <div className="scp-auth-orb scp-auth-orb-one" />
        <div className="scp-auth-orb scp-auth-orb-two" />
      </div>

      <div className="scp-auth-layout">
        {/* Left branding panel */}
        <section className="scp-auth-brand">
          {/* <Link href="/" className="scp-auth-logo">
            <span className="scp-auth-logo-icon">SCP</span>

            <span className="scp-auth-brand-name">
              <span>Shared Code</span>
              <small>PLAYGROUND</small>
            </span>
          </Link> */}

          <div className="scp-auth-brand-content">
            {/* <div className="scp-auth-eyebrow">
              <span className="scp-auth-eyebrow-dot" />
              YOUR TEAM'S CODING SPACE
            </div> */}

            <h1>
              Great things
              <br />
              happen when
              <br />
              <span>we build together.</span>
            </h1>

            <p>
              Bring your ideas, your code, and your team into one
              collaborative workspace. Build better software together.
            </p>

            {/* Decorative code preview */}
            <div className="scp-auth-code-card">
              <div className="scp-auth-code-header">
                <div className="scp-auth-window-dots">
                  <i />
                  <i />
                  <i />
                </div>

                <span>hello.js</span>

                <span className="scp-auth-live">
                  <i />
                  Live
                </span>
              </div>

              <div className="scp-auth-code-body">
                <div>
                  <span className="scp-auth-line-number">01</span>
                  <span className="scp-auth-purple">function</span>{" "}
                  <span className="scp-auth-yellow">buildTogether</span>
                  <span className="scp-auth-white">() {"{"}</span>
                </div>

                <div>
                  <span className="scp-auth-line-number">02</span>
                  {"  "}
                  <span className="scp-auth-purple">return</span>{" "}
                  <span className="scp-auth-green">
                    "Ideas into reality."
                  </span>
                  <span className="scp-auth-white">;</span>
                </div>

                <div>
                  <span className="scp-auth-line-number">03</span>
                  <span className="scp-auth-white">{"}"}</span>
                </div>

                <div>
                  <span className="scp-auth-line-number">04</span>
                </div>

                <div>
                  <span className="scp-auth-line-number">05</span>
                  <span className="scp-auth-blue">console</span>.
                  <span className="scp-auth-yellow">log</span>
                  <span className="scp-auth-white">(</span>
                  <span className="scp-auth-yellow">buildTogether</span>
                  <span className="scp-auth-white">());</span>
                </div>
              </div>

              <div className="scp-auth-code-footer">
                <span>⌘ &nbsp; Shared workspace</span>
                <span>JavaScript</span>
              </div>
            </div>

            <div className="scp-auth-brand-points">
              <span>
                <i>✓</i> Real-time collaboration
              </span>
              <span>
                <i>✓</i> Version history
              </span>
              <span>
                <i>✓</i> Browser-based coding
              </span>
            </div>
          </div>

          {/* <p className="scp-auth-copyright">
            © {new Date().getFullYear()} Shared Code Playground · Team 10
          </p> */}
        </section>

        {/* Right authentication panel */}
        <section className="scp-auth-panel">
          <div className="scp-auth-mobile-logo">
            {/* <Link href="/" className="scp-auth-logo">
              <span className="scp-auth-logo-icon">SCP</span>

              <span className="scp-auth-brand-name">
                <span>Shared Code</span>
                <small>PLAYGROUND</small>
              </span>
            </Link> */}
          </div>

          <div className="scp-auth-form-wrap">
            <div className="scp-auth-form-top">
              {/* <span className="scp-auth-form-icon">
                <LockIcon />
              </span>

              <span className="scp-auth-secure-label">
                SECURE AUTHENTICATION
              </span> */}
            </div>

            <div className="scp-auth-heading">
              <h2>
                {reg ? "Create your account" : "Welcome back"}
                <span className="scp-auth-heading-period">.</span>
              </h2>

              <p>
                {reg
                  ? "Create an account and start building together."
                  : "Enter your details to continue to your workspace."}
              </p>
            </div>

            <form onSubmit={submit} className="scp-auth-form" noValidate>
              {reg && (
                <div className="scp-auth-field">
                  <label htmlFor="auth-name">Full name</label>

                  <div className="scp-auth-input-wrap">
                    <input
                      id="auth-name"
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={f.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      autoComplete="name"
                      autoCapitalize="words"
                      maxLength={120}
                      disabled={busy}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="scp-auth-field">
                <label htmlFor="auth-email">Email address</label>

                <div className="scp-auth-input-wrap">
                  <svg
                    className="scp-auth-input-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="m4 7 8 6 8-6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <input
                    id="auth-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={f.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={254}
                    disabled={busy}
                    required
                  />
                </div>
              </div>

              <div className="scp-auth-field">
                <div className="scp-auth-label-row">
                  <label htmlFor="auth-password">Password</label>
                </div>

                <div className="scp-auth-input-wrap">
                  <svg
                    className="scp-auth-input-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="4"
                      y="10"
                      width="16"
                      height="11"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M8 10V7a4 4 0 118 0v3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>

                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={
                      reg ? "Create a strong password" : "Enter your password"
                    }
                    value={f.password}
                    onChange={(e) =>
                      updateField("password", e.target.value)
                    }
                    autoComplete={
                      reg ? "new-password" : "current-password"
                    }
                    minLength={8}
                    disabled={busy}
                    required
                  />

                  <button
                    type="button"
                    className="scp-auth-eye"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>

                {reg && (
                  <p className="scp-auth-field-hint">
                    Use at least 8 characters.
                  </p>
                )}
              </div>

              {reg && (
                <div className="scp-auth-field">
                  <label htmlFor="auth-confirm">Confirm password</label>

                  <div className="scp-auth-input-wrap">
                    <svg
                      className="scp-auth-input-icon"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 12.5 9.5 17 19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <input
                      id="auth-confirm"
                      type={showConfirm ? "text" : "password"}
                      name="confirm"
                      placeholder="Enter your password again"
                      value={f.confirm}
                      onChange={(e) =>
                        updateField("confirm", e.target.value)
                      }
                      autoComplete="new-password"
                      minLength={8}
                      disabled={busy}
                      required
                    />

                    <button
                      type="button"
                      className="scp-auth-eye"
                      onClick={() =>
                        setShowConfirm((previous) => !previous)
                      }
                      aria-label={
                        showConfirm
                          ? "Hide confirmation password"
                          : "Show confirmation password"
                      }
                      aria-pressed={showConfirm}
                    >
                      <EyeIcon visible={showConfirm} />
                    </button>
                  </div>
                </div>
              )}

              {err && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="scp-auth-error"
                >
                  <span className="scp-auth-error-icon">!</span>
                  <p>{err}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="scp-auth-submit"
              >
                {busy ? (
                  <>
                    <span className="scp-auth-spinner" />
                    {reg ? "Creating your account..." : "Signing you in..."}
                  </>
                ) : (
                  <>
                    {reg ? "Create account" : "Log in to your account"}
                    <ArrowIcon />
                  </>
                )}
              </button>
            </form>

            <div className="scp-auth-divider">
              <span />
              <p>{reg ? "ALREADY PART OF SCP?" : "NEW TO SCP?"}</p>
              <span />
            </div>

            <p className="scp-auth-switch">
              {reg
                ? "Already have an account?"
                : "Create an account to get started."}{" "}
              <Link href={reg ? "/login" : "/register"}>
                {reg ? "Log in" : "Sign up"}
                <span aria-hidden="true"> ↗</span>
              </Link>
            </p>

            {/* <p className="scp-auth-bottom-note">
              <LockIcon />
              Your workspace. Your code. Your next big idea.
            </p> */}
          </div>

          {/* <p className="scp-auth-mobile-copyright">
            © {new Date().getFullYear()} SCP · Team 10
          </p> */}
        </section>
      </div>
    </main>
  );
}