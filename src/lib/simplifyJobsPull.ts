import * as cheerio from "cheerio";
import { marked } from "marked";

export type ParsedJob = {
  company: string;
  role: string;
  location: string;
  url: string;
  category: string;
  age: string | null;
  ageMinutes: number | null;
};

const strictIconRegex = /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const exclusionRegex = /[🇺🇸🎓]/; 
const arrowCompanyMarker = "↳";

function cleanText(input: string): string {
  if (!input) return "";
  return input
    .replace(/\s+/g, " ")
    .replace(strictIconRegex, "")
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    .trim();
}
function cleanCategory(input: string): string {
  if (!input) return "";
  return cleanText(input)
    .replace(/,/g, "")
    .replace(/\s*Internship\s*Roles/gi, "")
    .trim();
}

function normalizeLocationFromHtml(cellHtml: string, cellTextFallback: string): string {
  if (cellHtml && cellHtml.includes("<br")) {
    const withSeparators = cellHtml.replace(/<br\s*\/?\s*>/gi, "; ");
    const withoutTags = withSeparators.replace(/<[^>]*>/g, " ");
    return cleanText(withoutTags);
  }
  return cleanText((cellTextFallback || "").replace(/\n+/g, "; "));
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
  const pageUrl = process.env.SIMPLIFYJOBS_PAGE_URL ?? "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md";
  const response = await fetch(pageUrl, { method: "GET", cache: "no-store", headers: { "User-Agent": "coop-tracker" } });
  
  const markdown = await response.text();
  const html = await marked.parse(markdown);
  const $ = cheerio.load(html);

  const parsedJobs: ParsedJob[] = [];
  const seen = new Set<string>();

  $("table").each((_, tableEl) => {
    const table = $(tableEl);
    const rawHeading = table.prevAll("h2, h3").first().text();
    const category = cleanCategory(rawHeading) || "Software Engineering";

    const headerCells = table.find("thead tr").first().find("th");
    const headers = headerCells.toArray().map(th => $(th).text().toLowerCase());

    const companyIndex = headers.findIndex(h => h.includes("company"));
    const roleIndex = headers.findIndex(h => h.includes("role"));
    const locationIndex = headers.findIndex(h => h.includes("location"));
    const applicationIndex = headers.findIndex(h => h.includes("application") || h.includes("link") || h.includes("apply"));
    const ageIndex = headers.findIndex(h => h.includes("age") || h.includes("date"));

    if ([companyIndex, roleIndex, locationIndex, applicationIndex].some(i => i < 0)) return;

    let lastCompany = "";
    table.find("tbody tr").each((_, trEl) => {
      const row = $(trEl);
      if (exclusionRegex.test(row.text())) return;
      const cells = row.find("td");
      
      let company = cleanText(cells.eq(companyIndex).text());
      if (company === arrowCompanyMarker) company = lastCompany;
      if (!company) return;
      lastCompany = company;

      const role = cleanText(cells.eq(roleIndex).text());
      const location = normalizeLocationFromHtml(cells.eq(locationIndex).html() || "", cells.eq(locationIndex).text());
      const url = cleanText(cells.eq(applicationIndex).find("a").first().attr("href") || "");
      if (!role || !url) return;

      const ageText = ageIndex >= 0 ? cleanText(cells.eq(ageIndex).text()) : "";
      const ageMinutes = parseAgeToMinutes(ageText);

      const key = `${company}|${role}|${url}`;
      if (seen.has(key)) return;
      seen.add(key);

      parsedJobs.push({ company, role, location, url, category, age: ageText, ageMinutes });
    });
  });

  return parsedJobs;
}