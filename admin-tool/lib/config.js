import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const TOOL_DIR = path.resolve(here, "..");
export const REPO_DIR = path.resolve(TOOL_DIR, "..");
export const SITE_DIR = path.join(REPO_DIR, "course-series");
export const DATA_FILE = path.join(SITE_DIR, "js", "programme-data.js");
export const SPEAKER_IMAGE_DIR = path.join(SITE_DIR, "assets", "images", "speakers");
// Pages whose `js/programme-data.js?v=…` cache-buster is bumped on each save.
export const PAGES_LOADING_DATA = ["index.html", "register.html", "thank-you.html"];

export const STAGED_DIR = path.join(TOOL_DIR, "staged");
export const BACKUP_DIR = path.join(TOOL_DIR, "backups");
export const SETTINGS_FILE = path.join(TOOL_DIR, "settings.json");

// Secrets (the SSH login) live outside the website folder so they can
// never be uploaded along with the site by accident.
export const ENV_FILE = process.env.CBT_ADMIN_ENV || path.join(os.homedir(), ".cbt-admin", ".env");

export function loadEnv() {
  if (fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
  return {
    port: Number(process.env.PORT || 5178),
    ssh: {
      host: process.env.SSH_HOST || "",
      port: Number(process.env.SSH_PORT || 22),
      username: process.env.SSH_USERNAME || "",
      password: process.env.SSH_PASSWORD || "",
      privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH || "",
      remoteRoot: (process.env.SSH_REMOTE_ROOT || "/var/www/cbt/https/html").replace(/\/+$/, ""),
    },
  };
}

export function sshConfigured(ssh) {
  return Boolean(ssh.host && ssh.username && (ssh.password || ssh.privateKeyPath));
}

const DEFAULT_SETTINGS = { ignoreNames: [] };

export function readSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8")) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(settings) {
  const ignoreNames = [...new Set((settings.ignoreNames || []).map((n) => String(n).trim()).filter(Boolean))];
  const next = { ...readSettings(), ignoreNames };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2) + "\n");
  return next;
}
