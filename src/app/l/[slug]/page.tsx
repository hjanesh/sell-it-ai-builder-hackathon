import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing, type Listing } from "@/lib/store";
import { fillPrice, formatINR, waNumber } from "@/lib/format";
import type { DetectResult, PacksResult } from "@/lib/schemas";
import { TrackView } from "@/components/Track";

export const dynamic = "force-dynamic";

type ListingData = {
  detect: DetectResult;
  answers: Record<string, string>;
  availability: string | null;
  packs: PacksResult;
};

const TYPE_LABEL: Record<string, string> = { pre_owned: "Pre-owned", new: "New / unused", homemade: "Homemade" };
const AVAIL_LABEL: Record<string, string> = { one_off: "One-off", weekly_batches: "Weekly batches", by_request: "Made to order" };

export async function generateMetadata({ params }: PageProps<"/l/[slug]">): Promise<Metadata> {
  const listing = await getListing((await params).slug);
  if (!listing) return { title: "Listing not found · Sell It" };
  const image = listing.images.find((i) => i.startsWith("http"));
  const desc = ((listing.data as ListingData).packs?.positioning ?? "").slice(0, 160);
  return {
    title: `${listing.title} · ₹${formatINR(listing.price)} · Sell It`,
    description: desc,
    openGraph: { title: `${listing.title} · ₹${formatINR(listing.price)}`, description: desc, images: image ? [image] : [] },
  };
}

export default async function ListingPage({ params }: PageProps<"/l/[slug]">) {
  const { slug } = await params;
  const listing: Listing | null = await getListing(slug);
  if (!listing) notFound();
  const data = listing.data as ListingData;
  const page = data.packs.listingPage;
  const fill = (t: string) => fillPrice(t, listing.price);
  const details = [
    ...data.detect.attributes.map((a) => [a.label, a.value]),
    ...data.detect.questions.filter((q) => q.id !== "location" && data.answers[q.id]?.trim()).map((q) => [q.label, data.answers[q.id]]),
  ];
  const location = data.answers.location;
  const enquiry = `Hi ${listing.seller_name}, is "${listing.title}" (₹${formatINR(listing.price)}) still available? I saw it on Sell It.`;

  return (
    <main className="mx-auto w-full max-w-md flex-1 pb-28">
      <TrackView slug={slug} />
      <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
        {listing.images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt={i === listing.images.length - 1 ? "Original photo" : listing.title} className="w-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {listing.images.length > 1 && <p className="px-4 pt-1 text-xs text-muted">Swipe for more · last photo is the untouched original</p>}

      <div className="flex flex-col gap-4 px-4 pt-4">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-brand">{TYPE_LABEL[listing.listing_type] ?? listing.listing_type}</span>
          {data.availability && <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">{AVAIL_LABEL[data.availability]}</span>}
          {location && <span className="rounded-full bg-stone-100 px-3 py-1">📍 {location}</span>}
        </div>
        <h1 className="text-2xl font-bold leading-tight">{page.headline || listing.title}</h1>
        <p className="text-3xl font-extrabold">₹{formatINR(listing.price)}</p>
        <p className="whitespace-pre-wrap">{fill(page.description)}</p>

        {details.length > 0 && (
          <section className="rounded-3xl border border-line bg-surface p-4">
            <h2 className="font-semibold">Details</h2>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {details.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {page.faq.length > 0 && (
          <section className="rounded-3xl border border-line bg-surface p-4">
            <h2 className="font-semibold">Questions buyers ask</h2>
            <div className="mt-2 flex flex-col gap-3 text-sm">
              {page.faq.map((f) => (
                <div key={f.q}>
                  <p className="font-medium">{f.q}</p>
                  <p className="text-muted">{fill(f.a)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-sm text-muted">
          Sold by <span className="font-semibold text-foreground">{listing.seller_name}</span>. Photos were cleaned up (light, crop, background); the item
          itself is not edited.
        </p>
        <Link href="/new" className="rounded-2xl border border-dashed border-line p-4 text-center text-sm">
          Have something to sell? <span className="font-semibold text-brand">Make your own listing with Sell It →</span>
        </Link>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-background/95 p-4 backdrop-blur">
        <a
          href={`https://wa.me/${waNumber(listing.seller_whatsapp)}?text=${encodeURIComponent(enquiry)}`}
          className="mx-auto flex min-h-12 max-w-md items-center justify-center rounded-2xl bg-[#25D366] text-base font-semibold text-white"
        >
          Chat with {listing.seller_name} on WhatsApp
        </a>
      </div>
    </main>
  );
}
