// Small DOM helper - a local copy of the same pattern the main site's
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

// Mobile nav hamburger toggle - same header markup on every page in this
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

// Points the header/footer "CBT main site" links at cfg.site.mainSiteUrl -
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

// Early bird window / discount - shared so the fee tables and the register
// page's live total always agree. Checked at call time (not once at load) so
// a page left open past the cutoff stops applying the discount.
function isEarlyBirdActive(cfg) {
  return Date.now() < new Date(cfg.earlyBird.endsAt).getTime();
}

function applyEarlyBird(cfg, moduleFee) {
  return isEarlyBirdActive(cfg)
    ? Math.round(moduleFee * (1 - cfg.earlyBird.discountPercent / 100))
    : moduleFee;
}

// One fee cell: the struck-through original beside the discounted fee while
// the early bird offer is open, otherwise just the plain fee.
function renderFeeCellHTML(cfg, fee) {
  const discounted = applyEarlyBird(cfg, fee);
  if (discounted === fee) return formatINR(fee);
  return `<s class="cs-fee-original">${formatINR(fee)}</s> <span class="cs-fee-final">${formatINR(discounted)}</span>`;
}

// Fee tier table markup - shared by the register page and the about page so
// the two never drift out of sync.
function renderFeeTableHTML(cfg) {
  const tierLabels = { 1: "Choose any one", 2: "Choose any two", 3: "Choose any three" };
  const moduleCount = cfg.days.reduce((sum, day) => sum + day.modules.length, 0);
  return `
    <thead>
      <tr><th>Module</th><th>Indian Academia</th><th>Indian Industry</th></tr>
    </thead>
    <tbody>
      ${[1, 2, 3].map((n) => `
        <tr>
          <td>M1-M${moduleCount} (${tierLabels[n]})</td>
          <td>${renderFeeCellHTML(cfg, cfg.feeTiers.academia[n])}</td>
          <td>${renderFeeCellHTML(cfg, cfg.feeTiers.industry[n])}</td>
        </tr>
      `).join("")}
    </tbody>`;
}
