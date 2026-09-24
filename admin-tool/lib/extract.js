import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as mupdf from "mupdf";
import { z } from "zod";
import { cleanup, flatten, nest, uniqueSpeakerId } from "../public/programme-core.js";
import { STAGED_DIR } from "./config.js";

const MODEL = "claude-opus-5";

const IMAGE_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};
const TEXT_TYPES = [".txt", ".md", ".csv", ".json", ".html", ".htm"];

const ExtractionSchema = z.object({
  days: z.array(z.object({ label: z.string(), date: z.string() })),
  modules: z.array(
    z.object({
      code: z.string(),
      title: z.string(),
      venue: z.string(),
      day: z.string(),
      speaker_ids: z.array(z.string()),
    })
  ),
  speakers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      affiliation: z.string(),
      description: z.string(),
      photo: z.string(),
    })
  ),
  notes: z.array(z.string()),
});

const SYSTEM_PROMPT = `You maintain the programme data for the CBT Course Series website (Centre of Excellence for Biopharmaceutical Technology, IIT Delhi). You receive documents about the programme (usually a course brochure PDF; sometimes notes, bios or photos) together with the website's CURRENT programme data, and you return the complete UPDATED programme data.

What the data holds:
- days: label ("Day 1") and date ("December 8, 2026").
- modules: code ("M1"), title, venue (room, e.g. "LHC 408"), day (must equal one of the day labels), speaker_ids (the module's presenters, in the order they first present).
- speakers: id, name, affiliation, description (bio), photo.

How to read the documents:
- Module titles, dates and venues come from each module's own page/section.
- A module's speakers are the people named as presenters in its outline — typically "Session title (Name, Affiliation)". Leave out placeholders ("IPC Speaker", "Sponsor Talk", "TBA"), company-only entries ("Sartorius Talk (Sartorius)", "Industry Demo (Merck)"), and anyone whose first name is on the ignore list. Panel discussions only list people who also present elsewhere; don't add anyone from a panel alone.
- Someone is a speaker only if they present in at least one module. A bios section (e.g. "Our Speakers") can include people who aren't presenting this year — never add them; use bios only to fill in the description of people who are presenting.
- Names in natural order ("Anurag S. Rathore"), with normal capitalisation even if the source is all caps. Affiliation is the organisation, plus the country when given ("Cytiva, Sweden"). If the same person appears with different affiliations, choose the most specific one and mention it in notes.
- Reuse the existing id for anyone already in the current data — match names allowing for initials, short forms ("Ravi"/"Ravindra") and spelling variants. New people get a lowercase kebab-case id from their name ("prasun-kumar-guha").
- description: when extract_bios is true and the documents contain the person's bio, the bio text cleaned up (join broken lines, undo hyphenation, keep it in third person, no heading). Otherwise "".
- photo: the label of the candidate image that shows this person (e.g. "img-4"), using the text printed next to each image and the pages themselves. Only assign when you are confident; otherwise "". Logos are never speaker photos.

Complete vs partial documents:
- complete_programme = true: the documents describe the whole programme. Drop modules and speakers that no longer appear.
- complete_programme = false: the documents are a partial update. Keep everything in the current data that the documents don't address, never remove modules or speakers, and only add presenters to a module's list.

notes: short, specific points the editor should check — conflicting details, likely typos in the source (e.g. a wrong year), things you skipped and why, uncertain photo matches. Empty if nothing needs attention.`;

function stagedName(runId, n, ext) {
  return `${runId}-img-${n}${ext}`;
}

