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
    // Now a standalone site (cbtcourseseries2026.tech) — this is an
    // absolute URL rather than "../index.html" for that reason.
    mainSiteUrl: "https://dtripathi18.github.io/cbt-website/",
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
      "3 days of sessions across 16 modules — attend as many or as few as suit you",
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
    // TODO: user will provide the real banner photo — drop it in at this path.
    bannerImage: "assets/images/course-banner.png",
    brochureLabel: "More Details & Brochure",
    // TODO: placeholder — user will provide the real link later.
    brochureUrl: "",
  },

  // Each module appears in exactly one day. Modules have no individual price
  // — the real fee structure (below, `feeTiers`) prices by how many modules
  // are picked in total, not which ones.
  days: [
    {
      label: "Day 1",
      date: "December 8, 2026",
      modules: [
        { code: "M1", title: "Commercial Biopharma Manufacturing — Best Practices for Process and Facility Operation (Day 1)" },
        { code: "M3", title: "Drug Development: Concepts and Frameworks" },
        { code: "M6", title: "Design of Experiments for Bioprocess Experimentation" },
        { code: "M9", title: "New Age Biotherapeutics: CAR T cells, ADCs, and VLPs" },
        { code: "M14", title: "Analogue: a Path to Computational Drug Design" },
      ],
    },
    {
      label: "Day 2",
      date: "December 9, 2026",
      modules: [
        { code: "M2", title: "Commercial Biopharma Manufacturing — Best Practices for Process and Facility Operation (Day 2)" },
        { code: "M4", title: "Regulatory Framework for Lifecycle Management of Biotherapeutic Products" },
        { code: "M7", title: "Development and Optimization of Upstream processes" },
        { code: "M10", title: "Critical Quality Attributes of Biotherapeutic Products" },
        { code: "M12", title: "Downstream Processing Development for Biotherapeutic Purification" },
        { code: "M15", title: "Machine Learning Fundamentals for Bioprocess Engineers" },
      ],
    },
    {
      label: "Day 3",
      date: "December 10, 2026",
      modules: [
        { code: "M5", title: "Immunogenicity and other Safety Concerns related to Biotherapeutic Products" },
        { code: "M8", title: "Scale-up and commercial operations in upstream processes" },
        { code: "M11", title: "Role of Spectroscopy in Characterization of Biotherapeutic Products" },
        { code: "M13", title: "Continuous Bioprocessing: Design, Integration, Monitoring and Control" },
        { code: "M16", title: "Biopharma 4.0: Path Towards Next Generation Biomanufacturing" },
      ],
    },
  ],

  // Real numbers, read directly off the live form's "FEE STRUCTURE" table
  // image. Already inclusive of 18% GST. Priced per how many modules (1-3)
  // are picked in total across all 3 days, by category.
  feeTiers: {
    academia: { 1: 2500, 2: 3500, 3: 6000 },
    industry: { 1: 6000, 2: 9500, 3: 12000 },
  },
  feeNote: "Fees above are inclusive of 18% GST.",
  feeWarning: "*Fee once paid is non-refundable.",

  // Room/venue schedule, read off the live form's "Module Details" table
  // image. Room assignments are carried over from last year's edition as
  // reference — confirm they still hold before this goes live. Module codes
  // reference the same modules defined in `days` above (titles aren't
  // duplicated here).
  roomScheduleTime: "8:30am – 6:30pm",
  roomSchedule: [
    { room: "LHC 413.1", cells: ["M1", "M2", null] },
    { room: "LHC 413.2", cells: ["M3", "M4", "M5"] },
    { room: "LHC 416", cells: ["M6", "M7", "M8"] },
    { room: "LHC 413.3", cells: ["M9", "M10", "M11"] },
    { room: "LHC 418", cells: [null, "M12", "M13"] },
    { room: "LHC 413.4", cells: ["M14", "M15", "M16"] },
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
  submitEndpointUrl: "https://script.google.com/macros/s/AKfycbzauAeVA8Q9N6GnTTDQ1l03En5dPCh_xus3u-mxHwCKSRgCEtPhrmef5eonHb96q2q0/exec",
};
