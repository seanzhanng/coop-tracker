import prismaClient from "@/lib/prisma";
import ApplicationClient from "./ApplicationClient";
import { JobStatus } from "@prisma/client";

export default async function AppliedJobsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const timeframe = typeof params.timeframe === "string" ? params.timeframe : "";
  const search = typeof params.q === "string" ? params.q : "";
  const statusParam = typeof params.status === "string" ? params.status : "";
  const activeStatusFilters = statusParam ? statusParam.split(",") : [];

  const activeStatuses: JobStatus[] = ["APPLIED", "INTERVIEWING", "OFFER", "REJECTED"];

  const where: any = { status: { in: activeStatuses } };
  
  if (timeframe) {
    const now = new Date();
    const ms = timeframe === "24h" ? 86400000 : 604800000;
    where.appliedAt = { gte: new Date(now.getTime() - ms) };
  }
  
  if (activeStatusFilters.length > 0) {
    where.status = { in: activeStatusFilters as JobStatus[] };
  }
  
  if (search) {
    where.OR = [
      { company: { contains: search, mode: "insensitive" } }, 
      { role: { contains: search, mode: "insensitive" } }
    ];
  }

  const [jobs, allActive, categories] = await Promise.all([
    prismaClient.job.findMany({
      where,
      orderBy: [{ appliedAt: "desc" }, { company: "asc" }, { role: "asc" }, { url: "asc" }]
    }),
    prismaClient.job.findMany({ where: { status: { in: activeStatuses } } }),
    prismaClient.job.findMany({
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' }
    })
  ]);

  const stats = {
    APPLIED: allActive.filter(j => j.status === "APPLIED").length,
    INTERVIEWING: allActive.filter(j => j.status === "INTERVIEWING").length,
    OFFER: allActive.filter(j => j.status === "OFFER").length,
    REJECTED: allActive.filter(j => j.status === "REJECTED").length,
  };

  return (
    <ApplicationClient 
      jobs={jobs} 
      stats={stats} 
      categories={categories.map(c => c.category)} 
      params={params}
      activeStatusFilters={activeStatusFilters}
    />
  );
}