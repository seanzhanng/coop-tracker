import Link from "next/link";
import prismaClient from "@/lib/prisma";
import { toggleAppliedStatus } from "@/app/actions";
import FormButton from "@/app/components/FormButton";

function formatAppliedAt(value: Date | null): string {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(value);
}

export default async function AppliedJobsPage() {
  const appliedJobs = await prismaClient.job.findMany({
    where: { applied: true },
    orderBy: [{ appliedAt: "desc" }, { company: "asc" }, { role: "asc" }, { url: "asc" }]
  });

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Applied Jobs</h1>
          <p className="text-sm text-slate-600">
            {appliedJobs.length.toLocaleString()} jobs marked applied.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back to all jobs
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Company</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Role</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Location</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Age</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Applied at</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Link</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {appliedJobs.map(job => (
                <tr key={job.id} className="bg-emerald-50">
                  <td className="px-4 py-3 align-top font-medium">{job.company}</td>
                  <td className="px-4 py-3 align-top">{job.role}</td>
                  <td className="px-4 py-3 align-top text-slate-700">{job.location}</td>
                  <td className="px-4 py-3 align-top text-slate-700">{job.age ?? "—"}</td>
                  <td className="px-4 py-3 align-top text-slate-700">{formatAppliedAt(job.appliedAt)}</td>
                  <td className="px-4 py-3 align-top">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-900 underline underline-offset-2 hover:text-slate-700"
                    >
                      Apply
                    </a>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <form action={toggleAppliedStatus}>
                      <input type="hidden" name="jobId" value={job.id} />
                      <FormButton className="rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                        Applied
                      </FormButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
