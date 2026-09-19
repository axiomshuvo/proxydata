import Link from "next/link";

export const metadata = {
  title: "Offline — ProxyData",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-2xl font-bold text-cyan-400">
        P
      </div>
      <h1 className="mt-6 text-xl font-bold text-white">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-400">
        ProxyData needs a connection to load plans and dashboards. Check your
        network and try again — anything you had open is safe.
      </p>
      <Link
        href="/"
        className="mt-6 flex min-h-12 items-center rounded-xl bg-cyan-500 px-6 text-sm font-bold text-black hover:bg-cyan-400"
      >
        Retry
      </Link>
    </div>
  );
}
