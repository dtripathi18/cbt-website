import fs from "node:fs";
import path from "node:path";
import SftpClient from "ssh2-sftp-client";
import { BACKUP_DIR, PAGES_LOADING_DATA, SITE_DIR, sshConfigured } from "./config.js";
import { bumpDataVersion, localImagePath, parseDataText, versionStamp } from "./data-file.js";

async function connect(ssh) {
  if (!sshConfigured(ssh)) {
    throw new Error("SSH isn't configured — set SSH_HOST, SSH_USERNAME and SSH_PASSWORD or SSH_PRIVATE_KEY_PATH in the admin .env file.");
  }
  const sftp = new SftpClient();
  await sftp.connect({
    host: ssh.host,
    port: ssh.port,
    username: ssh.username,
    ...(ssh.privateKeyPath ? { privateKey: fs.readFileSync(ssh.privateKeyPath) } : { password: ssh.password }),
    readyTimeout: 20000,
  });
  return sftp;
}

const remoteSiteDir = (ssh) => `${ssh.remoteRoot}/course-series`;

async function withSftp(ssh, fn) {
  const sftp = await connect(ssh);
  try {
    return await fn(sftp);
  } finally {
    await sftp.end().catch(() => {});
  }
}

export async function pullRemoteData(ssh) {
  return withSftp(ssh, async (sftp) => {
    const remote = `${remoteSiteDir(ssh)}/js/programme-data.js`;
    if (!(await sftp.exists(remote))) {
      throw new Error(`${remote} doesn't exist on the server yet — post once to create it.`);
    }
    return parseDataText((await sftp.get(remote)).toString("utf8"));
  });
}

// Uploads the saved programme data and any speaker photos the server doesn't
// have (or has a different copy of), after backing up every remote file it
// overwrites into admin-tool/backups/<timestamp>/. The HTML pages are
// patched in place on the server (only the programme-data.js ?v= value
// changes) so unrelated local edits are never pushed.
export async function postToServer(ssh, { data, version }) {
  const stamp = versionStamp();
  const backupDir = path.join(BACKUP_DIR, stamp);
  const log = [];

  return withSftp(ssh, async (sftp) => {
    const site = remoteSiteDir(ssh);
    if (!(await sftp.exists(site))) throw new Error(`Remote folder ${site} not found — check SSH_REMOTE_ROOT.`);

    const backup = async (rel) => {
      const remote = `${site}/${rel}`;
      if (!(await sftp.exists(remote))) return false;
      const dest = path.join(backupDir, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      await sftp.get(remote, dest);
      return true;
    };

    // Speaker photos referenced by the data.
    const images = [...new Set(data.speakers.map((s) => s.image).filter(Boolean))];
    for (const image of images) {
      const local = localImagePath(image);
      if (!local || !fs.existsSync(local)) {
        log.push(`⚠ Skipped missing local photo ${image}`);
        continue;
      }
      const rel = path.relative(SITE_DIR, local).split(path.sep).join("/");
      const remote = `${site}/${rel}`;
      const stat = await sftp.stat(remote).catch(() => null);
      if (stat && stat.size === fs.statSync(local).size) continue;
      await sftp.mkdir(path.posix.dirname(remote), true).catch(() => {});
      if (stat) await backup(rel);
      await sftp.put(local, remote);
      log.push(`Uploaded ${rel}`);
    }

    await backup("js/programme-data.js");
    await sftp.put(path.join(SITE_DIR, "js", "programme-data.js"), `${site}/js/programme-data.js`);
    log.push("Uploaded js/programme-data.js");

    for (const page of PAGES_LOADING_DATA) {
      const remote = `${site}/${page}`;
      if (!(await sftp.exists(remote))) continue;
      const html = (await sftp.get(remote)).toString("utf8");
      if (!html.includes("js/programme-data.js")) {
        log.push(`⚠ ${page} on the server doesn't load js/programme-data.js yet — upload the updated site files once (see admin-tool/README.md).`);
        continue;
      }
      const next = bumpDataVersion(html, version);
      if (next === html) continue;
      await backup(page);
      await sftp.put(Buffer.from(next, "utf8"), remote);
      log.push(`Updated cache-buster in ${page}`);
    }

    if (fs.existsSync(backupDir)) log.push(`Backup of replaced server files: admin-tool/backups/${stamp}/`);
    return log;
  });
}
