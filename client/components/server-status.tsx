"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";

interface HealthPayload {
  healthy: boolean;
  uptime: number;
  db: "connected" | "unreachable";
}

export function ServerStatus() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<HealthPayload>("/health"),
    retry: 1,
  });

  if (isPending) {
    return <p className="text-sm text-zinc-500">Checking server connection…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500">
        Server unreachable ({error.message}). Is it running on{" "}
        <code className="rounded bg-black/[.06] px-1 py-0.5 font-mono text-[0.9em]">
          {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}
        </code>
        ?
      </p>
    );
  }

  return (
    <p className="text-sm text-emerald-600 dark:text-emerald-400">
      Server connected — uptime {Math.round(data.uptime)}s — DB {data.db}
    </p>
  );
}
