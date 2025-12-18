import { NextResponse } from "next/server";
import { fetchAndParseSimplifyJobs } from "@/lib/simplifyJobsPull";
import { upsertJobsByUrl } from "@/lib/jobSync";

export async function POST() {
  try {
    const parsedJobs = await fetchAndParseSimplifyJobs();
    const syncResult = await upsertJobsByUrl(parsedJobs);
    return NextResponse.json(syncResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
