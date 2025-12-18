import Link from "next/link";
import prismaClient from "@/lib/prisma";
import { pullJobsFromSimplifyJobs, toggleAppliedStatus } from "@/app/actions";
import FormButton from "@/app/components/FormButton";

export default async function HomePage() {
  const [totalJobCount, appliedJobCount, jobList] = await Promise.all([
    prismaClient.job.count(),
    prismaClient.job.count({ where: { applied: true } }),
    prismaClient.job.findMany({
      orderBy: [{ ageMinutes: "asc" }, { company: "asc" }, { role: "asc" }, {url: "asc"}],
      take: 5000
    })
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Coop Tracker</h1>
          <p className="text-sm text-slate-600">
            {totalJobCount.toLocaleString()} jobs in database, {appliedJobCount.toLocaleString()} marked applied.
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
              {jobList.map(job => (
                <tr key={job.id} className={job.applied ? "bg-emerald-50" : ""}>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">Data source: SimplifyJobs Summer 2026 internships list.</p>
    </main>
  );
}
