import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          AI YouTube Shorts Generator
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Turn text, news, or an image into a script, scene plan, and voiceover-ready
          9:16 short — automatically.
        </p>
        <div className="flex gap-3">
          <Link
            href="/create"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Create a video
          </Link>
          <Link
            href="/projects"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            My Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