// Embedded images from a PDF that could be speaker photos, each with the text
// printed to its right and just below it (bios put the name beside the
// photo, captions put it underneath) to help match photos to people.
function pdfPhotoCandidates(buffer, fileName, runId, startIndex) {
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  const seen = new Set();
  const candidates = [];

  for (let p = 0; p < doc.countPages(); p++) {
    const page = doc.loadPage(p);
    const [px0, py0, px1, py1] = page.getBounds();
    const pageArea = (px1 - px0) * (py1 - py0);

    const lines = [];
    JSON.parse(page.toStructuredText("preserve-whitespace").asJSON()).blocks.forEach((b) => {
      if (b.type !== "text") return;
      b.lines.forEach((l) => {
        const text = l.text.replace(/\s+/g, " ").trim();
        if (text) lines.push({ x: l.bbox.x, y: l.bbox.y, w: l.bbox.w, h: l.bbox.h, text });
      });
    });

    page.toStructuredText("preserve-images").walk({
      onImageBlock(bbox, _transform, image) {
        const [x0, y0, x1, y1] = bbox;
        const w = x1 - x0;
        const h = y1 - y0;
        // Skip page backgrounds, tiny decorations and wide banners/logos.
        if (w * h > pageArea * 0.3 || w < 30 || h < 30) return;
        const ratio = w / h;
        if (ratio > 1.8 || ratio < 0.45) return;

        let pixmap = image.toPixmap();
        const cs = pixmap.getColorSpace();
        if (cs && !cs.isRGB() && !cs.isGray()) pixmap = pixmap.convertToColorSpace(mupdf.ColorSpace.DeviceRGB);
        const hasAlpha = Boolean(pixmap.getAlpha());
        const bytes = hasAlpha ? pixmap.asPNG() : pixmap.asJPEG(88);
        // The same logo repeated on every page is sent once.
        const hash = crypto.createHash("sha1").update(bytes).digest("hex");
        if (seen.has(hash)) return;
        seen.add(hash);

        const right = lines
          .filter((l) => l.x >= x1 - 4 && l.y + l.h > y0 - 4 && l.y < y1 + 4)
          .sort((a, b) => a.y - b.y || a.x - b.x)
          .slice(0, 2)
          .map((l) => l.text)
          .join(" ");
        const below = lines
          .filter((l) => l.y >= y1 - 2 && l.y < y1 + 40 && l.x < x1 + 20 && l.x + l.w > x0 - 20)
          .sort((a, b) => a.y - b.y)
          .slice(0, 2)
          .map((l) => l.text)
          .join(" ");

        const n = startIndex + candidates.length + 1;
        const ext = hasAlpha ? ".png" : ".jpg";
        const file = stagedName(runId, n, ext);
        fs.writeFileSync(path.join(STAGED_DIR, file), bytes);
        candidates.push({
          label: `img-${n}`,
          file,
          mediaType: hasAlpha ? "image/png" : "image/jpeg",
          data: Buffer.from(bytes).toString("base64"),
          context: `from ${fileName}, page ${p + 1}` +
            (right ? `; text to its right: "${right.slice(0, 160)}"` : "") +
            (below ? `; text below it: "${below.slice(0, 120)}"` : ""),
        });
      },
    });
  }
  return candidates;
}

function nameIsIgnored(name, ignoreNames) {
  const words = name.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return ignoreNames.some((n) => words.includes(n.toLowerCase()));
}

// Turns Claude's answer into programme data, enforcing the rules in code
// rather than trusting the model: unknown ids dropped, blank bio/photo keep
// the current value, partial updates never remove anything, ignored names
// never get in.
function mergeProposal(current, raw, { completeProgramme, candidatesByLabel, ignoreNames }) {
  const notes = [...raw.notes];
  const curSpeakers = new Map(current.speakers.map((s) => [s.id, s]));

  const speakers = [];
  raw.speakers.forEach((s) => {
    const name = s.name.trim();
    if (!name) return;
    if (nameIsIgnored(name, ignoreNames)) {
      notes.push(`Skipped ${name} (on the ignore list).`);
      return;
    }
    let id = s.id.trim() || uniqueSpeakerId(name, speakers);
    if (speakers.some((x) => x.id === id)) id = uniqueSpeakerId(name, speakers);
    const prev = curSpeakers.get(id);
    const photo = s.photo.trim();
    let image = prev ? prev.image : "";
    if (photo) {
      const cand = candidatesByLabel.get(photo);
      if (cand) image = `staged:${cand.file}`;
      else notes.push(`Claude matched ${name} to photo "${photo}", which doesn't exist — photo left unchanged.`);
    }
    speakers.push({
      id,
      name,
      affiliation: s.affiliation.trim(),
      image,
      description: s.description.trim() || (prev ? prev.description : ""),
    });
  });

  const dayLabels = new Set(raw.days.map((d) => d.label));
  const modules = raw.modules.map((m) => {
    if (!dayLabels.has(m.day)) notes.push(`${m.code} is on "${m.day}", which isn't one of the extracted days.`);
    return {
      code: m.code.trim().toUpperCase(),
      title: m.title.trim(),
      venue: m.venue.trim(),
      day: m.day.trim(),
      speakers: m.speaker_ids.map((id) => id.trim()),
    };
  });

  let flat = { days: raw.days.map((d) => ({ label: d.label.trim(), date: d.date.trim() })), modules, speakers };

  if (!completeProgramme) {
    current.days.forEach((d) => {
      if (!flat.days.some((x) => x.label === d.label)) flat.days.push({ ...d });
    });
    current.speakers.forEach((s) => {
      if (!flat.speakers.some((x) => x.id === s.id)) flat.speakers.push({ ...s });
    });
    current.modules.forEach((m) => {
      const next = flat.modules.find((x) => x.code === m.code);
      if (!next) flat.modules.push({ ...m, speakers: [...m.speakers] });
      else next.speakers = [...new Set([...m.speakers, ...next.speakers])];
    });
  }

  const ids = new Set(flat.speakers.map((s) => s.id));
  flat.modules.forEach((m) => {
    m.speakers.filter((id) => !ids.has(id)).forEach((id) => notes.push(`${m.code} listed unknown speaker id "${id}" — dropped.`));
  });
  flat = cleanup(flat);

  if (completeProgramme) {
    const used = new Set(flat.modules.flatMap((m) => m.speakers));
    flat.speakers = flat.speakers.filter((s) => {
      if (used.has(s.id)) return true;
      notes.push(`Dropped ${s.name}: not presenting in any module.`);
      return false;
    });
  }

  return { flat, notes };
}

