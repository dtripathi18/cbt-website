// Local admin tool for the CBT Course Series programme data.
// Run with `npm start`, then open the printed URL. Listens on 127.0.0.1 only.
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { flatten, validate } from "./public/programme-core.js";
import {
  ENV_FILE,
  SITE_DIR,
  STAGED_DIR,
  TOOL_DIR,
  loadEnv,
  readSettings,
  sshConfigured,
  writeSettings,
} from "./lib/config.js";
import { readLocalData, saveLocalData } from "./lib/data-file.js";
import { postToServer, pullRemoteData } from "./lib/deploy.js";
import { claudeCodeVersion, extractProgramme, pruneOldRuns } from "./lib/extract.js";

const env = loadEnv();
fs.mkdirSync(STAGED_DIR, { recursive: true });
pruneOldRuns();
const claudeVersion = claudeCodeVersion();

const app = express();
app.use(express.json({ limit: "80mb" }));
app.use(express.static(path.join(TOOL_DIR, "public")));
// Site files (existing speaker photos) and not-yet-saved photos, for previews.
app.use("/site", express.static(SITE_DIR));
app.use("/staged", express.static(STAGED_DIR));

// Only this tool's own page may call the API: it sends a custom header,
// which a page on another site can't add to a request to localhost.
app.use("/api", (req, res, next) => {
  if (req.get("X-CBT-Admin") !== "1") return res.status(403).json({ error: "Forbidden" });
  next();
});

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
};

function assertValid(data) {
  const { errors } = validate(flatten(data));
  if (errors.length) throw new Error(`Fix these first:\n• ${errors.join("\n• ")}`);
}

app.get("/api/state", handle(() => ({
  data: readLocalData(),
  settings: readSettings(),
  env: {
    envFile: ENV_FILE,
    claudeCode: claudeVersion,
    sshConfigured: sshConfigured(env.ssh),
    sshTarget: env.ssh.host ? `${env.ssh.username}@${env.ssh.host}:${env.ssh.remoteRoot}` : "",
  },
})));

app.post("/api/settings", handle((req) => ({ settings: writeSettings(req.body) })));

app.post("/api/extract", handle(async (req) => {
  const { files = [], currentData, completeProgramme = false, extractBios = true } = req.body;
  return extractProgramme({
    files,
    currentNested: currentData || readLocalData(),
    completeProgramme: Boolean(completeProgramme),
    extractBios: Boolean(extractBios),
    ignoreNames: readSettings().ignoreNames,
  });
}));

const PHOTO_EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

app.post("/api/stage-photo", handle((req) => {
  const { type, data } = req.body;
  const ext = PHOTO_EXT[type];
  if (!ext) throw new Error("Photos must be JPG, PNG or WebP.");
  const file = `${Date.now().toString(36)}-upload${ext}`;
  fs.writeFileSync(path.join(STAGED_DIR, file), Buffer.from(data, "base64"));
  return { image: `staged:${file}` };
}));

app.post("/api/save", handle((req) => {
  assertValid(req.body.data);
  const { data, written } = saveLocalData(req.body.data);
  return { data, log: written.map((f) => `Saved course-series/${f}`) };
}));

app.post("/api/pull", handle(async () => ({ data: await pullRemoteData(env.ssh) })));

app.post("/api/post", handle(async (req) => {
  assertValid(req.body.data);
  const { data, version, written } = saveLocalData(req.body.data);
  const log = written.map((f) => `Saved course-series/${f}`);
  log.push(...(await postToServer(env.ssh, { data, version })));
  return { data, log };
}));

app.listen(env.port, "127.0.0.1", () => {
  console.log(`CBT programme admin running at http://localhost:${env.port}`);
  console.log(claudeVersion ? `Extraction via ${claudeVersion} (your Claude subscription)` : "⚠ Claude Code not found on PATH — extraction is disabled.");
  if (!sshConfigured(env.ssh)) console.log(`⚠ SSH not configured — Post is disabled until ${ENV_FILE} has the server login.`);
});
