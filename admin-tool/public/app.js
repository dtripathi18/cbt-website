import {
  applyChanges,
  cleanup,
  describeChange,
  diff,
  flatten,
  moduleNumber,
  nest,
  uniqueSpeakerId,
  validate,
} from "./programme-core.js";

// ---------- State ----------
const state = {
  saved: null,     // flat data as last loaded/saved locally — the baseline
  working: null,   // flat data being edited
  proposal: null,  // { changes, notes, selected: Set<key> } from Claude
  files: [],       // File objects dropped for extraction
  env: {},
  tab: "modules",
  speakerFilter: "",
};

const $ = (id) => document.getElementById(id);
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clone = (v) => JSON.parse(JSON.stringify(v));

async function api(path, body) {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", "X-CBT-Admin": "1" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const imageSrc = (image) =>
  !image ? "" : image.startsWith("staged:") ? `/staged/${image.slice(7)}` : `/site/${image}`;

const speakerName = (id, data = state.working) => data.speakers.find((s) => s.id === id)?.name || id;

function confirmDialog(title, bodyHTML, okLabel) {
  $("confirmTitle").textContent = title;
  $("confirmBody").innerHTML = bodyHTML;
  $("confirmOk").textContent = okLabel;
  const dlg = $("confirmDialog");
  dlg.returnValue = "";
  dlg.showModal();
  return new Promise((resolve) => dlg.addEventListener("close", () => resolve(dlg.returnValue === "ok"), { once: true }));
}

function showLog(title, lines) {
  $("logTitle").textContent = title;
  $("logList").innerHTML = lines.map((l) => `<li class="${l.startsWith("⚠") ? "warn" : ""}">${esc(l)}</li>`).join("");
  $("logDialog").showModal();
}

// ---------- Init ----------
async function init() {
  const { data, settings, env } = await api("/api/state");
  state.env = env;
  state.saved = flatten(data);
  state.working = clone(state.saved);
  $("ignoreNames").value = settings.ignoreNames.join(", ");

  $("apiChip").textContent = env.hasApiKey ? "Claude ✓" : "No API key";
  $("apiChip").className = `chip ${env.hasApiKey ? "ok" : "bad"}`;
  $("apiChip").title = env.hasApiKey ? "" : `Add ANTHROPIC_API_KEY to ${env.envFile}`;
  $("sshChip").textContent = env.sshConfigured ? "Server ✓" : "Server login missing";
  $("sshChip").className = `chip ${env.sshConfigured ? "ok" : "bad"}`;
  $("sshChip").title = env.sshConfigured ? env.sshTarget : `Add the SSH settings to ${env.envFile}`;
  $("pullBtn").disabled = !env.sshConfigured;

  renderFiles();
  renderEditor();
  renderBar();
}

// ---------- 1. Documents ----------
const dropzone = $("dropzone");
["dragenter", "dragover"].forEach((t) =>
  dropzone.addEventListener(t, (e) => { e.preventDefault(); dropzone.classList.add("over"); })
);
["dragleave", "drop"].forEach((t) =>
  dropzone.addEventListener(t, (e) => { e.preventDefault(); dropzone.classList.remove("over"); })
);
dropzone.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
$("fileInput").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
// Dropping a file anywhere else shouldn't navigate away from the tool.
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

function addFiles(list) {
  [...list].forEach((f) => {
    if (!state.files.some((x) => x.name === f.name && x.size === f.size)) state.files.push(f);
  });
  renderFiles();
}

function renderFiles() {
  const size = (n) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.ceil(n / 1e3)} KB`);
  $("fileList").innerHTML = state.files
    .map((f, i) => `<li>${esc(f.name)} <span class="size">${size(f.size)}</span><button class="icon-btn" data-remove-file="${i}" title="Remove">✕</button></li>`)
    .join("");
  $("extractBtn").disabled = !state.files.length || !state.env.hasApiKey;
}

$("fileList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove-file]");
  if (!btn) return;
  state.files.splice(Number(btn.dataset.removeFile), 1);
  renderFiles();
});

$("ignoreNames").addEventListener("change", async (e) => {
  const ignoreNames = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
  const { settings } = await api("/api/settings", { ignoreNames });
  e.target.value = settings.ignoreNames.join(", ");
});

$("extractBtn").addEventListener("click", async () => {
  const status = $("extractStatus");
  const btn = $("extractBtn");
  btn.disabled = true;
  status.className = "status";
  const started = Date.now();
  const tick = () => {
    status.innerHTML = `<span class="spinner"></span> Claude is reading ${state.files.length} file(s)… ${Math.round((Date.now() - started) / 1000)}s — a full brochure usually takes 1–3 minutes.`;
  };
  tick();
  const timer = setInterval(tick, 1000);
  try {
    const files = await Promise.all(state.files.map(async (f) => ({ name: f.name, type: f.type, data: await readAsBase64(f) })));
    const result = await api("/api/extract", {
      files,
      currentData: nest(state.working),
      completeProgramme: $("optComplete").checked,
      extractBios: $("optBios").checked,
    });
    const proposed = flatten(result.proposed);
    const changes = diff(state.working, proposed);
    state.proposal = { changes, notes: result.notes, proposed, selected: new Set(changes.map((c) => c.key)) };
    status.textContent = `Done in ${Math.round((Date.now() - started) / 1000)}s — ${changes.length} change(s) found` +
      (result.photosFound ? `, ${result.photosFound} candidate photo(s) checked` : "") +
      ` (${result.usage.input_tokens.toLocaleString()} input / ${result.usage.output_tokens.toLocaleString()} output tokens).`;
    renderReview();
  } catch (err) {
    status.className = "status error";
    status.textContent = err.message;
  } finally {
    clearInterval(timer);
    btn.disabled = false;
  }
});

// ---------- 2. Review ----------
function tagFor(c) {
  if (c.type === "add") return '<span class="tag tag-add">New</span>';
  if (c.type === "remove") return '<span class="tag tag-remove">Remove</span>';
  return '<span class="tag tag-edit">Change</span>';
}

function changeDetails(c) {
  const lookupName = (id) => speakerName(id, state.proposal.proposed.speakers.some((s) => s.id === id) ? state.proposal.proposed : state.working);
  if (c.entity === "speaker" && c.type === "field" && c.field === "image") {
    return `<div class="photo-compare">
      ${c.before ? `<img src="${esc(imageSrc(c.before))}" alt="Current photo" />` : "none"} →
      ${c.after ? `<img src="${esc(imageSrc(c.after))}" alt="Proposed photo" />` : "none"}</div>`;
  }
  if (c.entity === "speaker" && c.type === "field" && c.field === "description") {
    return `<details><summary>Show bio</summary>
      ${c.before ? `<p><strong>Current:</strong> ${esc(c.before)}</p>` : ""}
      <p><strong>Proposed:</strong> ${esc(c.after) || "—"}</p></details>`;
  }
  if (c.entity === "speaker" && c.type === "add") {
    return `${c.after.image ? `<div class="photo-compare"><img src="${esc(imageSrc(c.after.image))}" alt="" /></div>` : ""}
      ${c.after.description ? `<details><summary>Show bio</summary><p>${esc(c.after.description)}</p></details>` : ""}`;
  }
  if (c.entity === "module" && c.type === "add") {
    return `<details><summary>Details</summary><p>${esc(c.after.day)} · ${esc(c.after.venue || "no venue")}\nSpeakers: ${esc(c.after.speakers.map(lookupName).join(", ") || "none")}</p></details>`;
  }
  return "";
}

function renderReview() {
  const p = state.proposal;
  $("reviewCard").hidden = !p;
  if (!p) return;
  const lookupName = (id) => speakerName(id, p.proposed.speakers.some((s) => s.id === id) ? p.proposed : state.working);

  $("reviewNotes").innerHTML = p.notes.length
    ? `<ul class="notes">${p.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`
    : "";

  if (!p.changes.length) {
    $("changeList").innerHTML = '<p class="hint">No differences from the current programme.</p>';
    $("applyBtn").disabled = true;
    return;
  }
  $("applyBtn").disabled = false;
  const groups = [
    ["day", "Days"],
    ["speaker", "Speakers"],
    ["module", "Modules"],
  ];
  $("changeList").innerHTML = groups
    .map(([entity, heading]) => {
      const items = p.changes.filter((c) => c.entity === entity);
      if (!items.length) return "";
      return `<div class="change-group"><h3>${heading} (${items.length})</h3>${items
        .map((c) => `<label class="change">
            <input type="checkbox" data-change="${esc(c.key)}" ${p.selected.has(c.key) ? "checked" : ""} />
            <div class="change-body">${tagFor(c)}${esc(describeChange(c, lookupName))}${changeDetails(c)}</div>
          </label>`)
        .join("")}</div>`;
    })
    .join("");
}

$("changeList").addEventListener("change", (e) => {
  const key = e.target.dataset.change;
  if (!key) return;
  if (e.target.checked) state.proposal.selected.add(key);
  else state.proposal.selected.delete(key);
});
$("selectAll").addEventListener("click", () => {
  state.proposal.changes.forEach((c) => state.proposal.selected.add(c.key));
  renderReview();
});
$("selectNone").addEventListener("click", () => {
  state.proposal.selected.clear();
  renderReview();
});
$("applyBtn").addEventListener("click", () => {
  const chosen = state.proposal.changes.filter((c) => state.proposal.selected.has(c.key));
  state.working = applyChanges(state.working, chosen);
  state.proposal = null;
  state.files = [];
  renderFiles();
  renderReview();
  renderEditor();
  renderBar();
  $("extractStatus").textContent = `Applied ${chosen.length} change(s). Review them below, then save or post.`;
});
$("discardBtn").addEventListener("click", () => {
  state.proposal = null;
  renderReview();
});

// ---------- 3. Editor ----------
document.querySelectorAll(".tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    state.tab = tab.dataset.tab;
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    $("modulesPanel").hidden = state.tab !== "modules";
    $("speakersPanel").hidden = state.tab !== "speakers";
  })
);

function renderEditor() {
  renderModules();
  renderSpeakers();
}

function renderModules() {
  const w = state.working;
  const byName = [...w.speakers].sort((a, b) => a.name.localeCompare(b.name));
  $("modulesPanel").innerHTML =
    w.days
      .map((d, di) => {
        const mods = w.modules
          .map((m, mi) => ({ m, mi }))
          .filter(({ m }) => m.day === d.label)
          .sort((a, b) => moduleNumber(a.m.code) - moduleNumber(b.m.code));
        return `<div class="day">
          <div class="day-head">
            <input type="text" data-day="${di}" data-f="label" value="${esc(d.label)}" aria-label="Day label" />
            <input type="text" data-day="${di}" data-f="date" value="${esc(d.date)}" aria-label="Date" />
            <button class="icon-btn" data-remove-day="${di}" title="Remove day">✕</button>
          </div>
          ${mods
            .map(({ m, mi }) => `<div class="module">
              <div class="module-row">
                <input type="text" data-mod="${mi}" data-f="code" value="${esc(m.code)}" aria-label="Code" />
                <input type="text" data-mod="${mi}" data-f="title" value="${esc(m.title)}" aria-label="Title" />
                <input type="text" data-mod="${mi}" data-f="venue" value="${esc(m.venue)}" placeholder="Venue" aria-label="Venue" />
                <select data-mod="${mi}" data-f="day" aria-label="Day">
                  ${w.days.map((x) => `<option ${x.label === m.day ? "selected" : ""}>${esc(x.label)}</option>`).join("")}
                </select>
                <button class="icon-btn" data-remove-mod="${mi}" title="Remove module">✕</button>
              </div>
              <div class="chips">
                ${m.speakers
                  .map((id, si) => `<span class="chip-speaker">${esc(speakerName(id))}<button data-unlink="${mi}:${si}" title="Remove from module">✕</button></span>`)
                  .join("")}
                <select data-link="${mi}" aria-label="Add speaker to ${esc(m.code)}">
                  <option value="">+ Add speaker</option>
                  ${byName.filter((s) => !m.speakers.includes(s.id)).map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join("")}
                </select>
              </div>
            </div>`)
            .join("")}
          <div class="row row-tight"><button class="btn btn-small" data-add-mod="${di}">+ Add module to ${esc(d.label)}</button></div>
        </div>`;
      })
      .join("") + `<div class="row"><button class="btn btn-small" id="addDay">+ Add day</button></div>`;
}

function renderSpeakers() {
  const w = state.working;
  const q = state.speakerFilter.toLowerCase();
  const modulesOf = (id) => w.modules.filter((m) => m.speakers.includes(id)).map((m) => m.code).sort((a, b) => moduleNumber(a) - moduleNumber(b));
  const list = w.speakers
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => !q || `${s.name} ${s.affiliation}`.toLowerCase().includes(q))
    .sort((a, b) => a.s.name.localeCompare(b.s.name));

  $("speakersPanel").innerHTML = `
    <div class="speaker-tools">
      <input type="text" id="speakerSearch" placeholder="Search speakers…" value="${esc(state.speakerFilter)}" />
      <input type="text" id="newSpeakerName" placeholder="New speaker name" />
      <input type="text" id="newSpeakerAffil" placeholder="Affiliation" />
      <button class="btn" id="addSpeaker">+ Add speaker</button>
    </div>
    <div id="speakerList">${list
      .map(({ s, i }) => {
        const mods = modulesOf(s.id);
        return `<div class="speaker">
          <div>
            <div class="photo-box ${s.image ? "has" : ""}" data-photo="${i}" title="Drop a photo here or click to choose"
              style="${s.image ? `background-image:url('${esc(imageSrc(s.image))}')` : ""}">Drop photo<br />or click</div>
            ${s.image ? `<button class="photo-remove" data-remove-photo="${i}">Remove photo</button>` : ""}
          </div>
          <div class="speaker-fields">
            <input type="text" data-spk="${i}" data-f="name" value="${esc(s.name)}" aria-label="Name" />
            <input type="text" data-spk="${i}" data-f="affiliation" value="${esc(s.affiliation)}" placeholder="Affiliation" aria-label="Affiliation" />
            <textarea data-spk="${i}" data-f="description" placeholder="Bio (optional — shown on the Speakers tab when filled in)" aria-label="Bio">${esc(s.description)}</textarea>
            <div class="speaker-meta">id <code>${esc(s.id)}</code> · ${mods.length ? `Modules: ${mods.join(", ")}` : "Not in any module"}</div>
          </div>
          <button class="icon-btn" data-remove-spk="${i}" title="Delete speaker">✕</button>
        </div>`;
      })
      .join("") || '<p class="hint">No speakers match.</p>'}</div>
    <input type="file" id="photoInput" accept="image/jpeg,image/png,image/webp" hidden />`;
}

// Text edits update state in place (no re-render, so focus is kept).
document.addEventListener("input", (e) => {
  const t = e.target;
  const w = state.working;
  if (t.id === "speakerSearch") {
    state.speakerFilter = t.value;
    const pos = t.selectionStart;
    renderSpeakers();
    const again = $("speakerSearch");
    again.focus();
    again.setSelectionRange(pos, pos);
    return;
  }
  if (t.dataset.day !== undefined) {
    const day = w.days[Number(t.dataset.day)];
    if (t.dataset.f === "label") {
      w.modules.forEach((m) => { if (m.day === day.label) m.day = t.value; });
      day.label = t.value;
    } else day.date = t.value;
  } else if (t.dataset.mod !== undefined && t.tagName !== "SELECT") {
    w.modules[Number(t.dataset.mod)][t.dataset.f] = t.dataset.f === "code" ? t.value.toUpperCase().trim() : t.value;
  } else if (t.dataset.spk !== undefined) {
    w.speakers[Number(t.dataset.spk)][t.dataset.f] = t.value;
  } else return;
  renderBar();
});

document.addEventListener("change", (e) => {
  const t = e.target;
  const w = state.working;
  if (t.dataset.mod !== undefined && t.dataset.f === "day") {
    w.modules[Number(t.dataset.mod)].day = t.value;
    renderModules();
  } else if (t.dataset.link !== undefined && t.value) {
    w.modules[Number(t.dataset.link)].speakers.push(t.value);
    renderModules();
  } else if (t.dataset.day !== undefined && t.dataset.f === "label") {
    renderModules(); // refresh day pickers
  } else if (t.dataset.spk !== undefined && t.dataset.f === "name") {
    renderModules(); // refresh chip names
  } else return;
  renderBar();
});

let photoTarget = null;

document.addEventListener("click", async (e) => {
  const t = e.target.closest("button, .photo-box");
  if (!t) return;
  const w = state.working;
  const d = t.dataset;

  if (d.removeDay !== undefined) {
    const day = w.days[Number(d.removeDay)];
    const count = w.modules.filter((m) => m.day === day.label).length;
    if (count && !(await confirmDialog(`Remove ${day.label}?`, `<p>This also removes its ${count} module(s).</p>`, "Remove"))) return;
    w.modules = w.modules.filter((m) => m.day !== day.label);
    w.days.splice(Number(d.removeDay), 1);
  } else if (t.id === "addDay") {
    w.days.push({ label: `Day ${w.days.length + 1}`, date: "" });
  } else if (d.addMod !== undefined) {
    const next = Math.max(0, ...w.modules.map((m) => moduleNumber(m.code)).filter(Number.isFinite)) + 1;
    w.modules.push({ code: `M${next}`, title: "", venue: "", day: w.days[Number(d.addMod)].label, speakers: [] });
  } else if (d.removeMod !== undefined) {
    const m = w.modules[Number(d.removeMod)];
    if (!(await confirmDialog(`Remove ${m.code}?`, `<p>${esc(m.title || "Untitled module")}</p>`, "Remove"))) return;
    w.modules.splice(Number(d.removeMod), 1);
  } else if (d.unlink !== undefined) {
    const [mi, si] = d.unlink.split(":").map(Number);
    w.modules[mi].speakers.splice(si, 1);
  } else if (t.id === "addSpeaker") {
    const name = $("newSpeakerName").value.trim();
    if (!name) return $("newSpeakerName").focus();
    w.speakers.push({ id: uniqueSpeakerId(name, w.speakers), name, affiliation: $("newSpeakerAffil").value.trim(), image: "", description: "" });
    state.speakerFilter = "";
  } else if (d.removeSpk !== undefined) {
    const s = w.speakers[Number(d.removeSpk)];
    const mods = w.modules.filter((m) => m.speakers.includes(s.id)).map((m) => m.code);
    const ok = await confirmDialog(`Delete ${s.name}?`, mods.length ? `<p>They'll also be removed from ${esc(mods.join(", "))}.</p>` : "<p>They aren't in any module.</p>", "Delete");
    if (!ok) return;
    w.speakers.splice(Number(d.removeSpk), 1);
    cleanup(w);
  } else if (d.removePhoto !== undefined) {
    w.speakers[Number(d.removePhoto)].image = "";
  } else if (d.photo !== undefined) {
    photoTarget = Number(d.photo);
    $("photoInput").click();
    return;
  } else return;
  renderEditor();
  renderBar();
});

