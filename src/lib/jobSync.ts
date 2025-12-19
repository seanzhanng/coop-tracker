import prismaClient from "@/lib/prisma";
import type { ParsedJob } from "@/lib/simplifyJobsPull";

export type SyncResult = {
  insertedCount: number;
  updatedCount: number;
  totalParsedCount: number;
};

export async function upsertJobsByUrl(parsedJobs: ParsedJob[]): Promise<SyncResult> {
  const now = new Date();
  let insertedCount = 0;
  let updatedCount = 0;

  const batchSize = 100;
  for (let startIndex = 0; startIndex < parsedJobs.length; startIndex += batchSize) {
    const batch = parsedJobs.slice(startIndex, startIndex + batchSize);
    const batchResults = await prismaClient.$transaction(
      batch.map(job =>
        prismaClient.job.upsert({
          where: { url: job.url },
          create: {
            company: job.company,
            role: job.role,
            location: job.location,
            age: job.age,
            ageMinutes: job.ageMinutes,
            url: job.url,
            firstSeenAt: now,
            // lastSeenAt is updated via @updatedAt in schema
          },
          update: {
            company: job.company,
            role: job.role,
            location: job.location,
            // Keep age updated so your "ageMinutes" sorting stays accurate to GitHub
            age: job.age,
            ageMinutes: job.ageMinutes,
          }
        })
      )
    );

    for (const jobRecord of batchResults) {
      // Check if it was just created (Prisma transaction returns the record)
      if (jobRecord.firstSeenAt.getTime() === now.getTime()) {
        insertedCount += 1;
      } else {
        updatedCount += 1;
      }
    }
  }

  return { insertedCount, updatedCount, totalParsedCount: parsedJobs.length };
}