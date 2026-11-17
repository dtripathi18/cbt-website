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
  // Base fees only - the IIT Delhi student discount is spelled out in
  // #feeDiscountNote, kept current by recalculate().
  document.getElementById("feeTable").innerHTML = renderFeeTableHTML(cfg);
  document.getElementById("feeNote").textContent = cfg.feeNote;
  document.getElementById("feeWarning").textContent = cfg.feeWarning;
  document.getElementById("accommodationWarning").textContent = cfg.feeWarning;

  // ---- Module details & venue schedule (mirrors the figure on the live
  // Google Form) - a room × day matrix, module titles looked up from `days`
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
            : `<td>-</td>`
          ).join("")}
        </tr>
      `).join("")}
    </tbody>`;
  document.getElementById("scheduleNote").innerHTML =
    `<strong>Timing: ${cfg.roomScheduleTime} each day. Modules run in parallel across rooms - you can attend only one module per day (see "Choose Your Modules" below for full titles).</strong>`;

  // ---- Position dropdown (descriptive only, doesn't affect pricing) ----
  // Its options depend on the IIT Delhi student option (see below).
  const positionSelect = document.getElementById("fPosition");
  function fillPositions(labels) {
    positionSelect.innerHTML = `<option value="" disabled selected>Select</option>`;
    labels.forEach((label) => {
      const opt = document.createElement("option");
      opt.textContent = label;
      positionSelect.appendChild(opt);
    });
  }

  // ---- Affiliation type (academia/industry) - this drives pricing ----
  const affiliationTypeSelect = document.getElementById("fAffiliationType");
  affiliationTypeSelect.addEventListener("change", recalculate);

  // ---- IIT Delhi student option ----
  // Ticking it fixes Organization to "IIT Delhi" (read-only), swaps the
  // position list for IITD programmes, locks Affiliation to academia, asks
  // for their student email, and applies the IITD student discount.
  const iitd = cfg.iitdStudent;
  const iitdCheckbox = document.getElementById("fIitdStudent");
  const organizationInput = document.getElementById("fOrganization");
  const emailInput = document.getElementById("fEmail");
  document.getElementById("iitdStudentLabel").textContent = iitd.label;
  let typedOrganization = ""; // what they'd typed before ticking, restored on untick

  // IITD students must register with their institute email (anything ending
  // in "iitd.ac.in", e.g. name@iitd.ac.in or name@cse.iitd.ac.in). Uses the
  // browser's constraint validation, so the submit handler's
  // checkValidity()/reportValidity() blocks the form and shows the message.
  const IITD_EMAIL_SUFFIX = "iitd.ac.in";
  function validateIitdEmail() {
    const value = emailInput.value.trim().toLowerCase();
    const invalid = iitdCheckbox.checked && value !== "" && !value.endsWith(IITD_EMAIL_SUFFIX);
    emailInput.setCustomValidity(
      invalid ? `IIT Delhi students must use their IITD email address (ending in "${IITD_EMAIL_SUFFIX}").` : ""
    );
  }
  emailInput.addEventListener("input", validateIitdEmail);

  function applyIitdState() {
    const on = iitdCheckbox.checked;
    organizationInput.readOnly = on;
    emailInput.placeholder = on ? iitd.emailPlaceholder : "";
    validateIitdEmail();
    fillPositions(on ? iitd.positions : cfg.positions);
    if (on) affiliationTypeSelect.value = "academia";
    affiliationTypeSelect.disabled = on;
  }

  // Ticks/unticks the IITD option, keeping Organization in step with it.
  function setIitd(checked) {
    if (checked === iitdCheckbox.checked) return;
    iitdCheckbox.checked = checked;
    if (checked) {
      typedOrganization = organizationInput.value;
      organizationInput.value = iitd.organization;
    } else {
      organizationInput.value = typedOrganization;
    }
    applyIitdState();
  }

  iitdCheckbox.addEventListener("change", () => {
    // Flip it back so setIitd() sees a real change and does the bookkeeping.
    const want = iitdCheckbox.checked;
    iitdCheckbox.checked = !want;
    setIitd(want);
    if (want) {
      setNcr(false); // the two discounts don't stack
      outsideNcrCheckbox.checked = false;
    }
    recalculate();
  });

  // ---- Academic institution in Delhi NCR option ----
  // Ticking it slides open two ID card upload boxes (front + back, both
  // required) and applies the NCR discount. Unticking it collapses the
  // boxes and clears whatever was uploaded.
  const ncr = cfg.ncrInstitution;
  const ncrCheckbox = document.getElementById("fNcrInstitution");
  const idCardReveal = document.getElementById("idCardReveal");
  document.getElementById("ncrInstitutionLabel").textContent = ncr.label;

  // Each upload box: click to browse, or drag & drop an image onto it.
  // Shows a small preview of the picked image.
  const idCardUploads = ["fIdFront", "fIdBack"].map((id) => {
    const input = document.getElementById(id);
    const box = input.closest(".cs-upload-box");
    const preview = box.querySelector(".cs-upload-preview");
    const nameEl = box.querySelector(".cs-upload-name");
    let previewUrl = null;

    function render() {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      const file = input.files[0];
      if (file) {
        previewUrl = URL.createObjectURL(file);
        preview.src = previewUrl;
      } else {
        preview.removeAttribute("src");
      }
      preview.hidden = !file;
      box.classList.toggle("cs-upload-box--filled", !!file);
      nameEl.textContent = file ? file.name : "";
    }

    function clear() {
      input.value = "";
      render();
    }

    input.addEventListener("change", () => {
      const file = input.files[0];
      if (file && !file.type.startsWith("image/")) {
        clear();
        return;
      }
      render();
    });

    ["dragenter", "dragover"].forEach((type) =>
      box.addEventListener(type, (e) => {
        e.preventDefault();
        box.classList.add("cs-upload-box--drag");
      })
    );
    ["dragleave", "dragend"].forEach((type) =>
      box.addEventListener(type, () => box.classList.remove("cs-upload-box--drag"))
    );
    box.addEventListener("drop", (e) => {
      e.preventDefault();
      box.classList.remove("cs-upload-box--drag");
      const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
      if (!file) return;
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      render();
    });

    return { input, clear };
  });

  function applyNcrState() {
    const on = ncrCheckbox.checked;
    idCardReveal.classList.toggle("cs-reveal--open", on);
    idCardReveal.inert = !on; // collapsed boxes can't be tabbed into
    idCardUploads.forEach((u) => {
      u.input.required = on;
      if (!on) u.clear();
    });
  }

  function setNcr(checked) {
    if (checked === ncrCheckbox.checked) return;
    ncrCheckbox.checked = checked;
    applyNcrState();
  }

  ncrCheckbox.addEventListener("change", () => {
    applyNcrState();
    if (ncrCheckbox.checked) {
      setIitd(false); // the two discounts don't stack
      outsideNcrCheckbox.checked = false;
    }
    recalculate();
  });

  // ---- Academic institution outside Delhi NCR option ----
  // The no-discount academia choice. Mutually exclusive with the other two.
  const outsideNcrCheckbox = document.getElementById("fOutsideNcr");
  document.getElementById("outsideNcrLabel").textContent = cfg.outsideNcrInstitution.label;
  outsideNcrCheckbox.addEventListener("change", () => {
    if (outsideNcrCheckbox.checked) {
      setIitd(false);
      setNcr(false);
    }
    recalculate();
  });

  // ---- Academia-only options: shown only once Affiliation is Academia ----
  const academiaOptions = document.getElementById("academiaOptions");
  function applyAffiliationState() {
    const isAcademia = affiliationTypeSelect.value === "academia";
    academiaOptions.hidden = !isAcademia;
    if (!isAcademia) {
      setIitd(false);
      setNcr(false);
      outsideNcrCheckbox.checked = false;
    }
    validateAcademiaChoice();
  }
  affiliationTypeSelect.addEventListener("change", applyAffiliationState);

  // Academia registrants must pick exactly one of the three options. Uses
  // constraint validation on the first option so the submit handler's
  // checkValidity()/reportValidity() blocks the form and points at it.
  function validateAcademiaChoice() {
    const missing =
      affiliationTypeSelect.value === "academia" &&
      !iitdCheckbox.checked && !ncrCheckbox.checked && !outsideNcrCheckbox.checked;
    iitdCheckbox.setCustomValidity(missing ? "Please select one of the academic institution options." : "");
  }

  // The browser may restore ticked boxes on back/refresh - sync to them.
  if (iitdCheckbox.checked && ncrCheckbox.checked) ncrCheckbox.checked = false;
  if (outsideNcrCheckbox.checked && (iitdCheckbox.checked || ncrCheckbox.checked)) outsideNcrCheckbox.checked = false;
  if (iitdCheckbox.checked) organizationInput.value = iitd.organization;
  applyIitdState();
  applyNcrState();
  applyAffiliationState();

  // ---- Days + modules ----
  const daysSection = document.getElementById("daysSection");
  const moduleCheckboxes = []; // { checkbox, code, title, dayIndex, isNone }

  // Part I / Part II modules must be taken together (see syncPartPairs below).
  const PART_PAIRS = [["M5", "M6"], ["M8", "M9"]];

  cfg.days.forEach((day, dayIndex) => {
    daysSection.appendChild(
      el("p", "cs-hint cs-day-hint", `<strong>Select one module only or "None" if you're not attending any</strong>`)
    );

    const dayBlock = el("div", "cs-day");
    const heading = el("h3", "cs-day-heading", `${day.label} - ${day.date}`);
    dayBlock.appendChild(heading);
    // Shown on every day that holds a Part I or Part II module (Day 2 and Day 3).
    if (day.modules.some((m) => PART_PAIRS.flat().includes(m.code))) {
      dayBlock.appendChild(el("p", "cs-hint cs-day-lock-note", `<span class="cs-req">*</span><strong>Note: M5-M6 and M8-M9 are paired modules and will be selected together automatically.</strong> <br> <i> Eg. (Selecting M5 will automatically select M6 and selecting M8 will automatically select M9, and vice versa.)</i>`));
    }

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

    // "None" option - mutually exclusive with the real modules for this day.
    const noneRow = el(
      "label",
      "cs-module cs-module--none",
      `<input type="checkbox" class="cs-module-input" id="none-day-${dayIndex}" />
       <span class="cs-module-check"></span>
       <span class="cs-module-text"><span class="cs-module-title">None - not attending this day</span></span>`
    );
    const noneCheckbox = noneRow.querySelector("input");
    list.appendChild(noneRow);
    moduleCheckboxes.push({ checkbox: noneCheckbox, code: null, title: "None", dayIndex, isNone: true });

    dayBlock.appendChild(list);
    daysSection.appendChild(dayBlock);
  });

  // One module (or "None") per day - styled as cards/checkboxes rather than
  // native radio buttons, but single-select is enforced here: checking one
  // entry for a day clears every other entry in that same day.
  // Part I / Part II modules must be taken together: picking either one
  // selects its partner and locks the rest of the Part II day. Unchecking
  // (or replacing) one half of a pair also clears the other half.
  const findEntry = (code) => moduleCheckboxes.find((m) => m.code === code);

  // Selects `entry` and clears every other option on its day.
  function pickExclusively(entry) {
    moduleCheckboxes
      .filter((m) => m.dayIndex === entry.dayIndex && m !== entry)
      .forEach((m) => { m.checkbox.checked = false; });
    entry.checkbox.checked = true;
  }

  function syncPartPairs(changed) {
    const pair = changed.checkbox.checked && PART_PAIRS.find((p) => p.includes(changed.code));
    if (pair) pair.forEach((code) => pickExclusively(findEntry(code)));

    // A pair with only one half left (partner was replaced/unchecked) is dissolved.
    PART_PAIRS.forEach(([a, b]) => {
      const ea = findEntry(a), eb = findEntry(b);
      if (ea.checkbox.checked !== eb.checkbox.checked) {
        ea.checkbox.checked = false;
        eb.checkbox.checked = false;
      }
    });

    // Lock the whole Part II day while its pair is active (Part II itself included,
    // so the pair can only be undone from the Part I day).
    const lockedDays = new Set(
      PART_PAIRS.filter(([a]) => findEntry(a).checkbox.checked).map(([, b]) => findEntry(b).dayIndex)
    );
    moduleCheckboxes.forEach((m) => {
      const locked = lockedDays.has(m.dayIndex);
      m.checkbox.disabled = locked;
      m.checkbox.closest(".cs-module").classList.toggle("cs-module--locked", locked);
    });
  }

  moduleCheckboxes.forEach((entry) => {
    entry.checkbox.addEventListener("change", () => {
      if (entry.checkbox.checked) pickExclusively(entry);
      syncPartPairs(entry);
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
  const feeOriginal = document.getElementById("feeOriginal");
  const feeFinal = document.getElementById("feeFinal");
  let registrationFee = formatINR(0);
  const discountNote = document.getElementById("discountNote");
  const feeDiscountNote = document.getElementById("feeDiscountNote");

  function recalculate() {
    const selectedCount = moduleCheckboxes.filter((m) => !m.isNone && m.checkbox.checked).length;
    const accommodationTier = cfg.accommodation[Number(accommodationSelect.value)] || cfg.accommodation[0];
    const category = affiliationTypeSelect.value; // "academia" | "industry" | "" (not selected yet)

    const moduleFee = selectedCount > 0 && category ? (cfg.feeTiers[category][selectedCount] || 0) : 0;
    // At most one discount applies: IITD students, or Delhi NCR institutions.
    const discount = iitdCheckbox.checked ? iitd : ncrCheckbox.checked ? ncr : null;
    const discountedModuleFee = discount
      ? applyPercentOff(moduleFee, discount.discountPercent)
      : moduleFee;
    const total = discountedModuleFee + accommodationTier.price;
    registrationFee = formatINR(total);
    feeFinal.textContent = registrationFee;

    // Strike through the pre-discount total beside the final one - only
    // when there's actually something discounted (not ₹0 → ₹0).
    feeOriginal.hidden = discountedModuleFee === moduleFee;
    feeOriginal.textContent = formatINR(moduleFee + accommodationTier.price);

    // Gradient note under the total, and the note under the fee table.
    discountNote.hidden = !discount;
    discountNote.textContent = discount ? discount.note : "";
    feeDiscountNote.hidden = !discount;
    feeDiscountNote.textContent = discount ? discount.tableNote : "";

    validateAcademiaChoice();
  }

  recalculate();

  // Reads a File as base64 (no "data:...;base64," prefix) - Apps Script Web
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
    recalculate();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Every day needs an explicit choice - a module or "None" - rather than
    // silently treating an untouched day as "not attending".
    const unselectedDays = cfg.days.filter(
      (day, i) => !moduleCheckboxes.some((m) => m.dayIndex === i && m.checkbox.checked)
    );
    if (unselectedDays.length > 0) {
      submitNote.hidden = false;
      submitNote.className = "cs-submit-note cs-submit-note--error";
      submitNote.textContent = `Please make a selection for ${unselectedDays.map((d) => d.label).join(", ")} - pick a module, or mark "None" if you're not attending.`;
      return;
    }

    if (!cfg.submitEndpointUrl) {
      submitNote.hidden = false;
      submitNote.className = "cs-submit-note cs-submit-note--pending";
      submitNote.textContent = "Registration collection isn't connected yet - check back soon.";
      return;
    }

    submitBtn.disabled = true;
    submitSpinner.hidden = false;
    submitBtnLabel.textContent = "Submitting…";
    submitNote.hidden = false;
    submitNote.className = "cs-submit-note cs-submit-note--pending";
    submitNote.textContent = "Submitting…";

    // Warn against closing/refreshing mid-submit - Apps Script may have
    // already saved the registration server-side by the time the request
    // is in flight, so leaving early risks an accidental duplicate
    // submission on retry rather than actually cancelling anything.
    const warnBeforeUnload = (evt) => { evt.preventDefault(); };
    window.addEventListener("beforeunload", warnBeforeUnload);

    let payload;
    try {
      const screenshotFile = document.getElementById("fScreenshot").files[0];
      const screenshotBase64 = screenshotFile ? await readFileAsBase64(screenshotFile) : "";

      // ID card photos - only sent for the Delhi NCR institution option.
      const isNcr = ncrCheckbox.checked;
      const [idFrontFile, idBackFile] = idCardUploads.map((u) => (isNcr && u.input.files[0]) || null);
      const idFrontBase64 = idFrontFile ? await readFileAsBase64(idFrontFile) : "";
      const idBackBase64 = idBackFile ? await readFileAsBase64(idBackFile) : "";

      const selectedByDay = cfg.days.map((day, i) => {
        const picked = moduleCheckboxes.find((m) => m.dayIndex === i && !m.isNone && m.checkbox.checked);
        return picked ? { code: picked.code, title: picked.title } : { code: "", title: "" };
      });

      payload = {
        name: document.getElementById("fName").value,
        email: emailInput.value,
        gender: document.getElementById("fGender").value,
        contact: "+91" + document.getElementById("fContact").value,
        affiliationType: affiliationTypeSelect.value,
        organization: organizationInput.value,
        iitdStudent: iitdCheckbox.checked ? "Yes" : "No",
        ncrInstitution: isNcr ? "Yes" : "No",
        idCardFrontBase64: idFrontBase64,
        idCardFrontFilename: idFrontFile ? idFrontFile.name : "",
        idCardFrontMimeType: idFrontFile ? idFrontFile.type : "",
        idCardBackBase64: idBackBase64,
        idCardBackFilename: idBackFile ? idBackFile.name : "",
        idCardBackMimeType: idBackFile ? idBackFile.type : "",
        position: positionSelect.value,
        day1Code: selectedByDay[0].code,
        day1Title: selectedByDay[0].title,
        day2Code: selectedByDay[1].code,
        day2Title: selectedByDay[1].title,
        day3Code: selectedByDay[2].code,
        day3Title: selectedByDay[2].title,
        accommodation: cfg.accommodation[Number(accommodationSelect.value)].label,
        registrationFee,
        txnId: document.getElementById("fTxnId").value,
        txnDate: document.getElementById("fTxnDate").value,
        screenshotBase64,
        screenshotFilename: screenshotFile ? screenshotFile.name : "",
        screenshotMimeType: screenshotFile ? screenshotFile.type : "",
      };
    } catch (err) {
      // A real, pre-send failure (e.g. the screenshot couldn't be read) -
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
      // A hard cap on how long "Submitting…" can hang for - Apps Script Web
      // Apps have no fixed response time, and without this a truly stalled
      // connection could sit here for minutes with no feedback. Past this
      // point we give up waiting (not up on the submission itself - see the
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
      // Apps Script Web Apps execute doPost() - and already write the Sheet
      // row / send the email - on the initial POST, then 302-redirect to a
      // separate domain purely to deliver the response back to the browser.
      // On a slow/flaky connection (or our own 25s timeout above) that
      // second hop can fail even though the registration was already
      // recorded, so a rejected/aborted fetch here isn't a reliable failure
      // signal. We don't show an error for it; the thank-you page's 24–48h
      // note is the real safety net for genuine delivery failures.
    }

    window.removeEventListener("beforeunload", warnBeforeUnload);
    // Unlocks thank-you.html for this tab - it redirects back here without
    // this flag, so it can't be reached by typing the URL directly.
    try { sessionStorage.setItem("csRegistrationSubmitted", "1"); } catch (storageErr) {}
    window.location.href = "thank-you.html";
  });
})();