async function setPhoto(index, file) {
  if (!file) return;
  try {
    const { image } = await api("/api/stage-photo", { type: file.type, data: await readAsBase64(file) });
    state.working.speakers[index].image = image;
    renderSpeakers();
    renderBar();
  } catch (err) {
    showLog("Couldn't add photo", [err.message]);
  }
}

document.addEventListener("change", (e) => {
  if (e.target.id === "photoInput" && photoTarget !== null) {
    setPhoto(photoTarget, e.target.files[0]);
    e.target.value = "";
  }
});
$("speakersPanel").addEventListener("dragover", (e) => {
  const box = e.target.closest(".photo-box");
  if (!box) return;
  e.preventDefault();
  e.stopPropagation();
  box.classList.add("over");
});
$("speakersPanel").addEventListener("dragleave", (e) => e.target.closest(".photo-box")?.classList.remove("over"));
$("speakersPanel").addEventListener("drop", (e) => {
  const box = e.target.closest(".photo-box");
  if (!box) return;
  e.preventDefault();
  e.stopPropagation();
  box.classList.remove("over");
  setPhoto(Number(box.dataset.photo), e.dataTransfer.files[0]);
});

// ---------- Bottom bar: status, save, post ----------
function renderBar() {
  const changes = diff(state.saved, state.working);
  const { errors, warnings } = validate(state.working);
  $("unsavedSummary").textContent = changes.length ? `${changes.length} unsaved change(s)` : "All changes saved locally";
  $("revertBtn").disabled = !changes.length;

  const issues = $("issues");
  issues.hidden = !errors.length && !warnings.length;
  const summary = $("issuesSummary");
  summary.textContent = errors.length
    ? `${errors.length} problem(s) to fix before saving${warnings.length ? `, ${warnings.length} warning(s)` : ""}`
    : `${warnings.length} warning(s)`;
  summary.className = errors.length ? "has-errors" : "has-warnings";
  $("issuesList").innerHTML =
    errors.map((m) => `<li class="err">${esc(m)}</li>`).join("") + warnings.map((m) => `<li class="warn">${esc(m)}</li>`).join("");

  $("saveBtn").disabled = Boolean(errors.length);
  $("postBtn").disabled = Boolean(errors.length) || !state.env.sshConfigured;
  $("postBtn").title = state.env.sshConfigured ? `Upload to ${state.env.sshTarget}` : "Server login not configured";
}

