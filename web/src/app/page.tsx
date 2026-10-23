"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const features = [
  {
    number: "01",
    icon: "⌘",
    title: "Collaborate in real time",
    description:
      "Code together in the same workspace. See teammates' cursors, edits, and changes as they happen.",
    tag: "LIVE COLLABORATION",
  },
  {
    number: "02",
    icon: "◷",
    title: "Your code, your history",
    description:
      "Save named snapshots of your work and restore previous versions whenever you need them.",
    tag: "VERSION CONTROL",
  },
  {
    number: "03",
    icon: "▷",
    title: "Build without boundaries",
    description:
      "Run JavaScript and Python in a restricted execution environment and see results instantly.",
    tag: "CODE EXECUTION",
  },
];

const codeLines = [
  {
    number: 1,
    content: (
      <>
        <span className="syntax-purple">function</span>{" "}
        <span className="syntax-yellow">greet</span>
        <span className="text-white">(name) {"{"}</span>
      </>
    ),
  },
  {
    number: 2,
    content: (
      <>
        {"  "}
        <span className="syntax-purple">return</span>{" "}
        <span className="syntax-green">`Hello, ${"{"}name{"}"}!`</span>;
      </>
    ),
  },
  {
    number: 3,
    content: <span className="text-white">{"}"}</span>,
  },
  {
    number: 4,
    content: <span />,
  },
  {
    number: 5,
    content: (
      <>
        <span className="syntax-blue">console</span>.
        <span className="syntax-yellow">log</span>
        <span className="text-white">(</span>
        <span className="syntax-yellow">greet</span>
        <span className="text-white">(</span>
        <span className="syntax-green">"SCP"</span>
        <span className="text-white">));</span>
      </>
    ),
  },
];

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

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(localStorage.getItem("playground_token")));
  }, []);

  return (
    <main className="scp-page min-h-screen overflow-hidden text-slate-200">
      {/* Animated background */}
      <div className="scp-background" aria-hidden="true">
        <div className="scp-grid" />
        <div className="scp-orb scp-orb-one" />
        <div className="scp-orb scp-orb-two" />
        <div className="scp-orb scp-orb-three" />
      </div>

      {/* Navigation */}
      <nav className="scp-nav sticky top-0 z-50 border-b border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="scp-logo flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white">
              SCP
            </span>

            <span>
              <span className="block text-base font-bold tracking-tight text-white">
                Shared Code
              </span>
              <span className="block text-xs tracking-wide text-slate-500">
                PLAYGROUND
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-white"
            >
              Features
            </a>
            <a
              href="#workspace"
              className="transition-colors hover:text-white"
            >
              Workspace
            </a>
            <a
              href="#about"
              className="transition-colors hover:text-white"
            >
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            {signedIn ? (
              <Link
                href="/dashboard"
                className="scp-button scp-button-primary flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
              >
                Dashboard <ArrowIcon />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-lg px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white sm:block"
                >
                  Log in
                </Link>

                <Link
                  href="/register"
                  className="scp-button scp-button-primary flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Get started <ArrowIcon />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        id="workspace"
        className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-20 sm:px-8 sm:pt-28 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-32 lg:pt-32"
      >
        {/* Hero text */}
        <div className="scp-hero-copy">
          <div className="scp-badge mb-7 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="scp-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>

            Your team's collaborative coding space
          </div>

          <h1 className="max-w-2xl text-4xl font-bold leading-[1.13] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Great code
            <br />
            happens{" "}
            <span className="scp-gradient-text">together.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
            One workspace. One team. Endless possibilities. Write code
            together in real time, save every important version, and run your
            projects right in the browser.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href={signedIn ? "/dashboard" : "/register"}
              className="scp-button scp-button-primary group inline-flex items-center gap-3 rounded-xl px-6 py-3.5 text-sm font-semibold text-white"
            >
              {signedIn ? "Open my workspace" : "Create a free account"}

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                <ArrowIcon />
              </span>
            </Link>

            {!signedIn && (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                Sign in
              </Link>
            )}
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <CheckIcon /> Browser-based workspace
            </span>
            <span className="flex items-center gap-2">
              <CheckIcon /> Built for collaboration
            </span>
            <span className="flex items-center gap-2">
              <CheckIcon /> Version history
            </span>
          </div>

          {/* Team avatars */}
          <div className="mt-12 flex items-center gap-4 border-t border-white/[0.07] pt-7">
            <div className="flex -space-x-3">
              <div className="scp-avatar bg-blue-500">D</div>
              <div className="scp-avatar bg-violet-500">A</div>
              <div className="scp-avatar bg-emerald-500">J</div>
              <div className="scp-avatar bg-orange-500">M</div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-200">
                Better code, together
              </p>
              <p className="mt-1 text-xs text-slate-500">
                A workspace designed for your team
              </p>
            </div>
          </div>
        </div>

        {/* Interactive-style code editor preview */}
        <div className="scp-hero-editor relative" aria-label="Code editor preview">
          <div className="scp-editor-glow" />

          <div className="scp-editor relative overflow-hidden rounded-2xl">
            {/* Editor title bar */}
            <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#151b29] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />

                <span className="ml-3 text-xs text-slate-500">
                  shared-workspace
                </span>
              </div>

              <span className="flex items-center gap-2 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Connected
              </span>
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b border-white/[0.07] bg-[#101521]">
              <div className="flex items-center gap-2 border-r border-white/[0.07] border-t-2 border-t-blue-400 bg-[#1b2232] px-5 py-3 text-xs text-slate-200">
                <span className="font-bold text-yellow-300">JS</span>
                hello.js
              </div>

              <span className="px-4 text-xs text-slate-600">
                + New file
              </span>
            </div>

            {/* Code */}
            <div className="scp-code-area min-h-[245px] overflow-x-auto px-2 py-6 sm:px-4 sm:py-8">
              <div className="min-w-[330px] font-mono text-[12px] leading-8 sm:text-sm">
                {codeLines.map((line) => (
                  <div
                    key={line.number}
                    className="scp-code-line flex min-h-8"
                    style={{
                      animationDelay: `${0.5 + line.number * 0.15}s`,
                    }}
                  >
                    <span className="w-10 shrink-0 select-none pr-4 text-right text-slate-600">
                      {line.number}
                    </span>

                    <span className="relative whitespace-pre text-slate-300">
                      {line.content}

                      {line.number === 2 && (
                        <span className="scp-cursor ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-blue-400" />
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Collaborator cursors */}
              <div className="scp-collab-cursor scp-cursor-one hidden sm:block">
                <div className="scp-cursor-label bg-violet-500">
                  Alex
                </div>
                <div className="h-7 w-[2px] bg-violet-400" />
              </div>

              <div className="scp-collab-cursor scp-cursor-two hidden sm:block">
                <div className="scp-cursor-label bg-emerald-500">
                  Jordan
                </div>
                <div className="h-6 w-[2px] bg-emerald-400" />
              </div>
            </div>

            {/* Terminal */}
            <div className="border-t border-white/[0.07] bg-[#0c111b]">
              <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Terminal
                </span>

                <span className="text-[10px] text-slate-600">
                  JavaScript
                </span>
              </div>

              <div className="px-5 py-4 font-mono text-xs leading-6 sm:text-sm">
                <p className="text-slate-500">
                  <span className="text-emerald-400">➜</span> Run hello.js
                </p>

                <p className="scp-output mt-1 text-emerald-400">
                  Hello, SCP!
                </p>

                <p className="mt-2 text-slate-600">
                  Process finished successfully
                </p>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between bg-blue-600 px-4 py-2 text-[10px] font-medium text-white sm:px-5">
              <div className="flex items-center gap-3">
                <span>main</span>
                <span>JavaScript</span>
              </div>

              <div className="flex items-center gap-3">
                <span>UTF-8</span>
                <span>Ln 2, Col 18</span>
              </div>
            </div>
          </div>

          {/* Floating collaboration card */}
          <div className="scp-float-card absolute -bottom-7 -left-3 flex items-center gap-3 rounded-xl p-3.5 sm:-left-7 sm:p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10 text-lg text-emerald-400">
              ↗
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                Changes synced
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Everyone is up to date
              </p>
            </div>

            <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
              <CheckIcon />
            </span>
          </div>

          {/* Floating teammate card */}
          <div className="scp-float-card scp-float-top absolute -right-2 -top-7 hidden items-center gap-2.5 rounded-xl p-3 sm:flex">
            <div className="scp-avatar h-8 w-8 bg-violet-500 text-xs">
              A
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                Alex is editing
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active now
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology strip */}
      <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-5 py-7 text-xs text-slate-500 sm:gap-x-14 sm:px-8">
          <span className="uppercase tracking-[0.2em]">
            YOUR WORKSPACE
          </span>
          <span className="flex items-center gap-2">
            <span className="font-bold text-yellow-400">JS</span>
            JavaScript
          </span>
          <span className="flex items-center gap-2">
            <span className="font-bold text-blue-400">Py</span>
            Python
          </span>
          <span className="flex items-center gap-2">
            <span className="font-bold text-violet-400">{"</>"}</span>
            Shared editing
          </span>
          <span className="flex items-center gap-2">
            <span className="font-bold text-emerald-400">↺</span>
            Version history
          </span>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32"
      >
        <div className="scp-reveal mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
            Everything in one place
          </span>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your workflow,{" "}
            <span className="scp-gradient-text">supercharged.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
            Less time switching tools. More time building, experimenting,
            and solving problems with your team.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.number}
              className="scp-feature scp-reveal group relative overflow-hidden rounded-2xl p-7 sm:p-8"
              style={{
                animationDelay: `${index * 0.15}s`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="scp-feature-icon flex h-12 w-12 items-center justify-center rounded-xl text-2xl text-blue-300">
                  {feature.icon}
                </div>

                <span className="font-mono text-xs text-slate-600">
                  {feature.number}
                </span>
              </div>

              <h3 className="mt-8 text-lg font-semibold text-white transition-colors duration-300 group-hover:text-blue-300">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                {feature.description}
              </p>

              <div className="mt-7 flex items-center justify-between border-t border-white/[0.07] pt-5">
                <span className="text-[10px] font-medium tracking-[0.15em] text-slate-500">
                  {feature.tag}
                </span>

                <span className="text-slate-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-400">
                  <ArrowIcon />
                </span>
              </div>

              <div className="scp-feature-shine" />
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        id="about"
        className="relative z-10 mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32"
      >
        <div className="scp-cta scp-reveal relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12 sm:py-20">
          <div className="scp-cta-orb" />

          <div className="relative z-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xl font-black text-white">
              SCP
            </div>

            <h2 className="mx-auto mt-7 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Your next great project starts here.
            </h2>

            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
              Bring your ideas and your team into one workspace. Start
              building together today.
            </p>

            <Link
              href={signedIn ? "/dashboard" : "/register"}
              className="scp-button scp-button-primary mt-8 inline-flex items-center gap-3 rounded-xl px-7 py-4 text-sm font-semibold text-white"
            >
              {signedIn ? "Open your workspace" : "Get started for free"}
              <ArrowIcon />
            </Link>

            <p className="mt-5 text-xs text-slate-500">
              Built for developers. Designed for collaboration.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="scp-logo flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black text-white">
              SCP
            </span>

            <span className="text-sm font-semibold text-slate-300">
              Shared Code Playground
            </span>
          </Link>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} SCP · Team 10. Built for better
            collaboration.
          </p>

          <div className="flex gap-5 text-xs text-slate-500">
            <Link
              href="/login"
              className="transition-colors hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="transition-colors hover:text-white"
            >
              Join SCP
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}