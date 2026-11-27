// Feedback page logic: renders the end-of-day feedback form from
// COURSE_SERIES_CONFIG.feedback (+ the active day's modules from
// programme-data.js) and sends it to the feedback Apps Script.
(function () {
  const cfg = COURSE_SERIES_CONFIG;
  const fb = cfg.feedback;
  initCsNavToggle();
  initMainSiteLinks(cfg);

  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

  // ---- Intro banner + copy ----
  document.getElementById("introHeading").textContent = fb.heading;
  document.getElementById("introBody").textContent = fb.body;
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
  const queryEmail = document.getElementById("queryEmail");
  queryEmail.href = `mailto:${cfg.postPaymentEmail}`;
  queryEmail.textContent = cfg.postPaymentEmail;

  // ---- Contact number (+91 prefix is fixed, digits only, max 10) ----
  const contactInput = document.getElementById("fContact");
  contactInput.addEventListener("input", () => {
    contactInput.value = contactInput.value.replace(/\D/g, "").slice(0, 10);
  });

  // ---- Previous attendance: "Yes" fades in the last-attended year ----
  const dayIndex = Math.min(Math.max(Number(fb.activeDay) || 1, 1), cfg.days.length) - 1;
  const day = cfg.days[dayIndex];
  const eventYear = Number((day.date.match(/\d{4}/) || [])[0]) || new Date().getFullYear();

  const yearSelect = document.getElementById("fLastYear");
  for (let y = fb.firstEditionYear; y <= eventYear - 1; y++) {
    yearSelect.appendChild(new Option(String(y), String(y)));
  }
  const yearReveal = document.getElementById("yearReveal");
  const attendedRadios = [...document.querySelectorAll('input[name="attendedBefore"]')];
  attendedRadios.forEach((radio) => radio.addEventListener("change", () => {
    const yes = radio.value === "Yes" && radio.checked;
    yearReveal.classList.toggle("cs-reveal--open", yes);
    // Disabled while hidden, so it's skipped by tab order and validation.
    yearSelect.disabled = !yes;
    yearSelect.required = yes;
    if (!yes) yearSelect.selectedIndex = 0;
    clearError("previousBlock");
  }));

  // ---- Module attended: the active day's modules only ----
  document.getElementById("moduleDayHeading").textContent = `${day.label} - ${day.date}`;
  const moduleList = document.getElementById("moduleList");
  const moduleOptions = [
    ...day.modules.map((m) => ({ code: m.code, title: m.title })),
    { code: "", title: "Not applicable", none: true },
  ];
  moduleOptions.forEach((opt, i) => {
    const label = el(
      "label",
      opt.none ? "cs-module cs-module--none" : "cs-module",
      `<input type="radio" class="cs-module-input" name="module" value="${i}" />
       <span class="cs-module-check"></span>
       <span class="cs-module-text">
         ${opt.code ? `<span class="cs-module-code">${escapeHTML(opt.code)}</span>` : ""}
         <span class="cs-module-title">${escapeHTML(opt.title)}</span>
       </span>`
    );
    label.querySelector("input").addEventListener("change", () => clearError("moduleBlock"));
    moduleList.appendChild(label);
  });

  // ---- Ratings grid: a table on desktop, stacked option chips on mobile ----
  document.getElementById("ratingHint").textContent = fb.ratingHint;
  const ratingGrid = document.getElementById("ratingGrid");
  ratingGrid.style.setProperty("--cs-rating-cols", fb.ratingScale.length);
  ratingGrid.appendChild(el(
    "div",
    "cs-rating-head",
    `<span></span>${fb.ratingScale.map((s) => `<span>${escapeHTML(s)}</span>`).join("")}`
  ));
  fb.ratingRows.forEach((row, r) => {
    const rowEl = el(
      "div",
      "cs-rating-row",
      `<span class="cs-rating-label" id="rating-label-${r}">${escapeHTML(row.label)} <span class="cs-req">*</span></span>
       <div class="cs-rating-options" role="radiogroup" aria-labelledby="rating-label-${r}">
         ${fb.ratingScale.map((s) => `
           <label class="cs-rating-option">
             <input type="radio" name="rating-${row.key}" value="${escapeHTML(s)}" />
             <span class="cs-rating-dot" aria-hidden="true"></span>
             <span class="cs-rating-text">${escapeHTML(s)}</span>
           </label>`).join("")}
       </div>`
    );
    rowEl.addEventListener("change", () => {
      rowEl.classList.remove("cs-rating-row--error");
      hideErrorNoteIfResolved();
    });
    ratingGrid.appendChild(rowEl);
  });

  document.getElementById("enjoyedLabel").textContent = fb.enjoyedLabel;

  // ---- Validation helpers for the radio blocks (native validation covers
  // the text fields and the year dropdown) ----
  function checkedValue(name) {
    const input = document.querySelector(`input[name="${name}"]:checked`);
    return input ? input.value : null;
  }
  function markError(blockId) {
    document.getElementById(blockId).classList.add("cs-section--error");
  }
  function clearError(blockId) {
    document.getElementById(blockId).classList.remove("cs-section--error");
    hideErrorNoteIfResolved();
  }
  // Drops the "answer all required questions" note once nothing is red.
  function hideErrorNoteIfResolved() {
    const note = document.getElementById("submitNote");
    if (note.classList.contains("cs-submit-note--error") &&
        !document.querySelector(".cs-section--error, .cs-rating-row--error")) {
      note.hidden = true;
    }
  }

  // ---- Submit ----
  const form = document.getElementById("feedbackForm");
  const submitBtn = document.getElementById("submitBtn");
  const submitNote = document.getElementById("submitNote");
  const submitSpinner = document.getElementById("submitSpinner");
  const submitBtnLabel = document.getElementById("submitBtnLabel");

  function showNote(kind, text) {
    submitNote.hidden = false;
    submitNote.className = `cs-submit-note cs-submit-note--${kind}`;
    submitNote.textContent = text;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Radio blocks, top to bottom - the first unanswered one is scrolled to.
    const missing = [];
    if (!checkedValue("attendedBefore")) { markError("previousBlock"); missing.push(document.getElementById("previousBlock")); }
    if (checkedValue("module") === null) { markError("moduleBlock"); missing.push(document.getElementById("moduleBlock")); }
    const unratedRows = fb.ratingRows
      .map((row, r) => ({ row, el: ratingGrid.querySelectorAll(".cs-rating-row")[r] }))
      .filter(({ row }) => !checkedValue(`rating-${row.key}`));
    unratedRows.forEach(({ el: rowEl }) => rowEl.classList.add("cs-rating-row--error"));
    if (unratedRows.length) missing.push(unratedRows[0].el);

    if (missing.length) {
      showNote("error", "Please answer all the required questions (marked in red) before submitting.");
      missing[0].scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!fb.endpointUrl) {
      showNote("pending", "Feedback collection isn't connected yet - check back soon.");
      return;
    }

    const picked = moduleOptions[Number(checkedValue("module"))];
    const attendedBefore = checkedValue("attendedBefore");
    const payload = {
      name: document.getElementById("fName").value.trim(),
      contact: "+91" + contactInput.value,
      organization: document.getElementById("fOrganization").value.trim(),
      attendedBefore,
      lastAttendedYear: attendedBefore === "Yes" ? yearSelect.value : "",
      day: day.label,
      dayDate: day.date,
      moduleCode: picked.code,
      moduleTitle: picked.title,
      enjoyedMost: document.getElementById("fEnjoyed").value.trim(),
      takeaway: document.getElementById("fTakeaway").value.trim(),
      suggestions: document.getElementById("fSuggestions").value.trim(),
    };
    fb.ratingRows.forEach((row) => {
      payload[`rating_${row.key}`] = checkedValue(`rating-${row.key}`);
    });

    submitBtn.disabled = true;
    submitSpinner.hidden = false;
    submitBtnLabel.textContent = "Submitting…";
    showNote("pending", "Submitting…");

    try {
      // Cap the wait - Apps Script has no fixed response time.
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 25000);
      try {
        await fetch(fb.endpointUrl, {
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
      // Same as register.js: Apps Script writes the row on the first POST
      // and only then redirects to deliver a response, so a failed/aborted
      // fetch here doesn't mean the feedback was lost.
    }

    // Swap the form for the thank-you panel.
    document.getElementById("thanksMessage").innerHTML = fb.thankYouMessage.map(escapeHTML).join("<br />");
    document.getElementById("feedbackContent").hidden = true;
    const thanks = document.getElementById("feedbackThanks");
    thanks.hidden = false;
    window.scrollTo(0, 0);
    thanks.focus({ preventScroll: true });
  });
})();
