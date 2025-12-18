import Link from "next/link";
import prismaClient from "@/lib/prisma";
import { pullJobsFromSimplifyJobs, toggleAppliedStatus } from "@/app/actions";
import FormButton from "@/app/components/FormButton";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Parse Filter Params
  const timeframe = params.timeframe as string;
  const isCanadaOnly = params.canada === "true";
  const hideApplied = params.hideApplied === "true";
  const search = params.q as string;

  // Build Prisma Where Clause
  const where: any = {};

  // 1. Timeframe Filter (using ageMinutes)
  if (timeframe === "24h") where.ageMinutes = { lte: 24 * 60 };
  else if (timeframe === "week") where.ageMinutes = { lte: 7 * 24 * 60 };
  else if (timeframe === "month") where.ageMinutes = { lte: 30 * 24 * 60 };

  // 2. Canada Filter
  if (isCanadaOnly) {
    where.location = { contains: "Canada", mode: "insensitive" };
  }

  // 3. Hide Applied Filter
  if (hideApplied) {
    where.applied = false;
  }

  // 4. Search Filter
  if (search) {
    where.OR = [
      { company: { contains: search, mode: "insensitive" } },
      { role: { contains: search, mode: "insensitive" } },
    ];
  }

  const [totalJobCount, appliedJobCount, jobList] = await Promise.all([
    prismaClient.job.count(),
    prismaClient.job.count({ where: { applied: true } }),
    prismaClient.job.findMany({
      where,
      orderBy: [{ ageMinutes: "asc" }, { company: "asc" }],
      take: 1000, // Reduced slightly for performance
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Coop Tracker</h1>
            <p className="text-sm text-slate-600">
              {totalJobCount.toLocaleString()} jobs, {appliedJobCount.toLocaleString()} applied.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/applied"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
            >
              View applied
            </Link>
            <form action={pullJobsFromSimplifyJobs}>
              <FormButton className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Pull
              </FormButton>
            </form>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {/* Search */}
          <form className="flex grow items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search company or role..."
              className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            />
          </form>

          {/* Timeframe Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Age:</span>
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
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
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
              className={`flex items-center gap-2 text-sm font-medium ${isCanadaOnly ? "text-slate-900" : "text-slate-400"}`}
            >
              <div className={`h-4 w-4 rounded border flex items-center justify-center ${isCanadaOnly ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300"}`}>
                {isCanadaOnly && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
              Canada Only
            </Link>

            <Link
              href={{ query: { ...params, hideApplied: hideApplied ? undefined : "true" } }}
              className={`flex items-center gap-2 text-sm font-medium ${hideApplied ? "text-slate-900" : "text-slate-400"}`}
            >
              <div className={`h-4 w-4 rounded border flex items-center justify-center ${hideApplied ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300"}`}>
                {hideApplied && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
              Hide Applied
            </Link>
          </div>
          
          {/* Clear Filters */}
          <Link href="/" className="ml-auto text-xs text-slate-500 underline underline-offset-2 hover:text-slate-800">
            Clear
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-52 px-4 py-3 text-left font-medium text-slate-700">Company</th>
                <th className="w-[38%] px-4 py-3 text-left font-medium text-slate-700">Role</th>
                <th className="w-[24%] px-4 py-3 text-left font-medium text-slate-700">Location</th>
                <th className="w-20 px-4 py-3 text-left font-medium text-slate-700">Age</th>
                <th className="w-20 px-4 py-3 text-left font-medium text-slate-700">Link</th>
                <th className="w-32 px-4 py-3 text-left font-medium text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {jobList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No jobs found with these filters.
                  </td>
                </tr>
              ) : (
                jobList.map((job) => (
                  <tr key={job.id} className={job.applied ? "bg-emerald-50/50" : "hover:bg-slate-50"}>
                    <td className="px-4 py-3 align-top font-medium whitespace-nowrap">{job.company}</td>
                    <td className="px-4 py-3 align-top whitespace-normal break-words">{job.role}</td>
                    <td className="px-4 py-3 align-top text-slate-700 whitespace-normal break-words">{job.location}</td>
                    <td className="px-4 py-3 align-top text-slate-700 whitespace-nowrap">{job.age ?? "—"}</td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-900 underline underline-offset-2 hover:text-slate-700"
                      >
                        Apply
                      </a>
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <form action={toggleAppliedStatus}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <FormButton
                          className={
                            job.applied
                              ? "rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                              : "rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                          }
                        >
                          {job.applied ? "Applied" : "Mark applied"}
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

      <p className="mt-4 text-xs text-slate-500">Data source: SimplifyJobs Summer 2026 internships list.</p>
    </main>
  );
}