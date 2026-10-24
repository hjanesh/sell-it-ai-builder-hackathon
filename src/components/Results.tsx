"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Channel, DetectResult, Language, PacksResult, PriceResult } from "@/lib/schemas";
import { compose, dataUrlToFile, type Box } from "@/lib/images";
import { downloadZip, fillPrice, formatINR, shareFiles, track } from "@/lib/share";
import { authHeader } from "@/lib/auth";
import { costFloor, priceCards, type Cost } from "@/lib/pricing";
import { Button, Card, Chip, CopyButton, Spinner, copyText } from "./ui";
import type { Seller } from "./Flow";
import ProVideo from "./ProVideo";

export type Studio = {
  original: string;
  square: string[];
  olx: string[];
  feed: string[];
  storyBase: HTMLCanvasElement;
  storyBox: Box;
};

type Props = {
  detect: DetectResult;
  answers: Record<string, string>;
  availability: string | null;
  language: Language;
  seller: Seller;
  studio: Studio | null;
  price: PriceResult | null;
  priceError: string | null;
  packs: PacksResult | null;
  packsError: string | null;
  onLanguage: (l: Language) => void;
  onRetry: () => void;
  onNew: () => void;
};

const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  olx: "OLX",
  marketplace: "Marketplace",
  listing_page: "Listing page",
};
const TABS: Exclude<Channel, "listing_page">[] = ["whatsapp", "instagram", "olx", "marketplace"];
type View = "photos" | "price" | "post";
const VIEWS: { id: View; label: string }[] = [
  { id: "photos", label: "Photos" },
  { id: "price", label: "Price" },
  { id: "post", label: "Post" },
];
const LANG_LABEL: Record<Language, string> = {
  en: "English",
  hinglish: "Hinglish",
  hi: "हिंदी",
  mr: "मराठी",
  ta: "தமிழ்",
};