function changeListHTML(changes) {
  if (!changes.length) return "<p>No changes since the last local save.</p>";
  return `<ul>${changes.map((c) => `<li>${esc(describeChange(c, (id) => speakerName(id)))}</li>`).join("")}</ul>`;
}

async function saveOrPost(kind) {
  const changes = diff(state.saved, state.working);
  const posting = kind === "post";
  const ok = await confirmDialog(
    posting ? "Post to the live site?" : "Save locally?",
    `${changeListHTML(changes)}<p class="hint">${
      posting
        ? `Saves locally, then uploads the programme data and new photos to <strong>${esc(state.env.sshTarget)}</strong>. The server's current files are backed up to admin-tool/backups/ first.`
        : "Writes course-series/js/programme-data.js and copies new photos into course-series/assets/images/speakers/. Nothing is uploaded."
    }</p>`,
    posting ? "Post" : "Save"
  );
  if (!ok) return;
  const btn = posting ? $("postBtn") : $("saveBtn");
  const label = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> ${posting ? "Posting…" : "Saving…"}`;
  try {
    const result = await api(posting ? "/api/post" : "/api/save", { data: nest(state.working) });
    state.saved = flatten(result.data);
    state.working = clone(state.saved);
    renderEditor();
    showLog(posting ? "Posted to server" : "Saved locally", result.log);
  } catch (err) {
    showLog(posting ? "Post failed" : "Save failed", err.message.split("\n"));
  } finally {
    btn.textContent = label;
    renderBar();
  }
}

