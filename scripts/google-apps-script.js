/**
 * Google Apps Script — Jamie's KIA Sales KPI Sheet → Supabase Sync
 *
 * SETUP INSTRUCTIONS:
 * 1. Open Jamie's Google Sheet
 * 2. Extensions → Apps Script
 * 3. Paste this entire file
 * 4. Set the Script Properties (gear icon → Project Settings → Script Properties):
 *    - API_URL = https://poweredbystewart.com/api/sheets-sync
 *    - API_KEY = (the value of SHEETS_SYNC_API_KEY from your .env.local)
 *    - TENANT_ID = santa_fe_kia
 * 5. Save and run `initialSync` once manually to authorize
 * 6. Set up a time trigger: Triggers → Add Trigger → syncCurrentAndPreviousMonth → Time-driven → Every 5 minutes
 */

// ─── Config ────────────────────────────────────────────────────────────────

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    apiUrl: props.getProperty("API_URL") || "",
    apiKey: props.getProperty("API_KEY") || "",
    tenantId: props.getProperty("TENANT_ID") || "santa_fe_kia",
  };
}

// ─── Source Normalization ──────────────────────────────────────────────────

var SOURCE_MAP = {
  edmunds: "Edmunds",
  "true car": "TrueCar",
  truecar: "TrueCar",
  web: "Website",
  "web event": "Website",
  wed: "Website",
  "team velocity": "Velocity",
  velocity: "Velocity",
  apollo: "Apollo",
  autotrader: "AutoTrader",
  "auto-trader": "AutoTrader",
  "auto trader": "AutoTrader",
  ksl: "KSL",
  "car gurus": "CarGurus",
  cargurus: "CarGurus",
  carfax: "CarFax",
  "cars.com": "Cars.com",
  acura: "Acura",
  facebook: "Facebook",
  "hutton media": "Hutton Media",
  "dealer inspire": "Dealer Inspire",
  kia: "Kia",
};

function normalizeSource(raw) {
  if (!raw) return "";
  var key = raw.toString().trim().toLowerCase();
  return SOURCE_MAP[key] || raw.toString().trim();
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function isX(val) {
  if (!val) return false;
  return val.toString().trim().toLowerCase() === "x";
}

function formatDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ("0" + (val.getMonth() + 1)).slice(-2);
    var d = ("0" + val.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }
  // String date
  var str = val.toString().trim();
  if (!str) return null;
  var date = new Date(str);
  if (!isNaN(date.getTime())) {
    var y2 = date.getFullYear();
    var m2 = ("0" + (date.getMonth() + 1)).slice(-2);
    var d2 = ("0" + date.getDate()).slice(-2);
    return y2 + "-" + m2 + "-" + d2;
  }
  return null;
}

function determineSegment(newCol, usedCol, certCol, interest) {
  if (isX(newCol)) return "new";
  if (isX(usedCol)) return "used";
  if (isX(certCol)) return "cpo";
  var lower = (interest || "").toString().toLowerCase();
  if (lower.indexOf("pre owned") >= 0 || lower.indexOf("pre-owned") >= 0) return "used";
  if (lower.indexOf("2026") >= 0 || lower.indexOf("2027") >= 0 || lower.indexOf("new") >= 0)
    return "new";
  return "new";
}

function determineStatus(workingCol, deadCol, soldCol) {
  if (isX(soldCol)) return "sold";
  if (isX(deadCol)) return "dead";
  if (isX(workingCol)) return "working";
  return "working";
}

// ─── Sheet Parsing ─────────────────────────────────────────────────────────

