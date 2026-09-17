"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      <h1 className="text-2xl font-bold text-red-500 mb-2">Something went wrong!</h1>
      <p className="text-zinc-400 mb-8 text-center max-w-md">An unexpected error occurred in the application.</p>
      <button
        onClick={() => reset()}
        className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-full transition-colors z-10"
      >
        Try again
      </button>
    </div>
  );
}
