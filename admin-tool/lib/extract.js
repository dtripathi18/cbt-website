// Extraction runs through Claude Code on this computer (`claude -p`), so it
// uses your Claude subscription login — no API key or API billing.
//
// Each run gets a work folder under admin-tool/staged/ holding everything
// Claude Code needs to read: each PDF page as text and as an image, candidate
// speaker photos cut out of the PDFs, any dropped text/photo files, and the
// current programme data. Claude Code is started in restricted mode with only
// the Read tool, confined to that folder, and must answer in a fixed JSON shape.
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as mupdf from "mupdf";
import { z } from "zod";
import { cleanup, flatten, nest, uniqueSpeakerId } from "../public/programme-core.js";
import { STAGED_DIR } from "./config.js";

const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "opus";
const TIMEOUT_MS = 20 * 60 * 1000;

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const TEXT_EXTS = [".txt", ".md", ".csv", ".json", ".html", ".htm"];

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

const RULES = `You maintain the programme data for the CBT Course Series website (Centre of Excellence for Biopharmaceutical Technology, IIT Delhi). You are given documents about the programme (usually a course brochure; sometimes notes, bios or photos) together with the website's CURRENT programme data, and you return the complete UPDATED programme data.

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
- photo: the label of the candidate photo that shows this person (e.g. "img-4"), using the text printed next to each photo and the page images. Only assign when you are confident; otherwise "". Logos are never speaker photos.

Complete vs partial documents:
- complete_programme = true: the documents describe the whole programme. Drop modules and speakers that no longer appear.
- complete_programme = false: the documents are a partial update. Keep everything in the current data that the documents don't address, never remove modules or speakers, and only add presenters to a module's list.

notes: short, specific points the editor should check — conflicting details, likely typos in the source (e.g. a wrong year), things you skipped and why, uncertain photo matches. Empty if nothing needs attention.`;

export function claudeCodeVersion() {
  const r = spawnSync(CLAUDE_BIN, ["--version"], { encoding: "utf8", timeout: 20000 });
  return r.status === 0 ? r.stdout.trim() : "";
}

// Candidate speaker photos embedded in a PDF, each with the text printed to
// its right and just below it (bios put the name beside the photo, captions
// put it underneath) to help match photos to people.
function pdfPhotoCandidates(doc, fileName, photosDir, startIndex) {
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
        // The same logo repeated on every page is offered once.
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
        const file = `img-${n}${hasAlpha ? ".png" : ".jpg"}`;
        fs.writeFileSync(path.join(photosDir, file), bytes);
        candidates.push({
          label: `img-${n}`,
          file: `photos/${file}`,
          context: `from ${fileName}, page ${p + 1}` +
            (right ? `; text to its right: "${right.slice(0, 160)}"` : "") +
            (below ? `; text below it: "${below.slice(0, 120)}"` : ""),
        });
      },
    });
  }
  return candidates;
}

// Writes each page of a PDF as text and as a PNG so Claude Code can read it
// without a PDF renderer installed.
function writePdfPages(doc, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const pages = [];
  for (let p = 0; p < doc.countPages(); p++) {
    const page = doc.loadPage(p);
    const num = String(p + 1).padStart(2, "0");
    fs.writeFileSync(path.join(dir, `page-${num}.txt`), page.toStructuredText("preserve-whitespace").asText());
    const png = page.toPixmap(mupdf.Matrix.scale(1.5, 1.5), mupdf.ColorSpace.DeviceRGB, false, true).asPNG();
    fs.writeFileSync(path.join(dir, `page-${num}.png`), png);
    pages.push(num);
  }
  return pages;
}

const safeName = (name) => name.replace(/[^A-Za-z0-9._-]+/g, "_");

function prepareWorkFolder(files, extractBios, current) {
  const runId = `run-${Date.now().toString(36)}`;
  const runDir = path.join(STAGED_DIR, runId);
  const photosDir = path.join(runDir, "photos");
  fs.mkdirSync(photosDir, { recursive: true });

  const docLines = [];
  const candidates = [];

  files.forEach((f) => {
    const ext = path.extname(f.name).toLowerCase();
    const buffer = Buffer.from(f.data, "base64");
    if (ext === ".pdf") {
      const doc = mupdf.Document.openDocument(buffer, "application/pdf");
      const folder = safeName(path.basename(f.name, ext));
      const pages = writePdfPages(doc, path.join(runDir, folder));
      docLines.push(`- ${f.name} (${pages.length} pages): ${folder}/page-01.txt … ${folder}/page-${pages.at(-1)}.txt, with page images ${folder}/page-NN.png`);
      if (extractBios) candidates.push(...pdfPhotoCandidates(doc, f.name, photosDir, candidates.length));
    } else if (IMAGE_EXTS.includes(ext)) {
      const n = candidates.length + 1;
      const file = `img-${n}${ext === ".jpeg" ? ".jpg" : ext}`;
      fs.writeFileSync(path.join(photosDir, file), buffer);
      candidates.push({ label: `img-${n}`, file: `photos/${file}`, context: `uploaded photo "${f.name}"` });
    } else if (TEXT_EXTS.includes(ext)) {
      const file = `docs/${safeName(f.name)}`;
      fs.mkdirSync(path.join(runDir, "docs"), { recursive: true });
      fs.writeFileSync(path.join(runDir, file), buffer);
      docLines.push(`- ${f.name}: ${file}`);
    } else {
      throw new Error(`${f.name}: unsupported file type. Use PDF, JPG/PNG/WebP images, or text files (export Word documents as PDF).`);
    }
  });

  fs.writeFileSync(
    path.join(runDir, "current-programme.json"),
    JSON.stringify(
      {
        days: current.days,
        modules: current.modules.map((m) => ({ code: m.code, title: m.title, venue: m.venue, day: m.day, speaker_ids: m.speakers })),
        speakers: current.speakers.map((s) => ({
          id: s.id,
          name: s.name,
          affiliation: s.affiliation,
          has_photo: Boolean(s.image),
          description: s.description,
        })),
      },
      null,
      1
    )
  );

  return { runId, runDir, docLines, candidates };
}