export default function Results(props: Props) {
  const { detect, studio, price, packs } = props;
  // Homemade cost floor (materials + hours); the cards never go below it.
  const [cost, setCost] = useState<Cost>({ materials: 0, hours: 0 });
  const floor = costFloor(cost);
  const cards = price ? priceCards(price, floor) : null;
  // The seller's pick or edit wins; until then use the recommended card.
  const [editedPrice, setPriceValue] = useState<number | null>(null);
  const priceValue = editedPrice ?? cards?.recommended ?? floor ?? null;
  // Default to the best-ranked channel until the seller picks a tab.
  const [tabChoice, setTab] = useState<(typeof TABS)[number] | null>(null);
  // One step on screen at a time: photos, then price, then where to post.
  const [step, setStep] = useState<View>("photos");
  const bestTab = packs?.place.find((p) => p.channel !== "listing_page")?.channel as (typeof TABS)[number] | undefined;
  const tab = tabChoice ?? bestTab ?? "whatsapp";
  const [slug, setSlug] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackAsked = useRef(false);
  const publishing = useRef<Promise<string> | null>(null);
  // The written headline includes the seller's answers (brand, model); detect.title is only the first guess.
  const title = packs?.listingPage.headline || detect.title;

  const story = useMemo(
    () =>
      studio
        ? compose(studio.storyBase, "story", studio.storyBox, {
            title,
            price: priceValue ? `₹${formatINR(priceValue)}` : "",
          })
        : null,
    [studio, title, priceValue],
  );

  const listingUrl = slug ? `${window.location.origin}/l/${slug}` : null;

  // Publish in the background once everything is ready: the share sheet must open within the tap,
  // so the link has to exist before the seller hits Share.
  const ready = Boolean(packs && studio && (price || props.priceError));
  useEffect(() => {
    if (ready) ensurePublished().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  /** Publishes the listing page the first time something is shared, so every message can carry the link. */
  function ensurePublished(): Promise<string> {
    if (slug) return Promise.resolve(slug);
    if (!studio || !packs) return Promise.reject(new Error("Still preparing your listing…"));
    publishing.current ??= authHeader()
      .then((auth) =>
        fetch("/api/listings", {
          method: "POST",
          headers: { "content-type": "application/json", ...auth },
          body: JSON.stringify({
            seller: props.seller,
            listingType: detect.listingType,
            title,
            price: priceValue ?? price?.recommended ?? 0,
            images: [...studio.square, studio.original],
            data: {
              detect,
              answers: props.answers,
              availability: props.availability,
              language: props.language,
              packs,
              price: price ? { ...price, recommended: priceValue ?? price.recommended } : null,
              seller: props.seller,
            },
          }),
        }),
      )
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Couldn't publish");
        setSlug(j.slug);
        setReviewStatus(j.review ?? null);
        return j.slug as string;
      })
      .catch((e) => {
        publishing.current = null;
        throw e;
      });
    return publishing.current;
  }

  function afterAction(name: "shared" | "exported" | "copied", channel: string) {
    track(name, channel, slug);
    if (!feedbackAsked.current) {
      feedbackAsked.current = true;
      setTimeout(() => setShowFeedback(true), 1200);
    }
  }

  const fill = (t: string) => fillPrice(t, priceValue);
  const withLink = async (t: string) => {
    const s = await ensurePublished().catch(() => null);
    return s ? `${fill(t)}\n\n👉 Photos & details: ${window.location.origin}/l/${s}` : fill(t);
  };

  if (props.packsError) {
    return (
      <Card>
        <p className="text-error">{props.packsError}</p>
        <Button className="mt-3 w-full" onClick={props.onRetry}>
          Try again
        </Button>
      </Card>
    );
  }
  if (!packs) return <Spinner label="Writing your posts, pricing it, cleaning photos…" />;

  const top = packs.place.slice(0, 2);

  return (
    <div className="flex flex-col gap-5 pb-28">
      <div>
        <p className="caption-up text-muted">Your listing is ready</p>
        <h1 className="display-sm mt-2 balance">{title}</h1>
      </div>

      <nav className="grid grid-cols-3 gap-1 rounded-full border border-line bg-surface p-1" aria-label="Steps">
        {VIEWS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={`min-h-10 rounded-full text-sm font-semibold transition ${step === s.id ? "bg-brand text-brand-ink" : "text-muted"}`}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </nav>

      {step === "photos" && (
        <>
          <p className="body-md text-body pretty">{packs.positioning}</p>
          {/* Photos */}
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4">
            {studio ? (
              <>
                {studio.square.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="w-64 shrink-0 snap-center rounded-2xl border border-line" />
                ))}
                <figure className="w-64 shrink-0 snap-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={studio.original} alt="" className="aspect-square w-full rounded-2xl border border-line object-cover" />
                  <figcaption className="mt-1 text-xs text-muted">Original, untouched</figcaption>
                </figure>
              </>
            ) : (
              <div className="h-64 w-64 animate-pulse rounded-2xl bg-cream-strong" />
            )}
          </div>
          <p className="-mt-2 text-xs text-muted">
            Cropped and light-corrected. Nothing in the photo is changed. The last one is your original.
          </p>
        </>
      )}

      {step === "price" && (
        /* Price */
        <Card>
          <h2 className="text-lg font-semibold">What to charge</h2>
          {cards ? (
            <>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(
                  [
                    ["Sell fast", cards.fast, "Goes in a day or two"],
                    ["Recommended", cards.recommended, "Fair, sells in a week"],
                    ["Best price", cards.best, "If you can wait"],
                  ] as const
                ).map(([label, value, hint]) => {
                  const active = priceValue === value;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setPriceValue(value)}
                      className={`flex min-h-24 flex-col items-start justify-between rounded-xl border p-3 text-left transition ${
                        active ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface"
                      }`}
                    >
                      <span className={`text-xs font-semibold ${active ? "text-brand-ink" : "text-muted"}`}>{label}</span>
                      <span className="text-xl font-medium tracking-tight">₹{formatINR(value)}</span>
                      <span className={`text-[11px] leading-tight ${active ? "text-brand-ink/80" : "text-muted"}`}>{hint}</span>
                    </button>
                  );
                })}
              </div>
              <PriceInput value={priceValue} onChange={setPriceValue} />
              <details className="mt-3 rounded-xl bg-cream p-3 text-sm">
                <summary className="cursor-pointer font-semibold">Why this price</summary>
                <ul className="mt-2 list-disc pl-5 text-body">
                  {price!.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </details>
              {price!.comps.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-semibold">Similar listings we found today</p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {price!.comps.map((c, i) => (
                      <li key={i}>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex justify-between gap-3 rounded-xl bg-cream px-3 py-2 text-sm"
                        >
                          <span className="line-clamp-1">
                            <span className="font-medium">{c.source}</span> · {c.title}
                          </span>
                          <span className="shrink-0 font-semibold">{c.priceText}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted">No reliable comparable listings found. This is an estimate.</p>
              )}
            </>
          ) : props.priceError ? (
            <div className="mt-2 flex flex-col gap-2">
              <p className="text-sm text-error">{props.priceError}</p>
              <PriceInput value={priceValue} onChange={setPriceValue} />
            </div>
          ) : (
            <p className="mt-2 animate-pulse text-muted">Checking real listings for a fair price…</p>
          )}
          {detect.listingType === "homemade" && <CostCalculator cost={cost} floor={floor} onChange={setCost} />}
        </Card>
      )}

      {step === "post" && (
        <>
          {/* Place */}
          <Card tone="lavender">
            <p className="caption-up">Best places for this</p>
            <ol className="mt-3 flex flex-col gap-2">
              {top.map((p, i) => (
                <li key={p.channel} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-ink">
                    {i + 1}
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold">{CHANNEL_LABEL[p.channel]}</span>
                    <span className="text-body">: {p.reason}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          {/* Channel packs */}
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {TABS.map((t) => (
              <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
                {CHANNEL_LABEL[t]}
              </Chip>
            ))}
          </div>

          {tab === "whatsapp" && (
            <WhatsAppPack packs={packs} studio={studio} story={story} withLink={withLink} fill={fill} onDone={afterAction} />
          )}
          {tab === "instagram" && <InstagramPack packs={packs} studio={studio} story={story} fill={fill} onDone={afterAction} />}
          {tab === "olx" && (
            <GuidedPost
              platform="OLX"
              openUrl="https://www.olx.in/post"
              images={studio?.olx ?? []}
              onDone={afterAction}
              steps={[
                {
                  title: "Open OLX and tap + SELL",
                  hint: "Use the OLX app if you have it.",
                },
                { title: "Choose the category", value: packs.olx.categoryPath },
                // Price, location, title and description have their own steps below.
                ...packs.olx.details
                  .filter((d) => !/price|location|title|description/i.test(d.field))
                  .map((d) => ({ title: d.field, value: fill(d.value) })),
                { title: "Ad title", value: fill(packs.olx.title) },
                {
                  title: "Describe what you are selling",
                  value: fill(packs.olx.description),
                },
                {
                  title: "Set a price",
                  value: priceValue ? String(priceValue) : "",
                },
                {
                  title: "Upload photos",
                  hint: "Save the photos below first, then pick them in OLX.",
                  photos: true,
                },
                {
                  title: "Confirm your location",
                  value: props.answers.location ?? "",
                },
                { title: "Review your details and tap Post now" },
              ]}
            />
          )}
          {tab === "marketplace" && (
            <GuidedPost
              platform="Marketplace"
              openUrl="https://www.facebook.com/marketplace/create/item"
              images={studio?.olx ?? []}
              onDone={afterAction}
              steps={[
                {
                  title: "Open Facebook → Marketplace → Create new listing → Item for sale",
                },
                {
                  title: "Add photos",
                  hint: "Save the photos below first.",
                  photos: true,
                },
                { title: "Title", value: fill(packs.marketplace.title) },
                { title: "Price", value: priceValue ? String(priceValue) : "" },
                { title: "Category", value: packs.marketplace.category },
                { title: "Condition", value: packs.marketplace.condition },
                {
                  title: "Description",
                  value: fill(packs.marketplace.description),
                },
                { title: "Location", value: props.answers.location ?? "" },
                { title: "Tap Next, then Publish" },
              ]}
            />
          )}

          <ProVideo title={title} onInterest={() => track("pro_interest", "pro_video", slug)} />

          {/* Listing page */}
          <Card>
            <h2 className="text-lg font-semibold">Your Sell It listing page</h2>
            <p className="text-sm text-muted">One link with all photos and details, and a WhatsApp button for buyers.</p>
            {reviewStatus === "pending" && (
              <p className="mt-2 rounded-xl bg-accent/30 p-2 text-sm">⏳ Our team is checking this listing. The link goes live as soon as it&apos;s approved.</p>
            )}
            {listingUrl ? (
              <div className="mt-3 flex items-center gap-2">
                <a href={listingUrl} target="_blank" rel="noreferrer" className="line-clamp-1 flex-1 text-brand underline">
                  {listingUrl}
                </a>
                <CopyButton text={listingUrl} onCopied={() => afterAction("copied", "listing_page")} />
              </div>
            ) : (
              <Button variant="secondary" className="mt-3 w-full" onClick={() => ensurePublished().catch((e) => alert(e.message))}>
                Get my listing link
              </Button>
            )}
          </Card>

          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              disabled={!studio}
              onClick={async () => {
                if (!studio) return;
                const name = title.replace(/[^\w]+/g, "-").slice(0, 40);
                const blob = async (d: string) => (await fetch(d)).blob();
                await downloadZip(name, [
                  ...(await Promise.all(
                    studio.square.map(async (d, i) => ({
                      path: `square/photo-${i + 1}.jpg`,
                      data: await blob(d),
                    })),
                  )),
                  ...(await Promise.all(
                    studio.olx.map(async (d, i) => ({
                      path: `olx-marketplace/photo-${i + 1}.jpg`,
                      data: await blob(d),
                    })),
                  )),
                  ...(await Promise.all(
                    studio.feed.map(async (d, i) => ({
                      path: `instagram-post/photo-${i + 1}.jpg`,
                      data: await blob(d),
                    })),
                  )),
                  ...(story ? [{ path: "story-status.jpg", data: await blob(story) }] : []),
                  { path: "original.jpg", data: await blob(studio.original) },
                  {
                    path: "olx.txt",
                    data: `${packs.olx.title}\n\n${fill(packs.olx.description)}`,
                  },
                  {
                    path: "marketplace.txt",
                    data: `${packs.marketplace.title}\n\n${fill(packs.marketplace.description)}`,
                  },
                  {
                    path: "instagram.txt",
                    data: `${fill(packs.instagram.caption)}\n\n${packs.instagram.hashtags.map((h) => `#${h}`).join(" ")}`,
                  },
                  {
                    path: "whatsapp.txt",
                    data: Object.entries(packs.whatsapp)
                      .map(([k, v]) => `--- ${k} ---\n${fill(v)}`)
                      .join("\n\n"),
                  },
                ]);
                afterAction("exported", "zip");
              }}
            >
              ⬇ Download everything (ZIP)
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">Posts language:</span>
              {(Object.keys(LANG_LABEL) as Language[]).map((l) => (
                <Chip key={l} active={props.language === l} onClick={() => props.onLanguage(l)}>
                  {LANG_LABEL[l]}
                </Chip>
              ))}
            </div>
            <Button variant="ghost" onClick={props.onNew}>
              Sell something else
            </Button>
            <button className="text-sm text-muted underline" onClick={() => setShowFeedback(true)}>
              Give feedback
            </button>
          </div>
        </>
      )}

      {step !== "post" && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 p-4 backdrop-blur">
          <div className="mx-auto max-w-md">
            <Button className="w-full" onClick={() => setStep(step === "photos" ? "price" : "post")}>
              {step === "photos" ? "Next: set the price →" : `Next: post it at ₹${priceValue ? formatINR(priceValue) : "…"} →`}
            </Button>
          </div>
        </div>
      )}

      {showFeedback && <FeedbackSheet slug={slug} onClose={() => setShowFeedback(false)} />}
    </div>
  );
}

