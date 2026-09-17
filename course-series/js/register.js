// Registration page logic: renders the form from COURSE_SERIES_CONFIG,
// computes the live total, and handles submission.
(function () {
  const cfg = COURSE_SERIES_CONFIG;

  // ---- Intro banner (above the form) ----
  document.getElementById("introHeading").textContent = cfg.intro.heading;
  document.getElementById("introBody").textContent = cfg.intro.body;

  const introBanner = document.getElementById("introBanner");
  if (cfg.intro.bannerImage) {
    const img = document.createElement("img");
    img.src = cfg.intro.bannerImage;
    img.alt = "";
    img.onerror = () => { introBanner.hidden = true; };
    introBanner.appendChild(img);
  } else {
    introBanner.hidden = true;
  }

  const introLink = document.getElementById("introLink");
  introLink.innerHTML = `${cfg.intro.brochureLabel}<span aria-hidden="true">→</span>`;
  if (cfg.intro.brochureUrl) {
    introLink.href = cfg.intro.brochureUrl;
  } else {
    introLink.classList.add("cs-intro-link--disabled");
    introLink.addEventListener("click", (e) => e.preventDefault());
  }

  // ---- Bank details (NEFT payment) ----
  const bankRows = [
    ["Beneficiary", cfg.bank.beneficiary],
    ["Bank & Branch", cfg.bank.bankBranch],
    ["Account Number", cfg.bank.accountNumber],
    ["IFSC", cfg.bank.ifsc],
    ["MICR Code", cfg.bank.micr],
    ["Account Type", cfg.bank.accountType],
    ["PAN", cfg.bank.pan],
    ["GSTIN", cfg.bank.gstin],
    ["Bank Contact", cfg.bank.bankContact],
  ];
  document.getElementById("bankBox").innerHTML = bankRows
    .map(([label, value]) => `<div class="cs-bank-row"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
  // ---- Fee structure table (mirrors the figure on the live Google Form) ----
  document.getElementById("feeTable").innerHTML = renderFeeTableHTML(cfg);
  document.getElementById("feeNote").textContent = cfg.feeNote;
  document.getElementById("feeWarning").textContent = cfg.feeWarning;

  // ---- Module details & venue schedule (mirrors the figure on the live
  // Google Form) — a room × day matrix, module titles looked up from `days`
  // above so they're not duplicated in two places. ----
  const moduleTitleByCode = {};
  cfg.days.forEach((day) => day.modules.forEach((m) => { moduleTitleByCode[m.code] = m.title; }));

  const dayHeaders = cfg.days.map((d) => d.label);
  document.getElementById("scheduleTable").innerHTML = `
    <thead>
      <tr><th>Venue</th>${dayHeaders.map((h) => `<th>${h}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${cfg.roomSchedule.map((row) => `
        <tr>
          <td>${row.room}</td>
          ${row.cells.map((code) => code
            ? `<td><span class="cs-schedule-code">${code}</span> ${moduleTitleByCode[code] || ""}</td>`
            : `<td>—</td>`
          ).join("")}
        </tr>
      `).join("")}
    </tbody>`;
  document.getElementById("scheduleNote").textContent =
    `Timing: ${cfg.roomScheduleTime} each day. Modules run in parallel across rooms — you can attend only one module per day (see "Choose Your Modules" below for full titles).`;

  // ---- Position dropdown (descriptive only, doesn't affect pricing) ----
  const positionSelect = document.getElementById("fPosition");
  cfg.positions.forEach((label) => {
    const opt = document.createElement("option");
    opt.textContent = label;
    positionSelect.appendChild(opt);
  });

  // ---- Affiliation type (academia/industry) — this drives pricing ----
  const affiliationTypeSelect = document.getElementById("fAffiliationType");
  affiliationTypeSelect.addEventListener("change", recalculate);

  // ---- Days + modules ----
  const daysSection = document.getElementById("daysSection");
  const moduleCheckboxes = []; // { checkbox, code, title, dayIndex, isNone }

  cfg.days.forEach((day, dayIndex) => {
    const dayBlock = el("div", "cs-day");
    const heading = el("h3", "cs-day-heading", `${day.label} — ${day.date}`);
    dayBlock.appendChild(heading);

    const list = el("div", "cs-module-list");

    day.modules.forEach((mod) => {
      const id = `mod-${mod.code}`;
      const row = el(
        "label",
        "cs-module",
        `<input type="checkbox" class="cs-module-input" id="${id}" />
         <span class="cs-module-check"></span>
         <span class="cs-module-text">
           <span class="cs-module-code">${mod.code}</span>
           <span class="cs-module-title">${mod.title}</span>
         </span>`
      );
      const checkbox = row.querySelector("input");
      list.appendChild(row);
      moduleCheckboxes.push({ checkbox, code: mod.code, title: mod.title, dayIndex, isNone: false });
    });

    // "None" option — mutually exclusive with the real modules for this day.
    const noneRow = el(
      "label",
      "cs-module cs-module--none",
      `<input type="checkbox" class="cs-module-input" id="none-day-${dayIndex}" />
       <span class="cs-module-check"></span>
       <span class="cs-module-text"><span class="cs-module-title">None — not attending this day</span></span>`
    );
    const noneCheckbox = noneRow.querySelector("input");
    list.appendChild(noneRow);
    moduleCheckboxes.push({ checkbox: noneCheckbox, code: null, title: "None", dayIndex, isNone: true });

    dayBlock.appendChild(list);
    daysSection.appendChild(dayBlock);
  });

  // One module (or "None") per day — styled as cards/checkboxes rather than
  // native radio buttons, but single-select is enforced here: checking one
  // entry for a day clears every other entry in that same day.
  moduleCheckboxes.forEach((entry) => {
    entry.checkbox.addEventListener("change", () => {
      if (entry.checkbox.checked) {
        moduleCheckboxes
          .filter((m) => m.dayIndex === entry.dayIndex && m !== entry)
          .forEach((m) => { m.checkbox.checked = false; });
      }
      recalculate();
    });
  });

  // ---- Accommodation ----
  const accommodationSelect = document.getElementById("fAccommodation");
  cfg.accommodation.forEach((tier, i) => {
    const opt = document.createElement("option");
    opt.textContent = tier.label;
    opt.value = String(i);
    accommodationSelect.appendChild(opt);
  });
  accommodationSelect.addEventListener("change", recalculate);

  // ---- Live calculation ----
  const feeDisplay = document.getElementById("feeDisplay");

  function recalculate() {
    const selectedCount = moduleCheckboxes.filter((m) => !m.isNone && m.checkbox.checked).length;
    const accommodationTier = cfg.accommodation[Number(accommodationSelect.value)] || cfg.accommodation[0];
    const category = affiliationTypeSelect.value; // "academia" | "industry" | "" (not selected yet)

    const moduleFee = selectedCount > 0 && category ? (cfg.feeTiers[category][selectedCount] || 0) : 0;
    const total = moduleFee + accommodationTier.price;
    feeDisplay.value = formatINR(total);
  }

  recalculate();

  // ---- Submit ----
  const form = document.getElementById("regForm");
  const submitNote = document.getElementById("submitNote");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const anyModuleSelected = moduleCheckboxes.some((m) => !m.isNone && m.checkbox.checked);
    if (!anyModuleSelected) {
      submitNote.hidden = false;
      submitNote.className = "cs-submit-note cs-submit-note--error";
      submitNote.textContent = "Select at least one module, or mark “None” for every day if you're not attending.";
      return;
    }

    if (!cfg.submitEndpointUrl) {
      submitNote.hidden = false;
      submitNote.className = "cs-submit-note cs-submit-note--pending";
      submitNote.textContent = "Registration collection isn't connected yet — check back soon.";
      return;
    }

    // TODO: once submitEndpointUrl is a real Apps Script Web App URL, this
    // will actually fire. Left unimplemented (payload shape TBD) until the
    // target Sheet's structure is known.
  });
})();
