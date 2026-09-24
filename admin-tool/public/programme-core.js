// Programme data helpers shared by the admin UI (browser) and the local
// server (Node). Works on two shapes:
//
//   nested — what course-series/js/programme-data.js stores:
//     { days: [{ label, date, modules: [{ code, title, venue, speakers: [id] }] }],
//       speakers: [{ id, name, affiliation, image, description }] }
//
//   flat — easier to diff and edit:
//     { days: [{ label, date }],
//       modules: [{ code, title, venue, day, speakers: [id] }],   // day = day label
//       speakers: [...same as nested] }

export const SPEAKER_FIELDS = ["name", "affiliation", "description", "image"];
export const MODULE_FIELDS = ["title", "venue", "day"];

const clone = (v) => JSON.parse(JSON.stringify(v));

export function moduleNumber(code) {
  const n = parseInt(String(code).replace(/\D+/g, ""), 10);
  return Number.isNaN(n) ? Infinity : n;
}

export function slugify(name) {
  return String(name)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSpeakerId(name, speakers) {
  const base = slugify(name) || "speaker";
  const taken = new Set(speakers.map((s) => s.id));
  let id = base;
  for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
  return id;
}

export function flatten(nested) {
  return {
    days: nested.days.map((d) => ({ label: d.label, date: d.date })),
    modules: nested.days.flatMap((d) =>
      d.modules.map((m) => ({
        code: m.code,
        title: m.title,
        venue: m.venue || "",
        day: d.label,
        speakers: [...(m.speakers || [])],
      }))
    ),
    speakers: nested.speakers.map((s) => ({
      id: s.id,
      name: s.name,
      affiliation: s.affiliation || "",
      image: s.image || "",
      description: s.description || "",
    })),
  };
}

// Modules within a day are ordered by module number (M1, M4, M7, …).
export function nest(flat) {
  return {
    days: flat.days.map((d) => ({
      label: d.label,
      date: d.date,
      modules: flat.modules
        .filter((m) => m.day === d.label)
        .sort((a, b) => moduleNumber(a.code) - moduleNumber(b.code))
        .map((m) => ({ code: m.code, title: m.title, venue: m.venue, speakers: [...m.speakers] })),
    })),
    speakers: flat.speakers.map((s) => ({
      id: s.id,
      name: s.name,
      affiliation: s.affiliation,
      image: s.image,
      description: s.description,
    })),
  };
}

export function validate(flat) {
  const errors = [];
  const warnings = [];
  const dayLabels = new Set();
  flat.days.forEach((d, i) => {
    if (!d.label.trim()) errors.push(`Day ${i + 1} has no label.`);
    if (dayLabels.has(d.label)) errors.push(`Two days are labelled "${d.label}".`);
    dayLabels.add(d.label);
    if (!d.date.trim()) warnings.push(`${d.label || `Day ${i + 1}`} has no date.`);
  });

  const speakerIds = new Set();
  flat.speakers.forEach((s) => {
    if (!s.id) errors.push(`Speaker "${s.name}" has no id.`);
    if (speakerIds.has(s.id)) errors.push(`Speaker id "${s.id}" is used twice.`);
    speakerIds.add(s.id);
    if (!s.name.trim()) errors.push(`Speaker "${s.id}" has no name.`);
    if (!s.affiliation.trim()) warnings.push(`${s.name || s.id} has no affiliation.`);
  });

  const codes = new Set();
  const used = new Set();
  flat.modules.forEach((m) => {
    const label = m.code || "(no code)";
    if (!/^M\d+$/.test(m.code)) errors.push(`Module code "${label}" should look like M1, M2, …`);
    if (codes.has(m.code)) errors.push(`Module code ${m.code} is used twice.`);
    codes.add(m.code);
    if (!m.title.trim()) errors.push(`${label} has no title.`);
    if (!dayLabels.has(m.day)) errors.push(`${label} is on "${m.day}", which isn't a day in the programme.`);
    if (!m.venue.trim()) warnings.push(`${label} has no venue.`);
    if (!m.speakers.length) warnings.push(`${label} has no speakers.`);
    m.speakers.forEach((id) => {
      used.add(id);
      if (!speakerIds.has(id)) errors.push(`${label} lists unknown speaker "${id}".`);
    });
  });

  const venueByDay = {};
  flat.modules.forEach((m) => {
    if (!m.venue) return;
    const key = `${m.day}|${m.venue}`;
    if (venueByDay[key]) errors.push(`${venueByDay[key]} and ${m.code} are both in ${m.venue} on ${m.day}.`);
    venueByDay[key] = m.code;
  });

  flat.speakers.forEach((s) => {
    if (!used.has(s.id)) warnings.push(`${s.name} isn't in any module (still listed on the Speakers tab).`);
  });
  return { errors, warnings };
}

// Changes that turn `from` into `to`. Each change carries enough to be
// applied on its own (see applyChanges) and a human-readable summary.
export function diff(from, to) {
  const changes = [];
  const add = (c) => changes.push({ key: `${c.entity}:${c.id}:${c.type}:${c.field || ""}`, ...c });

  const fromDays = new Map(from.days.map((d) => [d.label, d]));
  const toDays = new Map(to.days.map((d) => [d.label, d]));
  to.days.forEach((d) => {
    const old = fromDays.get(d.label);
    if (!old) add({ entity: "day", id: d.label, type: "add", after: d });
    else if (old.date !== d.date) add({ entity: "day", id: d.label, type: "field", field: "date", before: old.date, after: d.date });
  });
  from.days.forEach((d) => {
    if (!toDays.has(d.label)) add({ entity: "day", id: d.label, type: "remove", before: d });
  });

  const fromSpk = new Map(from.speakers.map((s) => [s.id, s]));
  const toSpk = new Map(to.speakers.map((s) => [s.id, s]));
  to.speakers.forEach((s) => {
    const old = fromSpk.get(s.id);
    if (!old) return add({ entity: "speaker", id: s.id, type: "add", after: s });
    SPEAKER_FIELDS.forEach((field) => {
      if ((old[field] || "") !== (s[field] || "")) {
        add({ entity: "speaker", id: s.id, type: "field", field, before: old[field] || "", after: s[field] || "" });
      }
    });
  });
  from.speakers.forEach((s) => {
    if (!toSpk.has(s.id)) add({ entity: "speaker", id: s.id, type: "remove", before: s });
  });

  const fromMod = new Map(from.modules.map((m) => [m.code, m]));
  const toMod = new Map(to.modules.map((m) => [m.code, m]));
  to.modules.forEach((m) => {
    const old = fromMod.get(m.code);
    if (!old) return add({ entity: "module", id: m.code, type: "add", after: m });
    MODULE_FIELDS.forEach((field) => {
      if (old[field] !== m[field]) add({ entity: "module", id: m.code, type: "field", field, before: old[field], after: m[field] });
    });
    if (old.speakers.join("|") !== m.speakers.join("|")) {
      add({
        entity: "module",
        id: m.code,
        type: "speakers",
        before: old.speakers,
        after: m.speakers,
        added: m.speakers.filter((id) => !old.speakers.includes(id)),
        removed: old.speakers.filter((id) => !m.speakers.includes(id)),
      });
    }
  });
  from.modules.forEach((m) => {
    if (!toMod.has(m.code)) add({ entity: "module", id: m.code, type: "remove", before: m });
  });

  // Days first, then speakers, then modules — so an accepted module change
  // that references a new speaker is applied after that speaker exists.
  const order = { day: 0, speaker: 1, module: 2 };
  return changes.sort((a, b) => order[a.entity] - order[b.entity]);
}

export function applyChanges(base, changes) {
  const out = clone(base);
  const listFor = (entity) => (entity === "day" ? out.days : entity === "speaker" ? out.speakers : out.modules);
  const keyOf = (entity, item) => (entity === "day" ? item.label : entity === "speaker" ? item.id : item.code);

  changes.forEach((c) => {
    const list = listFor(c.entity);
    const idx = list.findIndex((item) => keyOf(c.entity, item) === c.id);
    if (c.type === "add") {
      if (idx === -1) list.push(clone(c.after));
      else list[idx] = clone(c.after);
    } else if (c.type === "remove") {
      if (idx !== -1) list.splice(idx, 1);
    } else if (c.type === "field" && idx !== -1) {
      list[idx][c.field] = c.after;
    } else if (c.type === "speakers" && idx !== -1) {
      list[idx].speakers = [...c.after];
    }
  });
  return cleanup(out);
}

// Drops dangling references: module speaker ids that no longer exist and
// duplicate ids within a module.
export function cleanup(flat) {
  const ids = new Set(flat.speakers.map((s) => s.id));
  flat.modules.forEach((m) => {
    m.speakers = [...new Set(m.speakers)].filter((id) => ids.has(id));
  });
  return flat;
}

export function describeChange(c, speakerName = (id) => id) {
  const trim = (v, n = 80) => {
    const s = String(v ?? "");
    return s.length > n ? `${s.slice(0, n - 1)}…` : s;
  };
  if (c.entity === "day") {
    if (c.type === "add") return `New day: ${c.after.label} (${c.after.date})`;
    if (c.type === "remove") return `Remove day: ${c.before.label}`;
    return `${c.id} date: ${c.before} → ${c.after}`;
  }
  if (c.entity === "speaker") {
    if (c.type === "add") return `New speaker: ${c.after.name}${c.after.affiliation ? ` (${c.after.affiliation})` : ""}`;
    if (c.type === "remove") return `Remove speaker: ${c.before.name}`;
    const who = speakerName(c.id);
    if (c.field === "image") return `${who}: ${c.after ? (c.before ? "new photo" : "add photo") : "remove photo"}`;
    if (c.field === "description") return `${who}: ${c.after ? (c.before ? "update bio" : "add bio") : "remove bio"}`;
    return `${who} ${c.field}: “${trim(c.before)}” → “${trim(c.after)}”`;
  }
  if (c.type === "add") return `New module: ${c.after.code} ${trim(c.after.title)}`;
  if (c.type === "remove") return `Remove module: ${c.before.code} ${trim(c.before.title)}`;
  if (c.type === "speakers") {
    const parts = [];
    if (c.added.length) parts.push(`+ ${c.added.map(speakerName).join(", ")}`);
    if (c.removed.length) parts.push(`− ${c.removed.map(speakerName).join(", ")}`);
    return `${c.id} speakers: ${parts.join("; ") || "reordered"}`;
  }
  return `${c.id} ${c.field}: “${trim(c.before)}” → “${trim(c.after)}”`;
}