$("saveBtn").addEventListener("click", () => saveOrPost("save"));
$("postBtn").addEventListener("click", () => saveOrPost("post"));
$("revertBtn").addEventListener("click", async () => {
  if (!(await confirmDialog("Revert to saved?", "<p>Discard all unsaved edits.</p>", "Revert"))) return;
  state.working = clone(state.saved);
  renderEditor();
  renderBar();
});

$("pullBtn").addEventListener("click", async () => {
  const btn = $("pullBtn");
  btn.disabled = true;
  try {
    const { data } = await api("/api/pull");
    const remote = flatten(data);
    const changes = diff(state.working, remote);
    if (!changes.length) return showLog("Server data", ["The live site has the same programme data as your working copy."]);
    const ok = await confirmDialog(
      "Replace working copy with the live data?",
      `<p>The live site differs from your working copy:</p>${changeListHTML(changes)}`,
      "Use live data"
    );
    if (!ok) return;
    state.working = remote;
    renderEditor();
    renderBar();
  } catch (err) {
    showLog("Couldn't load from server", [err.message]);
  } finally {
    btn.disabled = !state.env.sshConfigured;
  }
});

window.addEventListener("beforeunload", (e) => {
  if (state.saved && diff(state.saved, state.working).length) e.preventDefault();
});

init().catch((err) => showLog("Couldn't start", [err.message]));