export async function extractProgramme({ apiKey, workspaceId, files, currentNested, completeProgramme, extractBios, ignoreNames }) {
  if (!apiKey) throw new Error("No Anthropic API key configured (ANTHROPIC_API_KEY in the admin .env file).");
  if (!files.length) throw new Error("Drop at least one document first.");
  fs.mkdirSync(STAGED_DIR, { recursive: true });

  const runId = Date.now().toString(36);
  const docBlocks = [];
  const candidates = [];

  for (const f of files) {
    const ext = path.extname(f.name).toLowerCase();
    const buffer = Buffer.from(f.data, "base64");
    if (ext === ".pdf") {
      docBlocks.push({ type: "text", text: `Document: ${f.name}` });
      docBlocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data } });
      if (extractBios) candidates.push(...pdfPhotoCandidates(buffer, f.name, runId, candidates.length));
    } else if (IMAGE_TYPES[ext]) {
      const n = candidates.length + 1;
      const file = stagedName(runId, n, ext === ".jpeg" ? ".jpg" : ext);
      fs.writeFileSync(path.join(STAGED_DIR, file), buffer);
      candidates.push({ label: `img-${n}`, file, mediaType: IMAGE_TYPES[ext], data: f.data, context: `uploaded file "${f.name}"` });
    } else if (TEXT_TYPES.includes(ext)) {
      docBlocks.push({ type: "text", text: `Document: ${f.name}\n\n${buffer.toString("utf8")}` });
    } else {
      throw new Error(`${f.name}: unsupported file type. Use PDF, JPG/PNG/WebP images, or text files (export Word documents as PDF).`);
    }
  }

  const current = flatten(currentNested);
  const currentForPrompt = {
    days: current.days,
    modules: current.modules.map((m) => ({ code: m.code, title: m.title, venue: m.venue, day: m.day, speaker_ids: m.speakers })),
    speakers: current.speakers.map((s) => ({
      id: s.id,
      name: s.name,
      affiliation: s.affiliation,
      has_photo: Boolean(s.image),
      description: s.description,
    })),
  };

  const content = [...docBlocks];
  if (candidates.length) {
    content.push({ type: "text", text: `Candidate photos (${candidates.length}). Each is labelled; use the label in a speaker's "photo" field.` });
    candidates.forEach((c) => {
      content.push({ type: "text", text: `${c.label} — ${c.context}` });
      content.push({ type: "image", source: { type: "base64", media_type: c.mediaType, data: c.data } });
    });
  }
  content.push({
    type: "text",
    text: [
      `complete_programme: ${completeProgramme}`,
      `extract_bios: ${extractBios}`,
      `ignore list (first names to leave out): ${JSON.stringify(ignoreNames)}`,
      "",
      "CURRENT programme data:",
      JSON.stringify(currentForPrompt, null, 1),
      "",
      "Return the complete updated programme data.",
    ].join("\n"),
  });

  const client = new Anthropic({
    apiKey,
    ...(workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : {}),
  });
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: betaZodOutputFormat(ExtractionSchema) },
    // Server-side refusal fallback: if the model declines, the API retries on
    // Anthropic's recommended fallback model within the same call.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });
  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error(`Claude declined to process these documents${message.stop_details?.explanation ? `: ${message.stop_details.explanation}` : "."}`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("Claude's answer was cut off (too long). Try fewer documents at once.");
  }
  const raw = message.parsed_output;
  if (!raw) throw new Error("Claude's answer couldn't be read as programme data. Try again.");

  const candidatesByLabel = new Map(candidates.map((c) => [c.label, c]));
  const { flat, notes } = mergeProposal(current, raw, { completeProgramme, candidatesByLabel, ignoreNames });

  return {
    proposed: nest(flat),
    notes,
    photosFound: candidates.length,
    usage: { input_tokens: message.usage.input_tokens, output_tokens: message.usage.output_tokens },
  };
}
