import Link from "next/link";
import Flow from "@/components/Flow";

export default function NewListing() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
      <header className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Sell<span className="text-brand"> It</span>
        </Link>
        <Link href="/stats" className="text-sm text-muted">
          Live stats
        </Link>
      </header>
      <Flow />
    </main>
  );
}