type Done = (name: "shared" | "exported" | "copied", channel: string) => void;

function WhatsAppPack({
  packs,
  studio,
  story,
  withLink,
  fill,
  onDone,
}: {
  packs: PacksResult;
  studio: Studio | null;
  story: string | null;
  withLink: (t: string) => Promise<string>;
  fill: (t: string) => string;
  onDone: Done;
}) {
  const [audience, setAudience] = useState<keyof PacksResult["whatsapp"]>("society");
  const labels: Record<keyof PacksResult["whatsapp"], string> = {
    society: "Society / apartment group",
    family: "Family group",
    friends: "Friends",
    status: "My Status",
  };
  const text = packs.whatsapp[audience];
  return (
    <Card>
      <p className="text-sm font-medium">Where are you sending it?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(labels) as (keyof typeof labels)[]).map((a) => (
          <Chip key={a} active={audience === a} onClick={() => setAudience(a)}>
            {labels[a]}
          </Chip>
        ))}
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#e7ffdb] p-3 font-sans text-[15px]">{fill(text)}</pre>
      <div className="mt-3 flex flex-col gap-2">
        <Button
          disabled={!studio}
          onClick={async () => {
            const image = audience === "status" ? story : studio?.square[0];
            const files = image ? [await dataUrlToFile(image, "sell-it.jpg")] : [];
            const message = await withLink(text);
            if (audience !== "status") await copyText(message);
            await shareFiles({ files, text: message, whatsappFallback: true });
            onDone("shared", `whatsapp_${audience}`);
          }}
        >
          Share to WhatsApp
        </Button>
        <CopyButton text={fill(text)} label="Copy message only" onCopied={() => onDone("copied", `whatsapp_${audience}`)} />
      </div>
      <p className="mt-2 text-xs text-muted">
        Pick WhatsApp in the share sheet, then choose the group. The message is also copied, so you can paste it if WhatsApp drops it.
      </p>
    </Card>
  );
}

