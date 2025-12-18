import * as cheerio from "cheerio";
import { marked } from "marked";

export type ParsedJob = {
  company: string;
  role: string;
  location: string;
  url: string;
  age: string | null;
  ageMinutes: number | null;
};

const iconRegex = /[🔥🇺🇸🔒🎓🛂]/g;
const exclusionRegex = /[🇺🇸🎓]/; // Icons that trigger an immediate skip
const arrowCompanyMarker = "↳";

function cleanText(input: string): string {
  return (input || "")
    .replace(/\s+/g, " ")
    .replace(iconRegex, "")
    .trim();
}

function normalizeLocationFromHtml(cellHtml: string, cellTextFallback: string): string {
  // Markdown tables often use <br> for multiple locations
  if (cellHtml && cellHtml.includes("<br")) {
    const withSeparators = cellHtml.replace(/<br\s*\/?\s*>/gi, "; ");
    const withoutTags = withSeparators.replace(/<[^>]*>/g, " ");
    return cleanText(withoutTags);
  }

  return cleanText((cellTextFallback || "").replace(/\n+/g, "; "));
}

function headersMatchJobTable(headers: string[]): boolean {
  const normalized = headers.map(h => cleanText(h).toLowerCase());
  const hasCompany = normalized.some(h => h === "company");
  const hasRole = normalized.some(h => h === "role");
  const hasLocation = normalized.some(h => h === "location");
  const hasApplication = normalized.some(h => 
    h.includes("application") || h.includes("apply") || h.includes("link")
  );
  return hasCompany && hasRole && hasLocation && hasApplication;
}

function findColumnIndex(headers: string[], predicate: (h: string) => boolean): number {
  const normalized = headers.map(h => cleanText(h).toLowerCase());
  return normalized.findIndex(predicate);
}

function parseAgeToMinutes(ageText: string): number | null {
  const normalized = cleanText(ageText).replace(/\+/g, "");
  if (!normalized) return null;

  const parts = normalized.split(/\s+/);
  let totalMinutes = 0;
  let matchedAny = false;

  for (const part of parts) {
    const match = part.match(/^(\d+)([dhm])$/i);
    if (!match) continue;

    matchedAny = true;
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === "d") totalMinutes += value * 24 * 60;
    if (unit === "h") totalMinutes += value * 60;
    if (unit === "m") totalMinutes += value;
  }

  return matchedAny ? totalMinutes : null;
}

export async function fetchAndParseSimplifyJobs(): Promise<ParsedJob[]> {
  const pageUrl =
    process.env.SIMPLIFYJOBS_PAGE_URL ??
    "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md";

  const response = await fetch(pageUrl, {
    method: "GET",
    cache: "no-store",
    headers: {
      "User-Agent": "coop-tracker"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub page: ${response.status} ${response.statusText}`);
  }

  const markdown = await response.text();
  
  // Convert Markdown to HTML so we can use Cheerio's table selectors
  const html = await marked.parse(markdown);
  const $ = cheerio.load(html);

  const parsedJobs: ParsedJob[] = [];
  const seen = new Set<string>();
  let lastCompany = "";

  $("table").each((_, tableEl) => {
    const table = $(tableEl);
    const headerRow = table.find("thead tr").first();
    const headerCells = headerRow.find("th");

    if (headerCells.length === 0) return;

    const headers = headerCells.toArray().map(th => $(th).text());

    if (!headersMatchJobTable(headers)) return;

    const companyIndex = findColumnIndex(headers, h => h === "company");
    const roleIndex = findColumnIndex(headers, h => h === "role");
    const locationIndex = findColumnIndex(headers, h => h === "location");
    const applicationIndex = findColumnIndex(headers, h => 
      h.includes("application") || h.includes("apply") || h.includes("link")
    );
    const ageIndex = findColumnIndex(headers, h => h === "age" || h.includes("date"));

    if ([companyIndex, roleIndex, locationIndex, applicationIndex].some(i => i < 0)) {
      return;
    }

    table.find("tbody tr").each((_, trEl) => {
      // 1. SKIP rows containing restricted icons
      const rowText = $(trEl).text();
      if (exclusionRegex.test(rowText)) {
        return; // Equivalent to 'continue' in a Cheerio loop
      }

      const cells = $(trEl).find("td");
      if (cells.length === 0) return;

      const companyCell = cells.eq(companyIndex);
      const roleCell = cells.eq(roleIndex);
      const locationCell = cells.eq(locationIndex);
      const applicationCell = cells.eq(applicationIndex);
      const ageCell = ageIndex >= 0 ? cells.eq(ageIndex) : null;

      // Handle nested company names (using lastCompany for "↳")
      let company = cleanText(companyCell.text());
      if (company === arrowCompanyMarker) {
        company = lastCompany;
      }
      if (!company) return;
      lastCompany = company;

      const role = cleanText(roleCell.text());
      const location = normalizeLocationFromHtml(locationCell.html() ?? "", locationCell.text());

      // In Markdown tables, the URL is inside an <a> tag created by the parser
      const applicationAnchor = applicationCell.find('a').first();
      const url = cleanText(applicationAnchor.attr("href") ?? "");

      // Ensure we have the minimum required data
      if (!role || !url) return;

      const age = ageCell ? cleanText(ageCell.text()) : "";
      const ageValue = age ? age : null;
      const ageMinutes = ageValue ? parseAgeToMinutes(ageValue) : null;

      // Deduplication check
      const key = [company, role, location, url].join("|");
      if (seen.has(key)) return;
      seen.add(key);

      parsedJobs.push({ 
        company, 
        role, 
        location, 
        url, 
        age: ageValue, 
        ageMinutes 
      });
    });
  });

  return parsedJobs;
}