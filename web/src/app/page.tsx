"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const features = [
  ["Edit together live", "Open the same file with teammates and watch every cursor and keystroke update instantly."],
  ["Save and restore versions", "Name a snapshot with Ctrl+S, then bring any earlier version back in one click."],
  ["Run code safely", "Run JavaScript or Python in a restricted sandbox and read the output right under your code."],
];

export default function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setSignedIn(!!localStorage.getItem("playground_token")), []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06111f] via-[#12141a] to-[#1e1e1e] text-[#cccccc]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#007acc] text-sm">SCP</span>Shared Code Playground
        </span>
        <div className="flex items-center gap-3 text-sm">
          {signedIn ? (
            <Link href="/dashboard" className="rounded-lg bg-[#007acc] px-4 py-2 font-medium text-white hover:bg-[#0a8ae0]">Open dashboard</Link>
          ) : (<>
            <Link href="/login" className="px-3 py-2 hover:text-white">Log in</Link>
            <Link href="/register" className="rounded-lg bg-[#007acc] px-4 py-2 font-medium text-white hover:bg-[#0a8ae0]">Get started</Link>
          </>)}
        </div>
      </nav>
      <header className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">Write code with your team, in the same file, at the same time.</h1>
          <p className="mt-5 max-w-md text-lg">SCP is a browser workspace for sharing projects, editing live, saving versions and running code, with no setup on anyone's machine.</p>
          <div className="mt-8 flex gap-3">
            <Link href={signedIn ? "/dashboard" : "/register"} className="rounded-lg bg-[#007acc] px-6 py-3 font-medium text-white hover:bg-[#0a8ae0]">{signedIn ? "Go to my projects" : "Create a free account"}</Link>
            {!signedIn && <Link href="/login" className="rounded-lg border border-[#3c3c3c] px-6 py-3 text-white hover:bg-[#252526]">Log in</Link>}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#3c3c3c] bg-[#1e1e1e] shadow-2xl">
          <div className="flex items-center gap-2 bg-[#2d2d2d] px-4 py-2 text-xs"><i className="h-3 w-3 rounded-full bg-red-500" /><i className="h-3 w-3 rounded-full bg-yellow-400" /><i className="h-3 w-3 rounded-full bg-green-500" /><span className="ml-3">hello.js</span></div>
          <pre className="p-5 font-mono text-sm leading-6"><span className="text-[#569cd6]">function</span> <span className="text-[#dcdcaa]">greet</span>(name) {"{"}{"\n"}  <span className="text-[#569cd6]">return</span> <span className="text-[#ce9178]">{"`Hello, ${name}!`"}</span>;{"\n"}{"}"}{"\n\n"}console.<span className="text-[#dcdcaa]">log</span>(greet(<span className="text-[#ce9178]">"SCP"</span>));</pre>
          <div className="border-t border-[#3c3c3c] bg-[#181818] px-5 py-3 font-mono text-sm text-green-400">Hello, SCP!</div>
        </div>
      </header>
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-3">
        {features.map(([t, d]) => (
          <div key={t} className="rounded-xl border border-[#3c3c3c] bg-[#252526]/70 p-6">
            <h3 className="text-lg font-semibold text-white">{t}</h3><p className="mt-2 text-sm">{d}</p>
          </div>))}
      </section>
      <footer className="border-t border-[#3c3c3c] py-6 text-center text-sm">SCP · Shared Code Playground · Team 10</footer>
    </div>
  );
}
