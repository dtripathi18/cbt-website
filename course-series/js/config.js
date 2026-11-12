/**
 * Config for the CBT Course Series registration microsite.
 * Deliberately standalone - this folder shares nothing with the main
 * site's /js or /css, so it can be lifted out to its own repo/hosting
 * later with no untangling.
 */
const COURSE_SERIES_CONFIG = {
  site: {
    title: "CBT Course Series",
    wordmark: "CBT / 2026",
    // The header/footer "CBT main site" links point here; they hide
    // themselves if this is left empty (see initMainSiteLinks in shared.js).
    mainSiteUrl: "../index.html",
  },

  event: {
    name: "11th Annual CBT Course Series",
    dates: "December 8-10, 2026",
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
        body: "Professionals working across biopharmaceutical process development, manufacturing, quality, analytical development, product development and regulatory affairs",
      },
      {
        label: "Academia",
        body: "Faculty members, research scholars and postgraduate students engaged in biopharmaceutical sciences, biotechnology, pharmaceutical sciences and related disciplines",
      },
    ],
    // Each point is an HTML string, or { html, earlyBirdOnly: true } for one
    // that stops rendering once `earlyBird.endsAt` (below) has passed.
    highlights: [
      "3 days of live interactive sessions",
      "15 specialized modules shaping the future of next-gen bioprocessing, biotherapeutics, regulatory framework and advanced data analytics",
      {
        html: '🎁 Early Bird Offer: Register by 16th November (IST) to avail <mark class="cs-highlight-mark">10% discount</mark> on module fees',
        earlyBirdOnly: true,
      },
    ],
  },

  intro: {
    heading: "Course Registration",
    body: 'Center of Excellence for Biopharmaceutical Technology (COE-CBT) is organizing its annual "CBT Course Series 2026" from 8th - 10th Dec. Researchers and professionals from both academia and industry are cordially invited to participate.',
    bannerImage: "assets/images/course-banner.png?v=2026-09-23",
    brochureLabel: "Brochure",
    brochureUrl: "https://cbt-brochure.s3.us-east-1.amazonaws.com/brochure.pdf",
  },

  // Days, modules (title, venue, speakers) and speaker details live in
  // js/programme-data.js, which the admin tool (admin-tool/) rewrites.
  // Modules have no individual price - the fee structure (`feeTiers`, below)
  // prices by how many modules are picked in total, not which ones.
  days: PROGRAMME_DATA.days,
  speakers: PROGRAMME_DATA.speakers,

  // Sponsor logos, one array per row on the Sponsors tab. Rows shrink in
  // size from first to last. `tall: true` lets a portrait logo fill its box.
  sponsors: [
    [
      { name: "ACS BIOT", logo: "assets/images/sponsors/acs_biot.jpg", url: "https://acsbiot.org/" },
      { name: "Cytiva", logo: "assets/images/sponsors/cytiva.png", url: "https://www.cytivalifesciences.com/en/in" },
      { name: "Merck", logo: "assets/images/sponsors/merck.png", url: "https://www.merckgroup.com/en" },
    ],
    [
      { name: "Amgen", logo: "assets/images/sponsors/amgen.png", url: "https://www.amgen.com/" },
      { name: "Indian Pharmacopoeia Commission", logo: "assets/images/sponsors/ipc.png", url: "https://www.ipc.gov.in/", tall: true },
      { name: "Sartorius", logo: "assets/images/sponsors/sartorius.png", url: "https://www.sartorius.com/en" },
      { name: "TCS", logo: "assets/images/sponsors/tcs.png", url: "https://www.tcs.com/" },
      { name: "OmniBRx", logo: "assets/images/sponsors/omnibrx.png", url: "https://www.omnibrx.com/" },
    ],
    [
      { name: "Thermo Fisher Scientific", logo: "assets/images/sponsors/thermofisher.png", url: "https://www.thermofisher.com/in/en/home.html" },
      { name: "Biocon", logo: "assets/images/sponsors/biocon.png", url: "https://www.biocon.com/" },
      { name: "HiMedia", logo: "assets/images/sponsors/himedia.png", url: "https://www.himedialabs.com/in/" },
    ],
  ],

  // From the fee table on the "Grid" sheet of reference/cbt_event.xlsx.
  // Already inclusive of 18% GST. Priced per how many modules (1-3) are
  // picked in total across all 3 days, by category.
  feeTiers: {
    academia: { 1: 3000, 2: 5000, 3: 6500 },
    industry: { 1: 5000, 2: 9000, 3: 12000 },
  },
  feeNote: "Fees mentioned above are inclusive of 18% GST",
  feeWarning: "*Fee once paid is non-refundable",

  // Early bird: % off the module fee (accommodation is added undiscounted on
  // top). Applies through the end of 16 Nov IST, so it switches off at
  // midnight IST going into 17 Nov.
  earlyBird: {
    discountPercent: 10,
    endsAt: "2026-11-17T00:00:00+05:30",
    note: "Includes a 10% early bird discount on module fees, valid till 16 November 2026 (IST). Discount applied automatically at checkout.",
    summary: "Early bird: Register by 16th November 2026 (IST) to avail 10% discount on module fees. Discount applied automatically at checkout.",
  },

  // IIT Delhi students (the "IIT Delhi student" option on the register page):
  // a flat % off the base module fee that, unlike the early bird, never
  // expires. It replaces the early bird discount rather than stacking with it,
  // and is priced on the academia tier. Accommodation stays undiscounted.
  iitdStudent: {
    label: "I am an IIT Delhi student",
    organization: "IIT Delhi",
    discountPercent: 30,
    // Replaces `positions` (below) in the "Current position" dropdown.
    positions: ["PhD", "MTech", "BTech", "MSR", "Dual"],
    emailPlaceholder: "Your student Email",
    tableNote: "30% discount on the base amounts",
    note: "Includes a 30% IIT Delhi student discount on module fees",
  },

  // Room/venue schedule for the register page (one row per room, one cell
  // per day), derived from each module's venue in js/programme-data.js.
  roomScheduleTime: "8:30am - 6:30pm",
  roomSchedule: buildRoomSchedule(PROGRAMME_DATA.days),

  // Matches the live form's real rates (these ARE real - the form itself
  // listed these accommodation tiers). Accommodation is priced separately
  // and added on top of the module fee tier above; inclusive of GST.
  accommodation: [
    { label: "No accommodation needed", price: 0 },
    { label: "1 day - ₹956", price: 956 },
    { label: "2 days - ₹1,912", price: 1912 },
    { label: "3 days - ₹2,877", price: 2877 },
    { label: "4 days - ₹3,823", price: 3823 },
    { label: "5 days - ₹4,779", price: 4779 },
  ],
  accommodationNote: "Charges are inclusive of 18% GST",

  // The live form's "Current position" options. This is descriptive only -
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
    noteBeforeEmail: "If you don't get a copy of your responses (acknowledgement) mail within 24-48 hours, please drop a mail on",
    // Shown below the email note.
    collectionNote: "You can collect your ID card and course kits from 8 am onwards at the Registration kiosk on your module day",
  },

  // Apps Script Web App bound to the registrations Sheet + Drive folder. Its
  // code lives in the Sheet (Extensions > Apps Script), not in this repo.
  submitEndpointUrl: "https://script.google.com/macros/s/AKfycbzCtWk6GxocAL06RBOoSJ_fhPE6f-ILQ0Q2E_PlVrAW4VG9jrcm4619VAHYBb4sPrRa/exec",
};
// Room × day matrix: rooms sorted naturally (LHC 408, LHC 410, …), each
// cell the code of the module in that room on that day, or null.
function buildRoomSchedule(days) {
  const rooms = [];
  days.forEach((day) => day.modules.forEach((m) => {
    if (m.venue && !rooms.includes(m.venue)) rooms.push(m.venue);
  }));
  rooms.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return rooms.map((room) => ({
    room,
    cells: days.map((day) => {
      const mod = day.modules.find((m) => m.venue === room);
      return mod ? mod.code : null;
    }),
  }));
}
