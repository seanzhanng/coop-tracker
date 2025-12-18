import * as cheerio from "cheerio";

export type ParsedJob = {
  company: string;
  role: string;
  location: string;
  url: string;
};

const iconRegex = /[🔥🇺🇸🔒🎓🛂]/g;
const arrowCompanyMarker = "↳";

function cleanText(input: string): string {
  return (input || "")
    .replace(/\s+/g, " ")
    .replace(iconRegex, "")
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

function headersMatchJobTable(headers: string[]): boolean {
  const normalized = headers.map(h => cleanText(h).toLowerCase());
  const hasCompany = normalized.some(h => h === "company");
  const hasRole = normalized.some(h => h === "role");
  const hasLocation = normalized.some(h => h === "location");
  const hasApplication = normalized.some(h => h.includes("application") || h.includes("apply") || h.includes("link"));
  return hasCompany && hasRole && hasLocation && hasApplication;
}

function findColumnIndex(headers: string[], predicate: (h: string) => boolean): number {
  const normalized = headers.map(h => cleanText(h).toLowerCase());
  return normalized.findIndex(predicate);
}

export async function fetchAndParseSimplifyJobs(): Promise<ParsedJob[]> {
  const pageUrl =
    process.env.SIMPLIFYJOBS_PAGE_URL ?? "https://github.com/SimplifyJobs/Summer2026-Internships";

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

  const html = await response.text();
  const $ = cheerio.load(html);

  const parsedJobs: ParsedJob[] = [];
  const seen = new Set<string>();
  let lastCompany = "";

  $("table").each((_, tableEl) => {
    const table = $(tableEl);

    const headerRow = table.find("thead tr").first();
    const headerCells = headerRow.find("th");

    if (headerCells.length === 0) {
      return;
    }

    const headers = headerCells
      .toArray()
      .map(th => $(th).text());

    if (!headersMatchJobTable(headers)) {
      return;
    }

    const companyIndex = findColumnIndex(headers, h => h === "company");
    const roleIndex = findColumnIndex(headers, h => h === "role");
    const locationIndex = findColumnIndex(headers, h => h === "location");
    const applicationIndex = findColumnIndex(headers, h => h.includes("application") || h.includes("apply") || h.includes("link"));

    if ([companyIndex, roleIndex, locationIndex, applicationIndex].some(i => i < 0)) {
      return;
    }

    table.find("tbody tr").each((_, trEl) => {
      const cells = $(trEl).find("td");
      if (cells.length === 0) return;

      const companyCell = cells.eq(companyIndex);
      const roleCell = cells.eq(roleIndex);
      const locationCell = cells.eq(locationIndex);
      const applicationCell = cells.eq(applicationIndex);

      let company = cleanText(companyCell.text());
      if (company === arrowCompanyMarker) company = lastCompany;
      if (!company) return;
      lastCompany = company;

      const role = cleanText(roleCell.text());
      const location = normalizeLocationFromHtml(locationCell.html() ?? "", locationCell.text());

      const applicationAnchor = applicationCell.find('a[href^="http"]').first();
      const url = cleanText(applicationAnchor.attr("href") ?? "");

      if (!role || !url) return;

      const key = [company, role, location, url].join("|");
      if (seen.has(key)) return;
      seen.add(key);

      parsedJobs.push({ company, role, location, url });
    });
  });

  return parsedJobs;
}
