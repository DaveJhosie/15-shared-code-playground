import Link from "next/link";
export default function NotFound() {
  return (<main className="flex min-h-screen flex-col items-center justify-center gap-3">
    <h1 className="text-xl text-white">Project not found</h1>
    <p>It may not exist, or you are not a member.</p>
    <Link href="/dashboard" className="text-[#3794ff] underline">Back to my projects</Link></main>);
}
