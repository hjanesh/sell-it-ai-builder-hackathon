"use client";

import { useRef, useState } from "react";
import type { DetectResult, Language, ListingType, PacksResult, PriceResult } from "@/lib/schemas";
import { compose, enhance, fileToBitmap, toDataUrl, dataUrlToBitmap } from "@/lib/images";
import { Button, Card, Chip, Spinner } from "./ui";
import { authEnabled, displayName, signInWithGoogle, useSession } from "@/lib/auth";
import Results, { type Studio } from "./Results";
import VoiceNote from "./VoiceNote";

type Step = "capture" | "detecting" | "questions" | "results";
type Availability = "one_off" | "weekly_batches" | "by_request";
export type Seller = { name: string; whatsapp: string };

const TYPE_LABEL: Record<ListingType, string> = { pre_owned: "Pre-owned", new: "New / unused", homemade: "Homemade" };
const LANG_LABEL: Record<Language, string> = { en: "English", hinglish: "Hinglish", hi: "हिंदी", mr: "मराठी", ta: "தமிழ்" };
const AVAIL_LABEL: Record<Availability, string> = { one_off: "One-off", weekly_batches: "Weekly batches", by_request: "By request" };

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

function loadSeller(): Seller {
  try {
    return JSON.parse(localStorage.getItem("sellit.seller") || "") as Seller;
  } catch {
    return { name: "", whatsapp: "" };
  }
}

