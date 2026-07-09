import CreateForm from "@/components/CreateForm";

export default function CreatePage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-2 pb-8">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Create your Short
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter your text or topic, pick your settings, and let AI plan your video.
        </p>
      </div>
      <CreateForm />
    </div>
  );
}
