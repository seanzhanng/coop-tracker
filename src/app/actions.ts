"use server";

import { revalidatePath } from "next/cache";
import prismaClient from "@/lib/prisma";
import { fetchAndParseSimplifyJobs } from "@/lib/simplifyJobsPull";
import { upsertJobsByUrl } from "@/lib/jobSync";

export async function pullJobsFromSimplifyJobs(): Promise<void> {
  const parsedJobs = await fetchAndParseSimplifyJobs();
  await upsertJobsByUrl(parsedJobs);
  revalidatePath("/");
  revalidatePath("/applied");
}

export async function toggleAppliedStatus(formData: FormData): Promise<void> {
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) return;

  const jobRecord = await prismaClient.job.findUnique({ where: { id: jobId } });
  if (!jobRecord) return;

  const nextAppliedValue = !jobRecord.applied;
  await prismaClient.job.update({
    where: { id: jobId },
    data: {
      applied: nextAppliedValue,
      appliedAt: nextAppliedValue ? new Date() : null
    }
  });

  revalidatePath("/");
  revalidatePath("/applied");
}
