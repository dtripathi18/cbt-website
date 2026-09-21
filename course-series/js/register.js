// Registration page logic: renders the form from COURSE_SERIES_CONFIG,
// computes the live total, and handles submission.
(function () {
  const cfg = COURSE_SERIES_CONFIG;
  initCsNavToggle();
  initMainSiteLinks(cfg);

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

  // ---- Contact number (+91 prefix is fixed, input is digits-only, max 10) ----
  const contactInput = document.getElementById("fContact");
  contactInput.addEventListener("input", () => {
    contactInput.value = contactInput.value.replace(/\D/g, "").slice(0, 10);
  });

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

  // Reads a File as base64 (no "data:...;base64," prefix) — Apps Script Web
  // Apps can't parse multipart file uploads, so the screenshot travels as a
  // base64 string inside the JSON payload and gets decoded back into a file
  // server-side.
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ---- Submit ----
  const form = document.getElementById("regForm");
  const submitNote = document.getElementById("submitNote");
  const submitBtn = form.querySelector(".cs-submit");
  const submitSpinner = document.getElementById("submitSpinner");
  const submitBtnLabel = document.getElementById("submitBtnLabel");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Every day needs an explicit choice — a module or "None" — rather than
    // silently treating an untouched day as "not attending".
    const unselectedDays = cfg.days.filter(
      (day, i) => !moduleCheckboxes.some((m) => m.dayIndex === i && m.checkbox.checked)
    );
    if (unselectedDays.length > 0) {
      submitNote.hidden = false;
      submitNote.className = "cs-submit-note cs-submit-note--error";
      submitNote.textContent = `Please make a selection for ${unselectedDays.map((d) => d.label).join(", ")} — pick a module, or mark "None" if you're not attending.`;
      return;
    }

    if (!cfg.submitEndpointUrl) {
      submitNote.hidden = false;
      submitNote.className = "cs-submit-note cs-submit-note--pending";
      submitNote.textContent = "Registration collection isn't connected yet — check back soon.";
      return;
    }

    submitBtn.disabled = true;
    submitSpinner.hidden = false;
    submitBtnLabel.textContent = "Submitting…";
    submitNote.hidden = false;
    submitNote.className = "cs-submit-note cs-submit-note--pending";
    submitNote.textContent = "Submitting…";

    // Warn against closing/refreshing mid-submit — Apps Script may have
    // already saved the registration server-side by the time the request
    // is in flight, so leaving early risks an accidental duplicate
    // submission on retry rather than actually cancelling anything.
    const warnBeforeUnload = (evt) => { evt.preventDefault(); };
    window.addEventListener("beforeunload", warnBeforeUnload);

    let payload;
    try {
      const screenshotFile = document.getElementById("fScreenshot").files[0];
      const screenshotBase64 = screenshotFile ? await readFileAsBase64(screenshotFile) : "";

      const selectedByDay = cfg.days.map((day, i) => {
        const picked = moduleCheckboxes.find((m) => m.dayIndex === i && !m.isNone && m.checkbox.checked);
        return picked ? { code: picked.code, title: picked.title } : { code: "", title: "" };
      });

      payload = {
        name: document.getElementById("fName").value,
        email: document.getElementById("fEmail").value,
        gender: document.getElementById("fGender").value,
        contact: "+91" + document.getElementById("fContact").value,
        affiliationType: affiliationTypeSelect.value,
        organization: document.getElementById("fOrganization").value,
        position: positionSelect.value,
        day1Code: selectedByDay[0].code,
        day1Title: selectedByDay[0].title,
        day2Code: selectedByDay[1].code,
        day2Title: selectedByDay[1].title,
        day3Code: selectedByDay[2].code,
        day3Title: selectedByDay[2].title,
        accommodation: cfg.accommodation[Number(accommodationSelect.value)].label,
        registrationFee: feeDisplay.value,
        txnId: document.getElementById("fTxnId").value,
        txnDate: document.getElementById("fTxnDate").value,
        screenshotBase64,
        screenshotFilename: screenshotFile ? screenshotFile.name : "",
        screenshotMimeType: screenshotFile ? screenshotFile.type : "",
      };
    } catch (err) {
      // A real, pre-send failure (e.g. the screenshot couldn't be read) —
      // nothing was sent, so it's correct to stay here and let them retry.
      window.removeEventListener("beforeunload", warnBeforeUnload);
      submitNote.className = "cs-submit-note cs-submit-note--error";
      submitNote.textContent = "Something went wrong preparing your registration. Please try again.";
      submitBtn.disabled = false;
      submitSpinner.hidden = true;
      submitBtnLabel.textContent = "Submit Registration";
      return;
    }

    try {
      // A hard cap on how long "Submitting…" can hang for — Apps Script Web
      // Apps have no fixed response time, and without this a truly stalled
      // connection could sit here for minutes with no feedback. Past this
      // point we give up waiting (not up on the submission itself — see the
      // catch below) rather than leave the user stuck.
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 25000);
      try {
        await fetch(cfg.submitEndpointUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
          signal: timeoutController.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (networkErr) {
      // Apps Script Web Apps execute doPost() — and already write the Sheet
      // row / send the email — on the initial POST, then 302-redirect to a
      // separate domain purely to deliver the response back to the browser.
      // On a slow/flaky connection (or our own 25s timeout above) that
      // second hop can fail even though the registration was already
      // recorded, so a rejected/aborted fetch here isn't a reliable failure
      // signal. We don't show an error for it; the thank-you page's 24–48h
      // note is the real safety net for genuine delivery failures.
    }

    window.removeEventListener("beforeunload", warnBeforeUnload);
    window.location.href = "thank-you.html";
  });
})();
