// Small DOM helper — a local copy of the same pattern the main site's
// js/shared.js uses, kept separate on purpose (no cross-folder import).
function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function formatINR(n) {
  return "₹" + n.toLocaleString("en-IN");
}

// Fee tier table markup — shared by the register page and the about page so
// the two never drift out of sync.
function renderFeeTableHTML(cfg) {
  const tierLabels = { 1: "Pick any one", 2: "Pick any two", 3: "Pick any three" };
  return `
    <thead>
      <tr><th>Module</th><th>Indian Academia</th><th>Indian Industry</th></tr>
    </thead>
    <tbody>
      ${[1, 2, 3].map((n) => `
        <tr>
          <td>M1–M16 (${tierLabels[n]})</td>
          <td>${formatINR(cfg.feeTiers.academia[n])}</td>
          <td>${formatINR(cfg.feeTiers.industry[n])}</td>
        </tr>
      `).join("")}
    </tbody>`;
}