export default function Flow() {
  const [step, setStep] = useState<Step>("capture");
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [detect, setDetect] = useState<DetectResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [seller, setSeller] = useState<Seller>({ name: "", whatsapp: "" });
  const [price, setPrice] = useState<PriceResult | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [packs, setPacks] = useState<PacksResult | null>(null);
  const [packsError, setPacksError] = useState<string | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const session = useSession();

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const next = await Promise.all(
      Array.from(files)
        .slice(0, 6 - photos.length)
        .map(async (f) => toDataUrl(await fileToBitmap(f))),
    );
    const all = [...photos, ...next].slice(0, 6);
    setPhotos(all);
    // Seller added a photo on the questions screen: redo the studio set.
    if (detect) void buildStudio(all, detect.itemBox);
  }

  async function runDetect() {
    setError(null);
    setStep("detecting");
    try {
      const d = await postJSON<DetectResult>("/api/detect", { images: photos, caption });
      setDetect(d);
      setAnswers(Object.fromEntries(d.questions.filter((q) => q.prefilled).map((q) => [q.id, q.prefilled!])));
      setAvailability(d.listingType === "homemade" ? "weekly_batches" : null);
      const saved = loadSeller();
      setSeller({ name: saved.name || displayName(session), whatsapp: saved.whatsapp });
      // Photo studio runs in the background while the seller answers questions.
      void buildStudio(photos, d.itemBox);
      setStep("questions");
    } catch (e) {
      setError((e as Error).message);
      setStep("capture");
    }
  }

  async function buildStudio(list: string[], box: DetectResult["itemBox"]) {
    const enhanced = await Promise.all(list.map(async (p) => enhance(await dataUrlToBitmap(p))));
    const boxFor = (i: number) => (i === 0 ? box : undefined);
    setStudio({
      original: list[0],
      square: enhanced.map((c, i) => compose(c, "square", boxFor(i))),
      olx: enhanced.map((c, i) => compose(c, "olx", boxFor(i))),
      feed: enhanced.map((c, i) => compose(c, "feed", boxFor(i))),
      storyBase: enhanced[0],
      storyBox: box,
    });
  }

  function generate(lang: Language = language) {
    if (!detect) return;
    localStorage.setItem("sellit.seller", JSON.stringify(seller));
    const location = answers.location ?? "";
    const ctx = { detect, caption, answers, availability, location };
    setStep("results");
    setPacks(null);
    setPacksError(null);
    postJSON<PacksResult>("/api/packs", { ...ctx, language: lang }).then(setPacks, (e) => setPacksError(e.message));
    if (!price) {
      setPriceError(null);
      postJSON<PriceResult>("/api/price", ctx).then(setPrice, (e) => setPriceError(e.message));
    }
  }

  function reset() {
    setStep("capture");
    setPhotos([]);
    setCaption("");
    setDetect(null);
    setAnswers({});
    setPrice(null);
    setPacks(null);
    setStudio(null);
    setError(null);
  }

  const sellerValid = seller.name.trim().length > 0 && seller.whatsapp.replace(/\D/g, "").length >= 10;

  // Everyone signs in first (Google), so every listing lands in the seller's account.
  if (authEnabled() && step === "capture" && photos.length === 0) {
    if (session === undefined) return <Spinner label="Loading…" />;
    if (session === null) return <SignIn />;
  }

  if (step === "detecting") return <Spinner label="Looking at your photos…" />;

  if (step === "results" && detect) {
    return (
      <Results
        detect={detect}
        answers={answers}
        availability={availability}
        language={language}
        seller={seller}
        studio={studio}
        price={price}
        priceError={priceError}
        packs={packs}
        packsError={packsError}
        onLanguage={(l) => {
          setLanguage(l);
          generate(l);
        }}
        onRetry={() => generate()}
        onNew={reset}
      />
    );
  }

  if (step === "questions" && detect) {
    return (
      <div className="flex flex-col gap-4 pb-28">
        <Card>
          <p className="text-sm text-muted">We think you&apos;re selling</p>
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-lg font-semibold"
            value={detect.title}
            onChange={(e) => setDetect({ ...detect, title: e.target.value })}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(TYPE_LABEL) as ListingType[]).map((t) => (
              <Chip
                key={t}
                active={detect.listingType === t}
                onClick={() => {
                  setDetect({ ...detect, listingType: t });
                  if (t === "homemade" && !availability) setAvailability("weekly_batches");
                }}
              >
                {TYPE_LABEL[t]}
              </Chip>
            ))}
          </div>
          {detect.missingEvidence.length > 0 && (
            <div className="mt-4 rounded-2xl bg-peach/40 p-3 text-sm text-foreground">
              <p className="font-semibold">Buyers trust listings more with:</p>
              <ul className="mt-1 list-disc pl-5">
                {detect.missingEvidence.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
              {photos.length < 6 && (
                <button className="mt-2 font-semibold text-brand" onClick={() => fileInput.current?.click()}>
                  + Add a photo
                </button>
              )}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">A few quick questions</h2>
          <p className="text-sm text-muted">All optional. Skip anything you don&apos;t know.</p>
          <div className="mt-4 flex flex-col gap-5">
            {detect.questions.map((q) => (
              <div key={q.id}>
                <label className="font-medium">
                  {q.label}
                  {isMulti(q) && q.options.length > 0 && <span className="ml-2 text-sm font-normal text-muted">Pick all that apply</span>}
                </label>
                {(q.kind === "chips" || q.kind === "multi") && q.options.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.options.map((o, i) => (
                      <Chip
                        key={i}
                        active={isMulti(q) ? splitMulti(answers[q.id]).includes(o) : answers[q.id] === o}
                        onClick={() => setAnswers({ ...answers, [q.id]: isMulti(q) ? toggleMulti(answers[q.id], o) : answers[q.id] === o ? "" : o })}
                      >
                        {o}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <input
                    className="mt-2 w-full rounded-xl border border-line px-3 py-2"
                    inputMode={q.kind === "number" ? "numeric" : "text"}
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                )}
              </div>
            ))}
            {detect.listingType === "homemade" && (
              <div>
                <label className="font-medium">How do you take orders?</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(AVAIL_LABEL) as Availability[]).map((a) => (
                    <Chip key={a} active={availability === a} onClick={() => setAvailability(a)}>
                      {AVAIL_LABEL[a]}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="font-medium">Language for WhatsApp &amp; Instagram</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(LANG_LABEL) as Language[]).map((l) => (
                  <Chip key={l} active={language === l} onClick={() => setLanguage(l)}>
                    {LANG_LABEL[l]}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Where should buyers reach you?</h2>
          <p className="text-sm text-muted">Shown on your listing page. We never spam.</p>
          <div className="mt-3 flex flex-col gap-3">
            <input
              className="w-full rounded-xl border border-line px-3 py-2"
              placeholder="Your name"
              autoComplete="name"
              value={seller.name}
              onChange={(e) => setSeller({ ...seller, name: e.target.value })}
            />
            <input
              className="w-full rounded-xl border border-line px-3 py-2"
              placeholder="WhatsApp number"
              inputMode="tel"
              autoComplete="tel"
              value={seller.whatsapp}
              onChange={(e) => setSeller({ ...seller, whatsapp: e.target.value })}
            />
          </div>
        </Card>

        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-background/95 p-4 backdrop-blur">
          <div className="mx-auto max-w-md">
            <Button className="w-full" disabled={!sellerValid} onClick={() => generate()}>
              {sellerValid ? "Make my listing ✨" : "Add your name & WhatsApp to continue"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // capture
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="display-md balance">What are you selling?</h1>
        <p className="mt-1 text-muted">Snap a photo. Add a line about it. We&apos;ll do the rest.</p>
      </div>
      {error && <p className="rounded-2xl bg-error/10 p-3 text-sm text-error">{error}</p>}
      <Card className="p-3">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-line px-3 py-7 text-center">
            <span className="text-5xl">📷</span>
            <span className="text-sm text-muted">Up to 6 photos. The first one is the cover.</span>
            <div className="grid w-full grid-cols-2 gap-2">
              <Button onClick={() => cameraInput.current?.click()}>📷 Camera</Button>
              <Button variant="secondary" onClick={() => fileInput.current?.click()}>
                🖼 Gallery
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="aspect-square w-full rounded-xl object-cover" />
                <button
                  className="absolute right-1 top-1 h-7 w-7 rounded-full bg-black/60 text-sm text-white"
                  onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <div className="flex aspect-square flex-col gap-1">
                <button className="flex-1 rounded-xl border-2 border-dashed border-line text-sm font-semibold" onClick={() => cameraInput.current?.click()}>
                  📷 Camera
                </button>
                <button className="flex-1 rounded-xl border-2 border-dashed border-line text-sm font-semibold" onClick={() => fileInput.current?.click()}>
                  🖼 Gallery
                </button>
              </div>
            )}
          </div>
        )}
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => addFiles(e.target.files)} />
      </Card>
      <Card>
        <label className="font-medium">Tell us about it (optional)</label>
        <textarea
          className="mt-2 w-full rounded-xl border border-line px-3 py-2"
          rows={3}
          placeholder="e.g. iPhone 12, 2 years old, small scratch on back, have the box. Or: fresh dosa batter, 1 L, Koramangala, every Tuesday"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <VoiceNote
          onText={(text, lang) => {
            setCaption((c) => (c ? `${c}\n${text}` : text));
            if (lang) setLanguage(lang);
          }}
        />
      </Card>
      <Button disabled={photos.length === 0} onClick={runDetect}>
        Next →
      </Button>
    </div>
  );
}

// "What comes with it / issues / features" questions allow several answers even if the AI marked them single-choice.
function isMulti(q: { kind: string; label: string }): boolean {
  return q.kind === "multi" || /(comes with|come with|included|include|what else|accessor|have with it|issues|defects|features)/i.test(q.label);
}

// Multi-select answers are stored as one comma-separated string, so prompts and listings read them as text.
function splitMulti(v: string | undefined): string[] {
  return (v ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}
function toggleMulti(v: string | undefined, option: string): string {
  const set = splitMulti(v);
  return (set.includes(option) ? set.filter((x) => x !== option) : [...set, option]).join(", ");
}

function SignIn() {
  return (
    <div className="flex flex-col gap-6 pt-6">
      <div>
        <p className="caption-up text-muted">Welcome</p>
        <h1 className="display-md mt-3 balance">Your listings, in one place.</h1>
        <p className="body-md mt-4 text-body pretty">
          Sign in once. Every listing you make is saved to your account, each with its own link to share.
        </p>
      </div>
      <Button className="w-full" onClick={() => signInWithGoogle("/new")}>
        <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
          />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        Continue with Google
      </Button>
      <p className="text-center text-sm text-muted">Free. We only use your name and email to keep your listings together.</p>
    </div>
  );
}
