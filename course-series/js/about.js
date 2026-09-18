// About the Event page logic: renders overview content from
// COURSE_SERIES_CONFIG. Shares `event` / `intro` / `days` / `feeTiers` with
// register.js so the two pages never drift out of sync.
(function () {
  const cfg = COURSE_SERIES_CONFIG;
  initCsNavToggle();

  // ---- Hero ----
  document.getElementById("aboutEyebrow").textContent = cfg.about.eyebrow;
  document.getElementById("aboutHeading").textContent = cfg.event.name;
  document.getElementById("aboutMeta").textContent = `${cfg.event.dates} · ${cfg.event.venue}`;
  document.getElementById("aboutIntro").textContent = cfg.intro.body;

  const highlightsList = document.getElementById("aboutHighlights");
  cfg.about.highlights.forEach((point) => {
    highlightsList.appendChild(el("li", null, point));
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

  // ---- Curriculum overview (read-only — no selection here, see Register) ----
  const curriculumDays = document.getElementById("curriculumDays");
  cfg.days.forEach((day) => {
    const dayBlock = el("div", "cs-day cs-day--static");
    dayBlock.appendChild(el("h3", "cs-day-heading", `${day.label} — ${day.date}`));

    const list = el("div", "cs-module-list");
    day.modules.forEach((mod) => {
      list.appendChild(
        el(
          "div",
          "cs-module cs-module--static",
          `<span class="cs-module-text">
             <span class="cs-module-code">${mod.code}</span>
             <span class="cs-module-title">${mod.title}</span>
           </span>`
        )
      );
    });
    dayBlock.appendChild(list);
    curriculumDays.appendChild(dayBlock);
  });

  // ---- Fees at a glance (same table as the register page) ----
  document.getElementById("aboutFeeTable").innerHTML = renderFeeTableHTML(cfg);
  document.getElementById("aboutFeeNote").textContent = cfg.feeNote;
})();
