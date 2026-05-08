// ─── CSV Parsing & Variable Substitution for Post Office ─────────

/** Strip UTF-8 BOM that SQL Server exports often include */
function stripBOM(text: string): string {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

/** Detect whether delimiter is comma, tab, or pipe */
export function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] || "";
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const pipes = (firstLine.match(/\|/g) || []).length;
  if (tabs >= commas && tabs >= pipes) return "\t";
  if (pipes > commas) return "|";
  return ",";
}

/** Parse a single CSV line respecting quoted fields */
function parseLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  delimiter: string;
  rowCount: number;
}

/** Parse raw CSV text into headers + rows */
export function parseCSV(raw: string): CsvParseResult {
  const text = stripBOM(raw).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const delimiter = detectDelimiter(text);
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [], delimiter, rowCount: 0 };
  const headers = parseLine(lines[0], delimiter);
  const rows = lines.slice(1).map((l) => parseLine(l, delimiter));
  return { headers, rows, delimiter, rowCount: rows.length };
}

/** Validate an email address (basic) */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Column Mapping ──────────────────────────────────────────────

export interface ColumnMapping {
  csvColumn: string;
  role: "email" | "name" | "variable" | "skip";
  variableName?: string;
}

/** Slugify a header name to a variable name: "ReviewURL" → "review_url" */
function toVarName(header: string): string {
  return header
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

/** Auto-detect column mappings from header names */
export function autoMapColumns(headers: string[]): ColumnMapping[] {
  return headers.map((h) => {
    const lower = h.toLowerCase().trim();
    // Email column
    if (lower === "email" || lower === "e-mail" || lower === "emailaddress" || lower === "email_address") {
      return { csvColumn: h, role: "email" as const };
    }
    // Name column
    if (lower === "username" || lower === "name" || lower === "firstname" || lower === "first_name" || lower === "customername" || lower === "customer_name") {
      return { csvColumn: h, role: "name" as const };
    }
    // ReviewURL → product_url variable
    if (lower === "reviewurl" || lower === "review_url") {
      return { csvColumn: h, role: "variable" as const, variableName: "product_url" };
    }
    // Language → language variable
    if (lower === "language" || lower === "languagedescription") {
      return { csvColumn: h, role: "variable" as const, variableName: "language" };
    }
    // Market → market variable
    if (lower === "market" || lower === "maincountry" || lower === "country") {
      return { csvColumn: h, role: "variable" as const, variableName: "market" };
    }
    // Products
    if (lower === "products" || lower === "itemcodes" || lower === "items") {
      return { csvColumn: h, role: "variable" as const, variableName: "products" };
    }
    // OrderID
    if (lower === "orderid" || lower === "order_id") {
      return { csvColumn: h, role: "variable" as const, variableName: "order_id" };
    }
    // Skip opt-in flags, IDs, and other metadata by default
    if (lower.includes("optin") || lower.includes("subscribed") || lower === "customerid" || lower === "customer_id" || lower === "customertypeid" || lower === "customertype" || lower === "orderdate" || lower === "rn") {
      return { csvColumn: h, role: "skip" as const };
    }
    // Default: map as a variable
    return { csvColumn: h, role: "variable" as const, variableName: toVarName(h) };
  });
}

// ─── Recipient Building ──────────────────────────────────────────

export interface CsvRecipient {
  email: string;
  name: string;
  variables: Record<string, string>;
  rowIndex: number;
}

export interface RecipientResult {
  recipients: CsvRecipient[];
  errors: { row: number; reason: string }[];
  optedOut: number;
}

/** Build validated recipient list from parsed CSV + mappings */
export function buildRecipients(
  parsed: CsvParseResult,
  mappings: ColumnMapping[],
): RecipientResult {
  const emailIdx = mappings.findIndex((m) => m.role === "email");
  const nameIdx = mappings.findIndex((m) => m.role === "name");
  const optInIdx = parsed.headers.findIndex((h) => {
    const l = h.toLowerCase();
    return l === "isemailsubscribed" || l === "emailoptin" || l === "email_opt_in";
  });

  const recipients: CsvRecipient[] = [];
  const errors: { row: number; reason: string }[] = [];
  let optedOut = 0;

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i];

    // Check email
    const email = emailIdx >= 0 ? (row[emailIdx] || "").trim() : "";
    if (!email || !validateEmail(email)) {
      errors.push({ row: i + 2, reason: email ? "Invalid email" : "Missing email" });
      continue;
    }

    // Check opt-in
    if (optInIdx >= 0) {
      const val = (row[optInIdx] || "").trim().toLowerCase();
      if (val === "false" || val === "0" || val === "n" || val === "no") {
        optedOut++;
        continue;
      }
    }

    const name = nameIdx >= 0 ? (row[nameIdx] || "").trim() : "";
    const variables: Record<string, string> = {};
    for (let j = 0; j < mappings.length; j++) {
      const m = mappings[j];
      if (m.role === "variable" && m.variableName) {
        variables[m.variableName] = (row[j] || "").trim();
      }
    }

    recipients.push({ email, name, variables, rowIndex: i + 2 });
  }

  return { recipients, errors, optedOut };
}

/** Substitute all {variables} in a template string for a single recipient */
export function substituteForRecipient(
  template: string,
  recipient: CsvRecipient,
): string {
  let result = template;
  // Name
  result = result.replaceAll("{{name}}", recipient.name);
  result = result.replaceAll("{name}", recipient.name);
  // All variables
  for (const [key, value] of Object.entries(recipient.variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}
