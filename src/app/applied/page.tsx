import Link from "next/link";
import prismaClient from "@/lib/prisma";
import StatusSelect from "@/app/components/StatusSelect";
import SearchInput from "@/app/components/SearchInput";
import ClickableRow from "@/app/components/ClickableRow";

function formatAppliedAt(value: Date | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { 
    month: "short", 
    day: "numeric", 
    hour: "numeric", 
    minute: "2-digit" 
  }).format(value);
}

export default async function AppliedJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Normalize params
  const timeframe = typeof params.timeframe === "string" ? params.timeframe : "";
  const search = typeof params.q === "string" ? params.q : "";
  const statusParam = typeof params.status === "string" ? params.status : "";
  const activeStatusFilters = statusParam ? statusParam.split(",") : [];

  const where: any = { NOT: { status: "OPEN" } };

  if (timeframe) {
    const now = new Date();
    const ms = timeframe === "24h" ? 86400000 : 604800000;
    where.appliedAt = { gte: new Date(now.getTime() - ms) };
  }

  if (activeStatusFilters.length > 0) {
    where.status = { in: activeStatusFilters };
  }

  if (search) {
    where.OR = [
      { company: { contains: search, mode: "insensitive" } },
      { role: { contains: search, mode: "insensitive" } },
    ];
  }

  // Preservation of your specific ordering
  const [jobs, allActive] = await Promise.all([
    prismaClient.job.findMany({
      where,
      orderBy: [
        { appliedAt: "desc" }, 
        { company: "asc" }, 
        { role: "asc" }, 
        { url: "asc" }
      ]
    }),
    prismaClient.job.findMany({ where: { NOT: { status: "OPEN" } } })
  ]);

  const stats = {
    APPLIED: allActive.filter(j => j.status === "APPLIED").length,
    INTERVIEWING: allActive.filter(j => j.status === "INTERVIEWING").length,
    OFFER: allActive.filter(j => j.status === "OFFER").length,
    REJECTED: allActive.filter(j => j.status === "REJECTED").length,
  };

  // Robust URL builder to prevent "sticky" filters
  const getFilterUrl = (key: string, value: string | null) => {
    const sp = new URLSearchParams();
    
    // Copy existing params except the one we are toggling
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === "string" && k !== key) sp.set(k, v);
    });

    if (key === "status") {
      const current = activeStatusFilters;
      const next = current.includes(value!) 
        ? current.filter(x => x !== value) 
        : [...current, value!];
      
      if (next.length > 0) sp.set("status", next.join(","));
    } else if (value && params[key] !== value) {
      sp.set(key, value);
    }

    const query = sp.toString();
    return query ? `?${query}` : "/applied";
  };

  return (
    <main className="mx-auto w-full max-w-7xl p-6 antialiased">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tracking Board</h1>
            <p className="text-slate-500 mt-1 italic text-sm">
              Sorted by: <span className="font-semibold text-slate-700">Latest Applications</span>
            </p>
          </div>
          <Link href="/" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
            ← Back to Inbox
          </Link>
        </div>

        {/* Compact Stats Overview Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Applied</p>
            <p className="text-2xl font-bold text-slate-900">{stats.APPLIED}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl shadow-sm">
            <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Interviews</p>
            <p className="text-2xl font-bold text-blue-700">{stats.INTERVIEWING}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl shadow-sm">
            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Offers</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.OFFER}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rejected</p>
            <p className="text-2xl font-bold text-slate-500">{stats.REJECTED}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SearchInput placeholder="Search your applications..." defaultValue={search} />
          
          <div className="flex items-center gap-4 border-l pl-4 border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-400">Filter Status:</span>
            <div className="flex gap-4">
              {["APPLIED", "INTERVIEWING", "OFFER", "REJECTED"].map((s) => {
                const isActive = activeStatusFilters.includes(s);
                return (
                  <Link
                    key={s}
                    href={getFilterUrl("status", s)}
                    className={`flex items-center gap-2 text-xs font-bold transition-all ${
                      isActive ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                      isActive 
                        ? (s === "OFFER" ? "bg-emerald-500 border-emerald-500" : s === "INTERVIEWING" ? "bg-blue-500 border-blue-500" : "bg-slate-900 border-slate-900") 
                        : "bg-white border-slate-300"
                    }`}>
                      {isActive && <span className="text-white text-[10px]">✓</span>}
                    </div>
                    {s}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg ml-auto">
             {[{ label: "All", v: null }, { label: "24h", v: "24h" }].map(t => (
                <Link 
                  key={t.label} 
                  href={getFilterUrl("timeframe", t.v)} 
                  className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${
                    (timeframe === (t.v || "")) ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.label}
                </Link>
             ))}
          </div>
          
          <Link href="/applied" className="text-xs font-bold text-slate-400 hover:text-slate-900 ml-2">
            Clear All
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                <th className="w-56 px-6 py-4">Company</th>
                <th className="px-6 py-4">Position</th>
                <th className="w-48 px-6 py-4">Applied Date</th>
                <th className="w-48 px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map(job => (
                <ClickableRow key={job.id} url={job.url} className={`${
                  job.status === "OFFER" ? "bg-emerald-50/40" : 
                  job.status === "INTERVIEWING" ? "bg-blue-50/40" : 
                  job.status === "REJECTED" ? "opacity-50 grayscale" : "hover:bg-slate-50"
                }`}>
                  <td className="px-6 py-5 align-top font-bold text-slate-900 text-base">{job.company}</td>
                  <td className="px-6 py-5 align-top">
                    <div className="font-medium text-slate-700 mb-1 truncate">{job.role}</div>
                    <div className="text-xs text-slate-400 italic truncate">{job.location}</div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="text-slate-600 font-mono text-[11px] bg-white border border-slate-200 w-fit px-2 py-1 rounded">
                      {formatAppliedAt(job.appliedAt)}
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top text-right">
                    <StatusSelect jobId={job.id} currentStatus={job.status} />
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && <div className="py-24 text-center text-slate-400 italic font-medium">No applications found.</div>}
        </div>
      </div>
    </main>
  );
}