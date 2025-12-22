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

export async function deleteJob(jobId: string) {
  await prismaClient.job.delete({ where: { id: jobId } });
  revalidatePath("/");
  revalidatePath("/applied");
}

export async function manuallyAddJob(formData: FormData) {
  const id = formData.get("id") as string | null;
  const company = formData.get("company") as string;
  const role = formData.get("role") as string;
  const location = formData.get("location") as string;
  const category = formData.get("category") as string;
  const url = (formData.get("url") as string) || `manual-${Date.now()}`;

  const data = {
    company,
    role,
    location,
    category: category || "Software Engineering",
    url,
  };

  if (id) {
    await prismaClient.job.update({
      where: { id },
      data,
    });
  } else {
    await prismaClient.job.create({
      data: {
        ...data,
        status: "APPLIED",
        appliedAt: new Date(),
      },
    });
  }

  revalidatePath("/applied");
  revalidatePath("/");
}