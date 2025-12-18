import Link from "next/link";
import prismaClient from "@/lib/prisma";
import { toggleAppliedStatus } from "@/app/actions";
import FormButton from "@/app/components/FormButton";

function formatAppliedAt(value: Date | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(value);
}

export default async function AppliedJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Parse Filters
  const timeframe = params.timeframe as string;
  const isCanadaOnly = params.canada === "true";
  const search = params.q as string;

  // Build Query
  const where: any = { applied: true };

  // 1. Applied Within Timeframe (using JS Dates for the 'appliedAt' column)
  if (timeframe) {
    const now = new Date();
    if (timeframe === "24h") where.appliedAt = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
    if (timeframe === "week") where.appliedAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  }

  // 2. Canada Filter
  if (isCanadaOnly) {
    where.location = { contains: "Canada", mode: "insensitive" };
  }

  // 3. Search Filter
  if (search) {
    where.OR = [
      { company: { contains: search, mode: "insensitive" } },
      { role: { contains: search, mode: "insensitive" } },
    ];
  }

  const appliedJobs = await prismaClient.job.findMany({
    where,
    orderBy: [{ appliedAt: "desc" }, { company: "asc" }]
  });

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Applied Jobs</h1>
            <p className="text-sm text-slate-600">
              {appliedJobs.length.toLocaleString()} applications tracked.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back to all jobs
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-emerald-50/30 p-4">
          {/* Search */}
          <form className="flex grow items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search your applications..."
              className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </form>

          {/* Applied Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Applied:</span>
            <div className="flex gap-1">
              {[
                { label: "All", value: "" },
                { label: "24h", value: "24h" },
                { label: "1w", value: "week" },
              ].map((t) => (
                <Link
                  key={t.value}
                  href={{ query: { ...params, timeframe: t.value } }}
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    (timeframe || "") === t.value
                      ? "bg-emerald-700 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-3 border-l border-slate-300 pl-4">
            <Link
              href={{ query: { ...params, canada: isCanadaOnly ? undefined : "true" } }}
              className={`flex items-center gap-2 text-sm font-medium ${isCanadaOnly ? "text-emerald-900" : "text-slate-400"}`}
            >
              <div className={`h-4 w-4 rounded border flex items-center justify-center ${isCanadaOnly ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-300"}`}>
                {isCanadaOnly && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
              Canada Only
            </Link>
          </div>
          
          <Link href="/applied" className="ml-auto text-xs text-slate-500 underline underline-offset-2 hover:text-emerald-800">
            Reset
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Company</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Role</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Location</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Applied at</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Link</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {appliedJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 italic">
                    No matching applications found.
                  </td>
                </tr>
              ) : (
                appliedJobs.map(job => (
                  <tr key={job.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-3 align-top font-medium whitespace-nowrap">{job.company}</td>
                    <td className="px-4 py-3 align-top">{job.role}</td>
                    <td className="px-4 py-3 align-top text-slate-700">{job.location}</td>
                    <td className="px-4 py-3 align-top text-slate-600 font-mono text-[11px]">
                      {formatAppliedAt(job.appliedAt)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                      >
                        Link
                      </a>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <form action={toggleAppliedStatus}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <FormButton className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors">
                          Undo
                        </FormButton>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}