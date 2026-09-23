/**
 * Config for the CBT Course Series registration microsite.
 * Deliberately standalone — this folder shares nothing with the main
 * site's /js or /css, so it can be lifted out to its own repo/hosting
 * later with no untangling.
 */
const COURSE_SERIES_CONFIG = {
  site: {
    title: "CBT Course Series",
    wordmark: "CBT / 2026",
    // The header/footer "CBT main site" links point here; they hide
    // themselves if this is left empty (see initMainSiteLinks in shared.js).
    mainSiteUrl: "https://cbt.iitd.ac.in/",
  },

  event: {
    name: "11th Annual CBT Course Series",
    dates: "December 8–10, 2026",
    venue: "IIT Delhi",
  },

  // Content for the About the Event page. Facts like dates/venue/modules/fees
  // and the intro paragraph/banner/brochure link are read from `event` /
  // `days` / `feeTiers` / `intro` above, not duplicated here.
  about: {
    eyebrow: "About the Event",
    audience: [
      {
        label: "Industry",
        body: "Process, quality, and regulatory professionals working in biopharmaceutical manufacturing and product development.",
      },
      {
        label: "Academia",
        body: "Faculty, research scholars, and postgraduate students working in biopharmaceutical sciences and related disciplines.",
      },
    ],
    highlights: [
      "3 days of sessions across 15 modules — attend as many or as few as suit you",
      "One module per day is selected at registration; each day runs modules in parallel across rooms",
      "Separate fee tiers for academia and industry, based on how many modules you pick",
    ],
  },

  // Shared intro copy — used for the banner above the form (step 1) and for
  // the About page's hero. Mirrors the description text from the live
  // Google Form.
  intro: {
    heading: "Course Registration",
    body: 'Center of Excellence for Biopharmaceutical Technology (COE-CBT) is organizing our annual training event "CBT Course Series 2026" from 8th – 10th Dec 2026. Attendees from industry and academia are welcome to participate.',
    // Bump the ?v= value whenever course-banner.png is replaced, so browsers
    // and the host's cache fetch the new image instead of the old one.
    bannerImage: "assets/images/course-banner.png?v=2026-09-23",
    brochureLabel: "More Details & Brochure",
    // TODO: placeholder — user will provide the real link later.
    brochureUrl: "",
  },

  // Each module appears in exactly one day. Modules have no individual price
  // — the real fee structure (below, `feeTiers`) prices by how many modules
  // are picked in total, not which ones. Titles and day assignments come from
  // the module-name table (A10:C16, one column per day) on the "Grid" sheet
  // of reference/cbt_event.xlsx.
  days: [
    {
      label: "Day 1",
      date: "December 8, 2026",
      modules: [
        { code: "M1", title: "Fundamentals of Upstream Process Development" },
        { code: "M4", title: "Analytical Characterization of Biosimilars" },
        { code: "M7", title: "Design of Experiments for Bioprocess Experimentation" },
        { code: "M10", title: "Drug Development: Concepts and Frameworks" },
        { code: "M13", title: "Critical Quality Attribute in Biotherapeutics" },
        { code: "M15", title: "AI & Machine Learning in Bioprocess: From Principles to Practice" },
      ],
    },
    {
      label: "Day 2",
      date: "December 9, 2026",
      modules: [
        { code: "M2", title: "Downstream Processing for Biopharmaceutical Production" },
        { code: "M5", title: "Formulation Science for Biotherapeutics: From QTPP to Stable Drug Products (Part I)" },
        { code: "M8", title: "Commercial Biopharma Manufacturing — Mastering Process and Facility Operations (Part I)" },
        { code: "M11", title: "Regulatory Framework for Lifecycle Management of Products" },
        { code: "M14", title: "Smart Bioprocessing: From Data to Decisions" },
      ],
    },
    {
      label: "Day 3",
      date: "December 10, 2026",
      modules: [
        { code: "M3", title: "Next Generation Bioprocessing" },
        { code: "M6", title: "Formulation Science for Biotherapeutics: From QTPP to Patient-Centric Delivery (Part II)" },
        { code: "M9", title: "Commercial Biopharma Manufacturing — Tech Ops & Advanced Systems (Part II)" },
        { code: "M12", title: "Biosimilar Guidelines" },
      ],
    },
  ],

  // From the fee table on the "Grid" sheet of reference/cbt_event.xlsx.
  // Already inclusive of 18% GST. Priced per how many modules (1-3) are
  // picked in total across all 3 days, by category.
  feeTiers: {
    academia: { 1: 3000, 2: 5000, 3: 6500 },
    industry: { 1: 5000, 2: 9000, 3: 12000 },
  },
  feeNote: "Fees above are inclusive of 18% GST.",
  feeWarning: "*Fee once paid is non-refundable.",

  // Early bird: % off the module fee (accommodation is added undiscounted on
  // top). Applies through the end of 16 Nov IST, so it switches off at
  // midnight IST going into 17 Nov.
  earlyBird: {
    discountPercent: 10,
    endsAt: "2026-11-17T00:00:00+05:30",
    note: "*Includes a 10% early bird discount on module fees (not on accommodation), valid till 16 November 2026 (IST).",
  },

  // Room/venue schedule (one row per room, one cell per day), from the venue
  // table (A1:D8) on the "Grid" sheet of reference/cbt_event.xlsx. Module
  // codes reference the same modules defined in `days` above (titles aren't
  // duplicated here).
  roomScheduleTime: "8:30am – 6:30pm",
  roomSchedule: [
    { room: "LHC 408", cells: ["M1", "M2", "M3"] },
    { room: "LHC 410", cells: ["M4", "M5", "M6"] },
    { room: "LHC 416", cells: ["M7", "M8", "M9"] },
    { room: "LHC 418", cells: ["M10", "M11", "M12"] },
    { room: "LHC 421", cells: ["M13", "M14", null] },
    { room: "LHC 422", cells: ["M15", null, null] },
  ],

  // Matches the live form's real rates (these ARE real — the form itself
  // listed these accommodation tiers). Accommodation is priced separately
  // and added on top of the module fee tier above; excl. GST per the form.
  accommodation: [
    { label: "No accommodation needed", price: 0 },
    { label: "1 day — ₹810", price: 810 },
    { label: "2 days — ₹1,620", price: 1620 },
    { label: "3 days — ₹2,430", price: 2430 },
    { label: "4 days — ₹3,420", price: 3420 },
    { label: "5 days — ₹4,050", price: 4050 },
  ],

  // The live form's "Current position" options. This is descriptive only —
  // which fee column applies (academia/industry) now comes from the
  // separate "Affiliation" academia/industry field, not from this.
  positions: [
    "Graduate/Post Graduate",
    "Research Scholar/Post-doc",
    "Faculty",
    "Industry",
    "Other",
  ],

  // NEFT bank details, read directly off the live form's payment section.
  bank: {
    beneficiary: "Foundation for Innovation and Technology Transfer",
    bankBranch: "State Bank of India, IIT Delhi, Hauz Khas, New Delhi-16",
    accountNumber: "10773571968",
    ifsc: "SBIN0001077",
    micr: "110002156",
    accountType: "Savings",
    pan: "AAAJF0001G",
    gstin: "07AAAJF0001G1Z3",
    bankContact: "+91-11-26521719",
  },
  postPaymentEmail: "coe.biopharma.course@gmail.com",

  // Shown on thank-you.html after a successful submission.
  thankYou: {
    message: [
      "Dear Participant,",
      "We have received your registration for the CBT Course Series 2026.",
      "Thanks,",
      "CBT Team",
    ],
    // postPaymentEmail (above) is reused here rather than duplicated.
    noteBeforeEmail: "If you don't get a copy of your responses (acknowledgement) mail within 24–48 hours, please drop a mail on",
  },

  // Apps Script Web App (course-series/apps-script/Code.gs), deployed and
  // bound to the registrations Sheet + Drive folder.
  submitEndpointUrl: "https://script.google.com/macros/s/AKfycbx1XRtNAskq7Z4KVDh2HNKBI4T-12_zyYbLWUg6Pfyzy9SrO6SNZ3DPTTBaMXKlwlk9/exec",
};
