import Link from "next/link";
import prismaClient from "@/lib/prisma";
import { pullJobsFromSimplifyJobs, updateJobStatus } from "@/app/actions";
import FormButton from "@/app/components/FormButton";
import SearchInput from "@/app/components/SearchInput";
import ClickableRow from "@/app/components/ClickableRow";
import ThemeToggle from "./components/ThemeToggle";

function getDynamicAge(firstSeenAt: Date, githubMinutes: number | null) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const discovery = new Date(firstSeenAt.getFullYear(), firstSeenAt.getMonth(), firstSeenAt.getDate());

  const daysSinceAppSawIt = Math.floor((today.getTime() - discovery.getTime()) / 86400000);
  const daysOnGithub = githubMinutes ? Math.floor(githubMinutes / 1440) : 0;

  const finalDays = Math.max(daysSinceAppSawIt, daysOnGithub);
  return finalDays <= 0 ? "Today" : `${finalDays}d ago`;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const timeframe = typeof params.timeframe === "string" ? params.timeframe : "";
  const isCanadaOnly = params.canada === "true";
  const hideApplied = params.hideApplied === "true";
  const search = typeof params.q === "string" ? params.q : "";
  const categoryParam = typeof params.cat === "string" ? params.cat : "";
  const activeCategories = categoryParam ? categoryParam.split(",") : [];

  const where: any = {};
  if (hideApplied) where.status = "OPEN";
  
  if (timeframe) {
    const mins = timeframe === "24h" ? 1440 : timeframe === "3d" ? 4320 : 10080;
    where.ageMinutes = { lt: mins };
  }
  
  if (isCanadaOnly) where.location = { contains: "Canada", mode: "insensitive" };
  if (activeCategories.length > 0) where.category = { in: activeCategories };
  if (search) {
    where.OR = [
      { company: { contains: search, mode: "insensitive" } }, 
      { role: { contains: search, mode: "insensitive" } }
    ];
  }

  const [jobList, lastJob, categoryCounts] = await Promise.all([
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
    prismaClient.job.findFirst({ 
        where: { NOT: { url: { startsWith: "manual-" } } },
        orderBy: { firstSeenAt: "desc" } 
    }),
    prismaClient.job.groupBy({ 
      by: ['category'], 
      _count: { category: true }, 
      orderBy: { category: 'asc' } 
    })
  ]);

  const lastSynced = lastJob?.firstSeenAt 
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(lastJob.firstSeenAt) 
    : "Never";

  const getUrl = (key: string, value: string | null) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (typeof v === "string" && k !== key) sp.set(k, v); });
    if (key === "cat") {
      const current = activeCategories;
      const next = current.includes(value!) ? current.filter(x => x !== value) : [...current, value!];
      if (next.length > 0) sp.set("cat", next.join(","));
    } else if (value && params[key] !== value) sp.set(key, value);
    const query = sp.toString();
    return query ? `?${query}` : "/";
  };

  return (
    <main className="mx-auto w-full max-w-7xl py-10 px-6 antialiased">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Job Board</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 italic font-medium">Last Scraped: <span className="font-bold">{lastSynced}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/applied" className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white transition-all">Applications →</Link>
            <form action={pullJobsFromSimplifyJobs}>
              <FormButton className="rounded-lg bg-slate-900 dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-all">Pull Data</FormButton>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <SearchInput placeholder="Search company or role..." defaultValue={search} />
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {[{ label: "All", v: null }, { label: "24h", v: "24h" }, { label: "3d", v: "3d" }, { label: "1w", v: "1w" }].map((t) => (
                <Link key={t.label} href={getUrl("timeframe", t.v)} className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${(timeframe === (t.v || "")) ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}>{t.label}</Link>
              ))}
            </div>
            <div className="flex items-center gap-2 border-l pl-4 border-slate-200 dark:border-slate-800">
              <Link href={getUrl("canada", "true")} className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${isCanadaOnly ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 shadow-sm" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300"}`}>🇨🇦 Canada</Link>
              <Link href={getUrl("hideApplied", "true")} className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${hideApplied ? "bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-sm" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300"}`}>Hide Applied</Link>
              <Link href="/" className="text-xs font-bold text-slate-400 hover:text-slate-900 ml-2">Clear All</Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
             <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 self-center mr-2">Roles:</span>
             {categoryCounts.map(c => {
               const isActive = activeCategories.includes(c.category);
               return (
                 <Link key={c.category} href={getUrl("cat", c.category)} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-tight border flex items-center gap-2 transition-all ${isActive ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                   {isActive && <span>✓</span>}{c.category}<span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-500 text-blue-50' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>{c._count.category}</span>
                 </Link>
               );
             })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <th className="w-48 px-6 py-4">Company</th>
                <th className="px-6 py-4">Role & Category</th>
                <th className="w-64 px-6 py-4">Location</th>
                <th className="w-24 px-6 py-4">Posted</th>
                <th className="w-32 px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobList.map((job) => {
                const ageText = getDynamicAge(job.firstSeenAt, job.ageMinutes);
                return (
                  <ClickableRow key={job.id} url={job.url} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${job.status !== "OPEN" ? "bg-emerald-50/20 dark:bg-emerald-900/10" : ""}`}>
                    <td className="px-6 py-5 align-top font-bold text-slate-900 dark:text-white truncate">{job.company}</td>
                    <td className="px-6 py-5 align-top">
                      <div className="font-medium text-slate-700 dark:text-slate-300 truncate">{job.role}</div>
                      <div className="mt-1 text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-tight">{job.category}</div>
                    </td>
                    <td className="px-6 py-5 align-top text-slate-500 dark:text-slate-400 italic truncate">{job.location}</td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{ageText}</span>
                        {(ageText === "Today" || (job.ageMinutes !== null && job.ageMinutes < 1440)) && (
                          <span className="text-[10px] font-black text-orange-500 uppercase italic tracking-tighter">New</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top text-right">
                      <form action={updateJobStatus}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <input type="hidden" name="status" value={job.status === "OPEN" ? "APPLIED" : "OPEN"} />
                        <FormButton className={`rounded-md px-4 py-1.5 text-[11px] font-black uppercase shadow-sm transition-all ${job.status !== "OPEN" ? "bg-emerald-600 text-white border-none hover:bg-emerald-700" : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:border-slate-400 dark:hover:border-slate-600"}`}>
                          {job.status === "OPEN" ? "Apply" : job.status}
                        </FormButton>
                      </form>
                    </td>
                  </ClickableRow>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}