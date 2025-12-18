import Link from "next/link";
import prismaClient from "@/lib/prisma";
import { pullJobsFromSimplifyJobs, updateJobStatus } from "@/app/actions";
import FormButton from "@/app/components/FormButton";
import SearchInput from "@/app/components/SearchInput";
import ClickableRow from "@/app/components/ClickableRow";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Normalize params for logic
  const timeframe = typeof params.timeframe === "string" ? params.timeframe : "";
  const isCanadaOnly = params.canada === "true";
  const hideApplied = params.hideApplied === "true";
  const search = typeof params.q === "string" ? params.q : "";

  // Build Prisma Query
  const where: any = {};
  if (hideApplied) where.status = "OPEN";
  if (timeframe === "24h") where.ageMinutes = { lte: 1440 };
  else if (timeframe === "week") where.ageMinutes = { lte: 10080 };
  if (isCanadaOnly) where.location = { contains: "Canada", mode: "insensitive" };
  if (search) {
    where.OR = [
      { company: { contains: search, mode: "insensitive" } },
      { role: { contains: search, mode: "insensitive" } },
    ];
  }

  // Fetch data with exact ordering requested
  const [totalCount, inProgressCount, jobList, lastJob] = await Promise.all([
    prismaClient.job.count(),
    prismaClient.job.count({ where: { NOT: { status: "OPEN" } } }),
    prismaClient.job.findMany({
      where,
      orderBy: [
        { ageMinutes: "asc" }, 
        { company: "asc" }, 
        { role: "asc" }, 
        { url: "asc" }
      ],
      take: 2000,
    }),
    prismaClient.job.findFirst({ orderBy: { lastSeenAt: "desc" } })
  ]);

  const lastSynced = lastJob?.lastSeenAt 
    ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).format(lastJob.lastSeenAt)
    : "Never";

  // Working filter logic: correctly deletes keys to prevent "sticky" filters
  const getUrl = (key: string, value: string | null) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === "string") sp.set(k, v);
    });

    // Toggle behavior: if value is already active, remove it
    if (!value || params[key] === value) {
      sp.delete(key);
    } else {
      sp.set(key, value);
    }
    
    const query = sp.toString();
    return query ? `?${query}` : "/";
  };

  return (
    <main className="mx-auto w-full max-w-7xl p-6 antialiased">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Opportunity Inbox</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <p>Sorted by: <span className="font-semibold text-slate-700">Newest Postings</span></p>
              <span>•</span>
              <p>Last Pulled: <span className="font-mono text-xs font-bold text-slate-600">{lastSynced}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/applied" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
              Tracking Board →
            </Link>
            <form action={pullJobsFromSimplifyJobs}>
              <FormButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-all">
                Pull Data
              </FormButton>
            </form>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SearchInput placeholder="Search company or role..." defaultValue={search} />

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {[{ label: "All", v: null }, { label: "24h", v: "24h" }, { label: "1w", v: "week" }].map((t) => (
                <Link
                  key={t.label}
                  href={getUrl("timeframe", t.v)}
                  className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
                    (timeframe === (t.v || "")) ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>

            <Link
              href={getUrl("canada", "true")}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                isCanadaOnly ? "bg-red-50 border-red-200 text-red-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <div className={`h-3 w-3 rounded-full ${isCanadaOnly ? "bg-red-500" : "bg-slate-200"}`} />
              🇨🇦 Canada Only
            </Link>

            <Link
              href={getUrl("hideApplied", "true")}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                hideApplied ? "bg-slate-900 border-slate-900 text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <div className={`h-3 w-3 rounded-full ${hideApplied ? "bg-emerald-400" : "bg-slate-200"}`} />
              Hide Applied
            </Link>
            
            <Link href="/" className="text-xs font-bold text-slate-400 hover:text-slate-900 ml-2">
              Clear All
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                <th className="w-48 px-6 py-4">Company</th>
                <th className="px-6 py-4">Role</th>
                <th className="w-64 px-6 py-4">Location</th>
                <th className="w-24 px-6 py-4">Posted</th>
                <th className="w-32 px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobList.map((job) => (
                <ClickableRow key={job.id} url={job.url} className={`hover:bg-slate-50 ${job.status !== "OPEN" ? "bg-emerald-50/20" : ""}`}>
                  <td className="px-6 py-5 align-top font-bold text-slate-900 truncate">{job.company}</td>
                  <td className="px-6 py-5 align-top font-medium text-slate-700 truncate">{job.role}</td>
                  <td className="px-6 py-5 align-top text-slate-500 leading-snug italic truncate">{job.location}</td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-600 font-medium">{job.age ?? "—"}</span>
                      {job.ageMinutes !== null && job.ageMinutes < 1440 && (
                        <span className="text-[10px] font-black text-orange-500 uppercase italic tracking-tighter">New</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top text-right">
                    <form action={updateJobStatus}>
                      <input type="hidden" name="jobId" value={job.id} />
                      <input type="hidden" name="status" value={job.status === "OPEN" ? "APPLIED" : "OPEN"} />
                      <FormButton className={`rounded-md px-4 py-1.5 text-[11px] font-black uppercase tracking-tighter transition-all shadow-sm ${
                        job.status !== "OPEN" ? "bg-emerald-600 text-white" : "border border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                      }`}>
                        {job.status === "OPEN" ? "Apply" : job.status}
                      </FormButton>
                    </form>
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
          {jobList.length === 0 && (
            <div className="py-24 text-center text-slate-400 italic font-medium">No results for current filters.</div>
          )}
        </div>
      </div>
    </main>
  );
}