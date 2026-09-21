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

// Mobile nav hamburger toggle — same header markup on every page in this
// microsite, so this is wired up once and called from each page's script.
function initCsNavToggle() {
  const toggle = document.getElementById("csNavToggle");
  const nav = document.getElementById("csNav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// Points the header/footer "CBT main site" links at cfg.site.mainSiteUrl —
// same header/footer markup on every page in this microsite. Hidden
// entirely while that's unset (this site is now fully standalone; no
// confirmed "official" main-site URL to link back to yet).
function initMainSiteLinks(cfg) {
  const navLink = document.getElementById("mainSiteNavLink");
  const footerWrap = document.getElementById("mainSiteFooterWrap");
  if (!cfg.site.mainSiteUrl) {
    if (navLink) navLink.hidden = true;
    if (footerWrap) footerWrap.hidden = true;
    return;
  }
  const footerLink = document.getElementById("mainSiteFooterLink");
  if (navLink) navLink.href = cfg.site.mainSiteUrl;
  if (footerLink) footerLink.href = cfg.site.mainSiteUrl;
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
