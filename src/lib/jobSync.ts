import prismaClient from "@/lib/prisma";
import type { ParsedJob } from "@/lib/simplifyJobsPull";

export async function upsertJobsByUrl(parsedJobs: ParsedJob[]) {
  const batchSize = 100;
  for (let startIndex = 0; startIndex < parsedJobs.length; startIndex += batchSize) {
    const batch = parsedJobs.slice(startIndex, startIndex + batchSize);
    await prismaClient.$transaction(
      batch.map(job =>
        prismaClient.job.upsert({
          where: { url: job.url },
          create: {
            company: job.company,
            role: job.role,
            location: job.location,
            category: job.category,
            url: job.url,
            age: job.age,
            ageMinutes: job.ageMinutes,
          },
          update: {
            company: job.company,
            role: job.role,
            location: job.location,
            category: job.category,
            age: job.age,
            ageMinutes: job.ageMinutes,
          }
        })
      )
    );
  }
}