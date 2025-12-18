"use server";

import { revalidatePath } from "next/cache";
import prismaClient from "@/lib/prisma";
import { fetchAndParseSimplifyJobs } from "@/lib/simplifyJobsPull";
import { upsertJobsByUrl } from "@/lib/jobSync";
import { JobStatus } from "@prisma/client";

export async function pullJobsFromSimplifyJobs(): Promise<void> {
  const parsedJobs = await fetchAndParseSimplifyJobs();
  await upsertJobsByUrl(parsedJobs);
  revalidatePath("/");
  revalidatePath("/applied");
}

export async function updateJobStatus(formData: FormData): Promise<void> {
  const jobId = String(formData.get("jobId") ?? "");
  const status = String(formData.get("status") ?? "") as JobStatus;
  
  if (!jobId || !status) return;

  const data: any = { status };
  
  if (status === "APPLIED") {
    data.appliedAt = new Date();
  } else if (status === "OPEN") {
    data.appliedAt = null;
  }

  await prismaClient.job.update({
    where: { id: jobId },
    data
  });

  revalidatePath("/");
  revalidatePath("/applied");
}