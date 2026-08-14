import { ServerStatus } from "@/components/server-status";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">AstroApp</h1>
      <p className="max-w-sm text-center text-sm text-zinc-500">
        Chapter 1 scaffold — Client and Server wiring check.
      </p>
      <ServerStatus />
    </div>
  );
}
