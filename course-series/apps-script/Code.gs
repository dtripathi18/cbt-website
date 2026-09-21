/**
 * CBT Course Series — registration intake.
 * Bound to the registrations Google Sheet (Extensions > Apps Script).
 * Deploy as a Web App (execute as you, access: Anyone) and paste the
 * resulting /exec URL into course-series/js/config.js as submitEndpointUrl.
 */

const FOLDER_ID = "1GnQRJBjWx7YHsRr7KPucoc7UCsQi0Dex"; // payment screenshot uploads
const CONTACT_EMAIL = "coe.biopharma.course@gmail.com";

function doPost(e) {
  // Apps Script Web Apps can execute concurrent requests for the same
  // deployment — without this lock, two near-simultaneous submissions
  // (e.g. a refresh-and-retry racing the original request) could both pass
  // the duplicate check below before either has written its row. Holding
  // the lock across the whole request serializes registrations so that
  // check-then-write is atomic.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockErr) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Server busy, please retry." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Same email + transaction ID already on record — almost certainly a
    // retried submission (refresh, timeout, double-click that slipped past
    // the client-side guard) rather than a genuine second registration.
    // Skip writing a duplicate row, uploading a duplicate screenshot, and
    // re-sending the confirmation email.
    if (isDuplicateSubmission(sheet, data)) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "duplicate" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    let screenshotUrl = "";
    if (data.screenshotBase64) {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      const bytes = Utilities.base64Decode(data.screenshotBase64);
      const blob = Utilities.newBlob(
        bytes,
        data.screenshotMimeType || "image/jpeg",
        data.screenshotFilename || "screenshot.jpg"
      );
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      screenshotUrl = file.getUrl();
    }

    sheet.appendRow([
      new Date(),
      data.name || "",
      data.gender || "",
      data.email || "",
      data.contact || "",
      data.affiliationType || "",
      data.organization || "",
      data.position || "",
      data.day1Code || "",
      data.day1Title || "",
      data.day2Code || "",
      data.day2Title || "",
      data.day3Code || "",
      data.day3Title || "",
      data.accommodation || "",
      data.registrationFee || "",
      data.txnId || "",
      data.txnDate || "",
      screenshotUrl,
    ]);

    // The registration is already recorded at this point — a failed
    // confirmation email shouldn't turn a successful submission into an
    // error response.
    if (data.email) {
      try {
        sendConfirmationEmail(data);
      } catch (mailErr) {
        // Don't fail the whole request over a bad email send, but do log it
        // — check Executions in the Apps Script editor if mail isn't arriving.
        console.error("Confirmation email failed: " + mailErr);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Matches on email + transaction ID together (not email alone — the same
// person could legitimately have a reason to submit twice with different
// transactions, but the same transaction ID showing up twice means it's the
// same submission). Columns: 0 Timestamp, 3 Email, 16 Transaction ID.
function isDuplicateSubmission(sheet, data) {
  if (!data.email || !data.txnId) return false;
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][3] === data.email && rows[i][16] === data.txnId) {
      return true;
    }
  }
  return false;
}

// One-time setup helper: select this function in the editor's function
// dropdown and click Run once. This is the only way to trigger Google's
// permission prompt for MailApp — redeploying the Web App does NOT ask for
// it, so without running this manually every confirmation email silently
// fails. Sends a test email to yourself; safe to run more than once.
function authorizeMailSending() {
  MailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    "CBT Course Series — mail authorization test",
    "If you're reading this, the script is now authorized to send confirmation emails."
  );
}

function sendConfirmationEmail(data) {
  const dayLine = (code, title) => (code ? `${code} — ${title}` : "Not attending");

  const rows = [
    ["Name", data.name],
    ["Email", data.email],
    ["Gender", data.gender],
    ["Contact", data.contact],
    ["Affiliation", data.affiliationType],
    ["Organization", data.organization],
    ["Position", data.position],
    ["Day 1 Module", dayLine(data.day1Code, data.day1Title)],
    ["Day 2 Module", dayLine(data.day2Code, data.day2Title)],
    ["Day 3 Module", dayLine(data.day3Code, data.day3Title)],
    ["Accommodation", data.accommodation],
    ["Registration Fee", data.registrationFee],
    ["Transaction ID", data.txnId],
    ["Transaction Date", data.txnDate],
  ];

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#667085;font-size:13px;white-space:nowrap;">${label}</td>` +
        `<td style="padding:6px 0;font-weight:600;font-size:13px;">${value || "—"}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:540px;color:#172033;">
      <h2 style="margin-bottom:4px;">Thank you for registering, ${data.name}!</h2>
      <p style="color:#667085;">We've received your registration for the CBT Course Series 2026. Here's a copy of what you submitted:</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0;">${htmlRows}</table>
      <p style="color:#667085;">We'll verify your payment against the transaction details above and follow up if anything's missing. Questions in the meantime? Reach us at
        <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
      <p style="color:#98a2b3;font-size:12px;margin-top:24px;">Centre of Excellence for Biopharmaceutical Technology (CBT), IIT Delhi</p>
    </div>`;

  MailApp.sendEmail({
    to: data.email,
    name: "CBT Course Series",
    subject: "Registration Confirmed — CBT Course Series 2026",
    htmlBody: html,
  });
}
