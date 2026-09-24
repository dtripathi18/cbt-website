import fs from "node:fs";
import { diff, flatten, describeChange } from "./public/programme-core.js";
const pdf = fs.readFileSync("../course-series/reference/cbt_brochure.pdf").toString("base64");
const state = await (await fetch("http://127.0.0.1:5178/api/state", { headers: { "X-CBT-Admin": "1" } })).json();
const t0 = Date.now();
const res = await fetch("http://127.0.0.1:5178/api/extract", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-CBT-Admin": "1" },
  body: JSON.stringify({ files: [{ name: "cbt_brochure.pdf", type: "application/pdf", data: pdf }], currentData: state.data, completeProgramme: true, extractBios: true }),
});
const out = await res.json();
if (!res.ok) { console.log("ERROR", out); process.exit(1); }
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
const cur = flatten(state.data), prop = flatten(out.proposed);
const name = (id) => (prop.speakers.find(s => s.id === id) || cur.speakers.find(s => s.id === id))?.name || id;
console.log(`time ${Math.round((Date.now() - t0) / 1000)}s usage`, out.usage, "photos checked", out.photosFound);
console.log("NOTES:\n- " + out.notes.join("\n- "));
const ch = diff(cur, prop);
const counts = {}; ch.forEach(c => { const k = `${c.entity}:${c.type}${c.field ? ":" + c.field : ""}`; counts[k] = (counts[k] || 0) + 1; });
console.log("CHANGE COUNTS", counts);
ch.filter(c => !(c.type === "field" && (c.field === "description" || c.field === "image"))).forEach(c => console.log(" *", describeChange(c, name)));
console.log("PHOTOS:", prop.speakers.filter(s => s.image.startsWith("staged:")).map(s => `${s.name}=${s.image}`).join(", "));