function InstagramPack({
  packs,
  studio,
  story,
  fill,
  onDone,
}: {
  packs: PacksResult;
  studio: Studio | null;
  story: string | null;
  fill: (t: string) => string;
  onDone: Done;
}) {
  const [format, setFormat] = useState<"post" | "story">("post");
  const caption = `${fill(packs.instagram.caption)}\n\n${packs.instagram.hashtags.map((h) => `#${h}`).join(" ")}`;
  const images = format === "post" ? (studio?.feed ?? []) : story ? [story] : [];
  return (
    <Card>
      <div className="flex gap-2">
        <Chip active={format === "post"} onClick={() => setFormat("post")}>
          {studio && studio.feed.length > 1 ? "Carousel post" : "Feed post"}
        </Chip>
        <Chip active={format === "story"} onClick={() => setFormat("story")}>
          Story
        </Chip>
      </div>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" className={`${format === "post" ? "w-40" : "w-32"} shrink-0 rounded-xl border border-line`} />
        ))}
      </div>
      {format === "post" ? (
        <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap rounded-2xl bg-cream p-3 font-sans text-sm">{caption}</pre>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Story text on the image: “{packs.instagram.storyText}”. Add a link sticker with your listing link.
        </p>
      )}
      <div className="mt-3 flex flex-col gap-2">
        <Button
          disabled={images.length === 0}
          onClick={async () => {
            await copyText(caption);
            const files = await Promise.all(images.map((d, i) => dataUrlToFile(d, `sell-it-${i + 1}.jpg`)));
            await shareFiles({ files });
            onDone("shared", `instagram_${format}`);
          }}
        >
          Copy caption &amp; share to Instagram
        </Button>
        {format === "post" && (
          <CopyButton text={caption} label="Copy caption only" onCopied={() => onDone("copied", "instagram_caption")} />
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        {format === "post"
          ? "Pick Instagram → Feed in the share sheet. The caption is already copied: long-press the caption box and paste."
          : "Pick Instagram → Story in the share sheet."}
      </p>
    </Card>
  );
}