function parseSheetLeads(sheet) {
  var data = sheet.getDataRange().getValues();
  var leads = [];

  // Skip header row (row 0)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    // Columns: 0=Date, 1=Name, 2=Source, 3=Interest, 4=New, 5=Used, 6=Certified,
    // 7=Past Actions, 8=Appt, 9=Show, 10=T/O, 11=T/O Date, 12=T/O Sales Person,
    // 13=Working, 14=Dead, 15=Future Actions, 16=Sold

    var date = formatDate(row[0]);
    var name = (row[1] || "").toString().trim();

    // Skip rows without date or name (summary rows, empty rows)
    if (!date || !name) continue;

    leads.push({
      lead_date: date,
      customer_name: name,
      source: normalizeSource(row[2]),
      interest: (row[3] || "").toString().trim(),
      segment: determineSegment(row[4], row[5], row[6], row[3]),
      past_actions: (row[7] || "").toString().trim(),
      appt: isX(row[8]) ? 1 : 0,
      show: isX(row[9]) ? 1 : 0,
      turn_over: isX(row[10]) ? 1 : 0,
      to_date: formatDate(row[11]),
      to_salesperson: (row[12] || "").toString().trim(),
      status: determineStatus(row[13], row[14], row[16]),
      future_actions: (row[15] || "").toString().trim(),
    });
  }

  return leads;
}

// ─── API Sync ──────────────────────────────────────────────────────────────

function pushLeadsToApi(leads) {
  var config = getConfig();

  if (!config.apiUrl || !config.apiKey) {
    Logger.log("ERROR: API_URL and API_KEY must be set in Script Properties");
    return { success: false, error: "Missing config" };
  }

  var payload = {
    tenant_id: config.tenantId,
    leads: leads,
    recompute_kpi: true,
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-API-Key": config.apiKey,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(config.apiUrl, options);
    var code = response.getResponseCode();
    var body = JSON.parse(response.getContentText());

    if (code === 200) {
      Logger.log(
        "Sync success: " + body.inserted + " inserted, " + body.updated + " updated"
      );
      return { success: true, data: body };
    } else {
      Logger.log("Sync failed (" + code + "): " + JSON.stringify(body));
      return { success: false, error: body.error || "Unknown error" };
    }
  } catch (e) {
    Logger.log("Sync error: " + e.toString());
    return { success: false, error: e.toString() };
  }
}

// ─── Triggers ──────────────────────────────────────────────────────────────

/**
 * Sync the current month's sheet. Set this on a 5-minute timer trigger.
 */
function syncCurrentAndPreviousMonth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var now = new Date();
  var monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Current month
  var currentName = monthNames[now.getMonth()] + ". " + now.getFullYear();

  // Previous month
  var prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var prevName = monthNames[prev.getMonth()] + ". " + prev.getFullYear();

  var sheetsToSync = [prevName, currentName];

  for (var s = 0; s < sheetsToSync.length; s++) {
    var sheetName = sheetsToSync[s];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log("Sheet not found: " + sheetName + " (skipping)");
      continue;
    }

    var leads = parseSheetLeads(sheet);
    Logger.log("Parsed " + leads.length + " leads from " + sheetName);

    if (leads.length > 0) {
      pushLeadsToApi(leads);
    }
  }
}

/**
 * Sync all month sheets. Run once for initial backfill.
 */
function initialSync() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var monthPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.\s*\d{4}$/;

  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    if (!monthPattern.test(sheet.getName())) continue;

    var leads = parseSheetLeads(sheet);
    Logger.log(sheet.getName() + ": " + leads.length + " leads");

    if (leads.length > 0) {
      pushLeadsToApi(leads);
    }
  }

  Logger.log("Initial sync complete");
}

/**
 * onEdit trigger — sync immediately when a cell is edited in a month sheet.
 * NOTE: Only use this if you want near-real-time sync. Otherwise use the timer.
 */
function onEdit(e) {
  if (!e || !e.source) return;

  var sheetName = e.source.getActiveSheet().getName();
  var monthPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.\s*\d{4}$/;

  if (!monthPattern.test(sheetName)) return;

  // Debounce: only sync if the edit is in the lead data area (columns A-Q, rows 2+)
  var range = e.range;
  if (range.getColumn() > 17 || range.getRow() < 2) return;

  // Use a lock to prevent concurrent syncs
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;

  try {
    var sheet = e.source.getActiveSheet();
    var leads = parseSheetLeads(sheet);
    if (leads.length > 0) {
      pushLeadsToApi(leads);
    }
  } finally {
    lock.releaseLock();
  }
}
