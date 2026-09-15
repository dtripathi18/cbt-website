// Small DOM helper shared by every page script.
function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

// Short homepage-carousel teaser derived from a research area's full body
// text — just its first sentence — so there's one piece of copy to edit
// (`body`) instead of two that can drift out of sync.
function researchTeaser(body) {
  const match = body.match(/^[^.]*\./);
  return match ? match[0] : body;
}

// Renders cfg.news into a container (used on the homepage and the News &
// Events page).
function renderNewsGrid(container) {
  const cfg = CBT_CONFIG;
  cfg.news.forEach((n) => {
    const image = n.image
      ? `<img class="n-image" src="${n.image}" alt="${n.title}" loading="lazy" />`
      : `<div class="n-image n-image-placeholder">Image coming soon</div>`;
    const card = el(
      "a",
      "news-card",
      `${image}
       <div class="n-body">
         <div class="n-date">${n.date}</div>
         <h3>${n.title}</h3>
       </div>`
    );
    card.href = n.url;
    container.appendChild(card);
  });
}

// Header/footer chrome that's identical across every page.
(function () {
  const cfg = CBT_CONFIG;

  document.getElementById("headerLogo").src = cfg.site.logo;
  document.getElementById("footerLogo").src = cfg.site.logoLight;

  const navList = document.getElementById("navList");
  const currentFile = location.pathname.split("/").pop() || "index.html";
  cfg.site.nav.forEach((item) => {
    const li = document.createElement("li");
    const a = el("a", null, item.label);
    a.href = item.href;
    if (item.href === currentFile) a.setAttribute("aria-current", "page");
    li.appendChild(a);
    navList.appendChild(li);
  });

  const footerNav = document.getElementById("footerNav");
  cfg.site.nav.forEach((item) => {
    const li = document.createElement("li");
    const a = el("a", null, item.label);
    a.href = item.href;
    li.appendChild(a);
    footerNav.appendChild(li);
  });

  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.getElementById("footerAddress").textContent = cfg.contact.address;
  const footerContact = document.getElementById("footerContact");
  const contactLines = [
    `<a href="tel:${cfg.contact.phone.replace(/[^+\d]/g, "")}">${cfg.contact.phone}</a>`,
    `<a href="mailto:${cfg.contact.email}">${cfg.contact.email}</a>`,
    ...cfg.contact.coordinators.map((c) => `${c.name} (${c.role}) — <a href="mailto:${c.email}">${c.email}</a>`),
  ];
  contactLines.forEach((html) => {
    const li = el("li", null, html);
    footerContact.appendChild(li);
  });

  const footerSocial = document.getElementById("footerSocial");
  const socialLinks = [
    { key: "youtube", label: "YT", url: cfg.contact.social.youtube },
    { key: "linkedin", label: "in", url: cfg.contact.social.linkedin },
  ];
  socialLinks.forEach((s) => {
    const a = el("a", null, s.label);
    a.href = s.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", s.key);
    footerSocial.appendChild(a);
  });

  document.getElementById("footerYear").textContent = new Date().getFullYear();
})();
