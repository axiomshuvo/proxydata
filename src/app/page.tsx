"use client";

import { Button } from "@heroui/react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-white">
      <div className="max-w-xl space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          ProxyData <span className="text-cyan-400">Next.js 16</span>{" "}
          Boilerplate
        </h1>
        <p className="text-zinc-400">
          The strict tech stack is successfully installed. HeroUI v3, Tailwind
          v4, and Serwist are fully operational.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button>Smoke Test HeroUI</Button>
          <Button variant="secondary" className="text-white">
            Phase 2 Complete
          </Button>
        </div>
      </div>
    </main>
  );
}
