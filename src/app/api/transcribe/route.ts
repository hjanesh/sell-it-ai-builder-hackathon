// Voice note → text with ElevenLabs Scribe (speech-to-text, Indian languages included).
// The client caps recordings at 60 s; we also cap the upload size so one request can't burn credits.

export const maxDuration = 60;

const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return Response.json({ error: "Voice notes aren't set up yet. Type it instead." }, { status: 503 });
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob) || audio.size === 0) return Response.json({ error: "No audio received" }, { status: 400 });
    if (audio.size > MAX_BYTES) return Response.json({ error: "Voice note is too long. Keep it under a minute." }, { status: 413 });

    const body = new FormData();
    body.append("model_id", "scribe_v2");
    body.append("tag_audio_events", "false");
    body.append("file", audio, "note.webm");
    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": key },
      body,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("ElevenLabs STT", res.status, json);
      return Response.json({ error: "Couldn't understand the voice note. Try again or type it." }, { status: 502 });
    }
    return Response.json({ text: String(json.text ?? "").trim(), languageCode: String(json.language_code ?? "") });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Couldn't process the voice note." }, { status: 500 });
  }
}
