"use client";

import { Button } from "@heroui/react";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          ProxyData <span className="text-cyan-400">Next.js 16</span>{" "}
          Boilerplate
        </h1>
        <p className="text-zinc-400">
          The strict tech stack is successfully installed. HeroUI v3, Tailwind
          v4, and Serwist are fully operational.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Button color="primary" variant="shadow">
            Smoke Test HeroUI
          </Button>
          <Button color="default" variant="bordered" className="text-white">
            Phase 2 Complete
          </Button>
        </div>
      </div>
    </main>
  );
}