function runClaudeCode(prompt, cwd) {
  // Claude Code's validator doesn't know zod's draft-2020-12 `$schema` tag.
  const { $schema: _draft, ...jsonSchema } = z.toJSONSchema(ExtractionSchema);
  const schema = JSON.stringify(jsonSchema);
  const args = [
    "-p",
    "--output-format", "json",
    "--json-schema", schema,
    "--model", CLAUDE_MODEL,
    // Read-only and confined to the work folder: no shell, no web, no edits.
    "--restricted",
    "--tools", "Read",
    "--permission-mode", "dontAsk",
    "--no-session-persistence",
  ];
  // Never let an API key in the environment switch Claude Code from the
  // subscription login to pay-per-use API billing.
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;

  return new Promise((resolve, reject) => {
    const child = spawn(CLAUDE_BIN, args, { cwd, env });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Claude Code took longer than 20 minutes and was stopped. Try fewer documents at once."));
    }, TIMEOUT_MS);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(new Error(`Couldn't start Claude Code (${e.message}). Is it installed and on PATH? Set CLAUDE_BIN in the admin .env if it lives elsewhere.`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      let result;
      try {
        result = JSON.parse(out);
      } catch {
        return reject(new Error(`Claude Code exited with code ${code} without a result.${err ? `\n${err.slice(0, 600)}` : ""}${out ? `\n${out.slice(0, 600)}` : ""}`));
      }
      if (result.is_error || result.subtype !== "success") {
        return reject(new Error(`Claude Code reported an error: ${result.result || result.subtype || "unknown"}. If it says you're not logged in, run \`claude\` once in a terminal and log in with your subscription.`));
      }
      resolve(result);
    });
    child.stdin.end(prompt);
  });
}

function nameIsIgnored(name, ignoreNames) {
  const words = name.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return ignoreNames.some((n) => words.includes(n.toLowerCase()));
}

// Turns Claude's answer into programme data, enforcing the rules in code
// rather than trusting the model: unknown ids dropped, blank bio/photo keep
// the current value, partial updates never remove anything, ignored names
// never get in.
function mergeProposal(current, raw, { completeProgramme, candidatesByLabel, ignoreNames, runId }) {
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
      if (cand) image = `staged:${runId}/${cand.file}`;
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

export async function extractProgramme({ files, currentNested, completeProgramme, extractBios, ignoreNames }) {
  if (!files.length) throw new Error("Drop at least one document first.");
  const current = flatten(currentNested);
  const { runId, runDir, docLines, candidates } = prepareWorkFolder(files, extractBios, current);

  const prompt = [
    RULES,
    "",
    "Everything you need is in the current directory:",
    ...docLines,
    "- current-programme.json: the CURRENT programme data (read it first).",
    candidates.length
      ? `- Candidate speaker photos (use the label in a speaker's "photo" field):\n${candidates.map((c) => `  - ${c.label}: ${c.file} — ${c.context}`).join("\n")}`
      : "- No candidate photos.",
    "",
    `complete_programme: ${completeProgramme}`,
    `extract_bios: ${extractBios}`,
    `ignore list (first names to leave out): ${JSON.stringify(ignoreNames)}`,
    "",
    "Read every page's text file. Look at a page image when the text order is unclear (e.g. which session or speaker belongs to which module). Open candidate photos only when you need to confirm who they show.",
    "Then return the complete updated programme data.",
  ].join("\n");

  const result = await runClaudeCode(prompt, runDir);
  const parsed = ExtractionSchema.safeParse(result.structured_output);
  if (!parsed.success) throw new Error("Claude Code's answer wasn't valid programme data. Try again.");

  const candidatesByLabel = new Map(candidates.map((c) => [c.label, c]));
  const { flat, notes } = mergeProposal(current, parsed.data, { completeProgramme, candidatesByLabel, ignoreNames, runId });

  return {
    proposed: nest(flat),
    notes,
    photosFound: candidates.length,
    run: { seconds: Math.round((result.duration_ms || 0) / 1000), turns: result.num_turns },
  };
}

// Work folders from earlier runs are only needed until their photos are
// saved; clear ones older than a week.
export function pruneOldRuns() {
  if (!fs.existsSync(STAGED_DIR)) return;
  const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
  fs.readdirSync(STAGED_DIR).forEach((name) => {
    const p = path.join(STAGED_DIR, name);
    if (fs.statSync(p).mtimeMs < cutoff) fs.rmSync(p, { recursive: true, force: true });
  });
}
