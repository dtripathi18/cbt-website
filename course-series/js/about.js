// About the Event page logic: renders overview content from
// COURSE_SERIES_CONFIG. Shares `event` / `intro` / `days` / `feeTiers` with
// register.js so the two pages never drift out of sync.
(function () {
  const cfg = COURSE_SERIES_CONFIG;
  initCsNavToggle();
  initMainSiteLinks(cfg);

  // ---- Hero ----
  document.getElementById("aboutEyebrow").textContent = cfg.about.eyebrow;
  document.getElementById("aboutHeading").textContent = cfg.event.name;
  document.getElementById("aboutMeta").textContent = `${cfg.event.dates} · ${cfg.event.venue}`;
  document.getElementById("aboutIntro").textContent = cfg.intro.body;

  const highlightsList = document.getElementById("aboutHighlights");
  const earlyBirdOpen = Date.now() < new Date(cfg.earlyBird.endsAt).getTime();
  cfg.about.highlights.forEach((point) => {
    if (typeof point === "string") point = { html: point };
    if (point.earlyBirdOnly && !earlyBirdOpen) return;
    highlightsList.appendChild(el("li", null, point.html));
  });

  const brochureLink = document.getElementById("aboutBrochureLink");
  brochureLink.innerHTML = `${cfg.intro.brochureLabel}<span aria-hidden="true">→</span>`;
  if (cfg.intro.brochureUrl) {
    brochureLink.href = cfg.intro.brochureUrl;
  } else {
    brochureLink.classList.add("cs-intro-link--disabled");
    brochureLink.addEventListener("click", (e) => e.preventDefault());
  }

  const aboutBanner = document.getElementById("aboutBanner");
  if (cfg.intro.bannerImage) {
    const img = document.createElement("img");
    img.src = cfg.intro.bannerImage;
    img.alt = "";
    img.onerror = () => { aboutBanner.hidden = true; };
    aboutBanner.appendChild(img);
  } else {
    aboutBanner.hidden = true;
  }

  // ---- Who should attend ----
  const audienceGrid = document.getElementById("audienceGrid");
  cfg.about.audience.forEach((entry) => {
    audienceGrid.appendChild(
      el("div", "cs-about-audience-card", `<h3>${entry.label}</h3><p>${entry.body}</p>`)
    );
  });

  // ---- Lookups shared by the tab panels ----
  const allModules = cfg.days.flatMap((day) => day.modules);
  const speakerById = {};
  cfg.speakers.forEach((s) => { speakerById[s.id] = s; });
  const modulesBySpeaker = {};
  allModules.forEach((mod) => (mod.speakers || []).forEach((id) => {
    if (!speakerById[id]) {
      console.warn(`Module ${mod.code} lists unknown speaker id "${id}"`);
      return;
    }
    (modulesBySpeaker[id] = modulesBySpeaker[id] || []).push(mod);
  }));

  const chevronSVG ='<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const pinSVG ='<svg viewBox="0 0 20 20" width="13" height="13" aria-hidden="true"><path d="M10 18s6-5.2 6-10a6 6 0 10-12 0c0 4.8 6 10 6 10z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="10" cy="8" r="2.2" fill="currentColor"/></svg>';

  document.getElementById("curriculumHint").innerHTML =`<strong>*Choose one module per day at registration. Modules run in parallel - review the options and select your preferred module. </strong>`;

  const curriculumDays = document.getElementById("curriculumDays");
  cfg.days.forEach((day) => {
    const dayBlock = el("div", "cs-cday");
    dayBlock.appendChild(
      el("h3", "cs-cday-heading", `<span class="cs-cday-label">${day.label}</span><span class="cs-cday-date">${day.date}</span>`)
    );

    const grid = el("div", "cs-acc-grid");
    day.modules.forEach((mod) => {
      const speakers = (mod.speakers || []).map((id) => speakerById[id]).filter(Boolean);
      const venue = mod.venue;
      const bodyId = `acc-body-${mod.code}`;
      const headId = `acc-head-${mod.code}`;

      const acc = el("div", "cs-acc");
      acc.innerHTML = `
        <button class="cs-acc-head" type="button" id="${headId}" aria-expanded="false" aria-controls="${bodyId}">
          <span class="cs-acc-code">${mod.code}</span>
          <span class="cs-acc-text">
            <span class="cs-acc-title">${mod.title}</span>
            ${venue ? `<span class="cs-acc-venue">${pinSVG}${venue}</span>` : ""}
          </span>
          <span class="cs-acc-arrow">${chevronSVG}</span>
        </button>
        <div class="cs-acc-body" id="${bodyId}" role="region" aria-labelledby="${headId}">
          <div class="cs-acc-inner">
            <p class="cs-acc-label">Speakers</p>
            ${speakers.length
              ? `<ul class="cs-acc-speakers">${speakers.map((s) => `
                  <li><span class="cs-acc-speaker-name">${s.name}</span><span class="cs-acc-speaker-affil">${s.affiliation}</span></li>
                `).join("")}</ul>`
              : '<p class="cs-acc-empty">Speakers to be announced.</p>'}
            <a class="cs-acc-all" href="#speakers" data-tab-link="speakers">View all speakers<span class="cs-acc-all-arrow" aria-hidden="true">→</span></a>
          </div>
        </div>`;

      const head = acc.querySelector(".cs-acc-head");
      head.addEventListener("click", () => {
        const isOpen = acc.classList.toggle("open");
        head.setAttribute("aria-expanded", String(isOpen));
      });
      grid.appendChild(acc);
    });

    dayBlock.appendChild(grid);
    curriculumDays.appendChild(dayBlock);
  });

  // ---- Fee structure (same table as the register page) ----
  document.getElementById("aboutFeeTable").innerHTML = renderFeeTableHTML(cfg);
  document.getElementById("aboutFeeNote").textContent = cfg.feeNote;
  document.getElementById("aboutFeeWarning").textContent = cfg.feeWarning;
  const earlyBirdNote = document.getElementById("aboutEarlyBird");
  if (earlyBirdOpen) {
    earlyBirdNote.textContent = cfg.earlyBird.summary;
    earlyBirdNote.hidden = false;
  }

  // ---- Speakers, styled after the brochure's speaker list: bold uppercase
  // "FIRSTNAME LASTNAME", in alphabetical order of the name as shown. Photo
  // and bio render only once they're filled in. ----
  document.getElementById("speakersHint").innerHTML =
    `<strong>${cfg.speakers.length} speakers from Industry, Academia and Regulatory bodies</strong>`;

  const speakerList = document.getElementById("speakerList");
  cfg.speakers
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    .forEach((s) => {
      const mods = (modulesBySpeaker[s.id] || [])
        .slice()
        .sort((a, b) => Number(a.code.slice(1)) - Number(b.code.slice(1)));
      const card = el("article", "cs-speaker");
      card.id = `speaker-${s.id}`;
      card.innerHTML = `
        ${s.image ? `<img class="cs-speaker-photo" src="${s.image}" alt="${s.name}" loading="lazy" />` : ""}
        <div class="cs-speaker-body">
          <h3 class="cs-speaker-name">${s.name}</h3>
          <p class="cs-speaker-affil">${s.affiliation}</p>
          ${mods.length
            ? `<ul class="cs-speaker-modules" aria-label="Modules">${mods.map((m) =>
                `<li><span class="cs-speaker-module-code">${m.code}</span><span class="cs-speaker-module-title">${m.title}</span></li>`
              ).join("")}</ul>`
            : ""}
          ${s.description ? `<p class="cs-speaker-desc">${s.description}</p>` : ""}
        </div>`;
      speakerList.appendChild(card);
    });

  // ---- Sponsors ----
  const sponsorGrid = document.getElementById("sponsorGrid");
  cfg.sponsors.forEach((sp) => {
    const card = el("div", "cs-sponsor");
    const img = document.createElement("img");
    img.src = sp.logo;
    img.alt = sp.name;
    img.loading = "lazy";
    // Fall back to the sponsor's name if the logo file is missing.
    img.onerror = () => { card.textContent = sp.name; };
    card.appendChild(img);
    sponsorGrid.appendChild(card);
  });

  // ---- Local tab navbar. The active tab is mirrored in the URL hash
  // (#curriculum, #fees, #speakers, #sponsors) so each tab can be linked to
  // directly. ----
  const tablist = document.getElementById("aboutTabs");
  const tabs = Array.from(tablist.querySelectorAll(".cs-tab"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function activateTab(name, { focus = false, scroll = false } = {}) {
    const tab = tabs.find((t) => t.dataset.tab === name);
    if (!tab) return false;
    tabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !active;
    });
    if (focus) tab.focus();
    history.replaceState(null, "", `#${name}`);

    // Bring the panel's top into view when asked, or when the sticky tab bar
    // is already covering it (i.e. the user had scrolled down the old panel).
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (scroll || panel.getBoundingClientRect().top < tablist.getBoundingClientRect().bottom) {
      panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
    return true;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });

  tablist.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i === -1) return;
    let next = null;
    if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
    else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === "Home") next = tabs[0];
    else if (e.key === "End") next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    activateTab(next.dataset.tab, { focus: true });
  });

  // In-page links to a tab, e.g. each module's "View all speakers".
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-tab-link]");
    if (!link) return;
    e.preventDefault();
    activateTab(link.dataset.tabLink, { scroll: true });
  });

  const initialTab = location.hash.slice(1);
  if (initialTab && initialTab !== "curriculum") activateTab(initialTab, { scroll: true });
})();