type Step = { title: string; value?: string; hint?: string; photos?: boolean };

// Steps follow each app's posting flow. TODO(team): verify against a real walkthrough on a phone (see SPEC §7).
function GuidedPost({
  platform,
  openUrl,
  steps,
  images,
  onDone,
}: {
  platform: string;
  openUrl: string;
  steps: Step[];
  images: string[];
  onDone: Done;
}) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const mark = (i: number) => setDone((d) => new Set(d).add(i));
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Post on {platform} in 2 minutes</h2>
        <a
          href={openUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("opened_platform", platform.toLowerCase(), null)}
          className="shrink-0 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-brand-ink"
        >
          Open {platform}
        </a>
      </div>
      <p className="mt-1 text-sm text-muted">Keep this screen open. Follow {platform}&apos;s screens and copy each value as you go.</p>
      <ol className="mt-3 flex flex-col gap-2">
        {steps.map((s, i) => (
          <li key={i} className={`rounded-2xl border p-3 ${done.has(i) ? "border-mint bg-mint/30" : "border-line"}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream-strong text-xs font-semibold">
                {done.has(i) ? "✓" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.title}</p>
                {s.hint && <p className="text-sm text-muted">{s.hint}</p>}
                {s.value && <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm">{s.value}</p>}
                {s.photos && (
                  <button
                    className="mt-2 rounded-xl bg-cream px-3 py-2 text-sm font-semibold"
                    onClick={async () => {
                      const files = await Promise.all(images.map((d, j) => dataUrlToFile(d, `${platform.toLowerCase()}-${j + 1}.jpg`)));
                      await shareFiles({ files });
                      mark(i);
                      onDone("exported", `${platform.toLowerCase()}_photos`);
                    }}
                  >
                    Save {images.length} photo{images.length === 1 ? "" : "s"}
                  </button>
                )}
              </div>
              {s.value && (
                <CopyButton
                  text={s.value}
                  onCopied={() => {
                    mark(i);
                    onDone("copied", `${platform.toLowerCase()}_${i}`);
                  }}
                />
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function FeedbackSheet({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const [thumbs, setThumbs] = useState<"up" | "down" | null>(null);
  const [where, setWhere] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const options = ["WhatsApp", "Instagram", "OLX", "Marketplace", "Other"];
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div className="mx-auto w-full max-w-md rounded-t-3xl bg-surface p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div className="py-6 text-center">
            <p className="text-2xl">🙏</p>
            <p className="mt-2 font-semibold">Thank you! This helps us a lot.</p>
            <Button className="mt-4 w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Did Sell It help?</h2>
            <div className="mt-3 flex gap-3">
              {(["up", "down"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setThumbs(t)}
                  className={`flex-1 rounded-2xl border py-3 text-3xl ${thumbs === t ? "border-brand bg-lavender/40" : "border-line"}`}
                >
                  {t === "up" ? "👍" : "👎"}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm font-medium">Where will you post it?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {options.map((o) => (
                <Chip
                  key={o}
                  active={where.includes(o)}
                  onClick={() => setWhere(where.includes(o) ? where.filter((w) => w !== o) : [...where, o])}
                >
                  {o}
                </Chip>
              ))}
            </div>
            <textarea
              className="mt-4 w-full rounded-xl border border-line px-3 py-2"
              rows={2}
              placeholder="Anything that didn't work or you'd want? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button
              className="mt-3 w-full"
              disabled={!thumbs}
              onClick={async () => {
                await fetch("/api/feedback", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    listingSlug: slug,
                    thumbs,
                    wherePosting: where,
                    comment,
                  }),
                });
                setSent(true);
              }}
            >
              Send feedback
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function PriceInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <label className="mt-3 flex items-center gap-2">
      <span className="whitespace-nowrap text-sm text-muted">Or type ₹</span>
      <input
        className="w-32 rounded-xl border border-line bg-surface px-3 py-2 text-lg font-medium"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || null)}
      />
      <span className="text-xs text-muted">Every post updates</span>
    </label>
  );
}

/** Homemade only: what it costs to make, so we never suggest a price below cost. */
function CostCalculator({ cost, floor, onChange }: { cost: Cost; floor: number | null; onChange: (c: Cost) => void }) {
  const field = (key: keyof Cost, label: string, placeholder: string) => (
    <label className="flex flex-1 flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <input
        className="w-full rounded-xl border border-line bg-surface px-3 py-2"
        inputMode="decimal"
        placeholder={placeholder}
        value={cost[key] || ""}
        onChange={(e) =>
          onChange({
            ...cost,
            [key]: Number(e.target.value.replace(/[^\d.]/g, "")) || 0,
          })
        }
      />
    </label>
  );
  return (
    <div className="mt-4 rounded-xl bg-cream p-3">
      <p className="text-sm font-semibold">What does one cost you to make?</p>
      <div className="mt-2 flex gap-2">
        {field("materials", "Materials ₹", "e.g. 200")}
        {field("hours", "Your time (hours)", "e.g. 2")}
      </div>
      <p className="mt-2 text-xs text-muted">
        {floor
          ? `Your cost plus a 30% margin: ₹${formatINR(floor)}. We won't suggest less than this.`
          : "Counts your time at ₹150/hour plus 20% for gas and packaging, then adds a 30% margin."}
      </p>
    </div>
  );
}
