"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import AddJobForm from "../components/AddJobForm";
import SearchInput from "../components/SearchInput";
import ClickableRow from "../components/ClickableRow";
import StatusSelect from "../components/StatusSelect";
import { deleteJob } from "@/app/actions";

function formatAppliedAt(value: Date | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(value);
}

export default function ApplicationClient({ jobs, stats, categories, params, activeStatusFilters }: any) {
  const [editingJob, setEditingJob] = useState<any>(null);

  const getFilterUrl = (key: string, value: string | null) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]: any) => { if (typeof v === "string" && k !== key) sp.set(k, v); });
    if (key === "status") {
      const current = activeStatusFilters;
      const next = current.includes(value!) ? current.filter((x: any) => x !== value) : [...current, value!];
      if (next.length > 0) sp.set("status", next.join(","));
    } else if (value && params[key] !== value) {
      sp.set(key, value);
    }
    const query = sp.toString();
    return query ? `?${query}` : "/applied";
  };

  return (
    <main className="mx-auto w-full max-w-7xl py-10 px-6 antialiased">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Applications</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white transition-all">← Back to Job Board</Link>
          </div>
        </div>

        <AddJobForm 
          existingCategories={categories} 
          initialData={editingJob} 
          onClose={() => setEditingJob(null)} 
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Applied</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.APPLIED}</p></div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl shadow-sm"><p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Interviews</p><p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.INTERVIEWING}</p></div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl shadow-sm"><p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Offers</p><p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.OFFER}</p></div>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rejected</p><p className="text-2xl font-bold text-slate-500 dark:text-slate-400">{stats.REJECTED}</p></div>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <SearchInput placeholder="Search your applications..." defaultValue={params.q || ""} />
          <div className="flex items-center gap-4 border-l pl-4 border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Filter Status:</span>
            <div className="flex gap-4">
              {["APPLIED", "INTERVIEWING", "OFFER", "REJECTED"].map((s) => {
                const isActive = activeStatusFilters.includes(s);
                return (
                  <Link key={s} href={getFilterUrl("status", s)} className={`flex items-center gap-2 text-xs font-bold transition-all ${isActive ? "text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}>
                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${isActive ? (s === "OFFER" ? "bg-emerald-500 border-emerald-500" : s === "INTERVIEWING" ? "bg-blue-500 border-blue-500" : "bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100") : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"}`}>{isActive && <span className={`${s === "REJECTED" ? "text-slate-900" : "text-white"} text-[10px] font-black`}>✓</span>}</div>
                    {s}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg ml-auto">
             {[{ label: "All", v: null }, { label: "24h", v: "24h" }].map(t => (
                <Link key={t.label} href={getFilterUrl("timeframe", t.v)} className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${(params.timeframe === (t.v || "")) ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}>{t.label}</Link>
             ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <th className="w-56 px-6 py-4">Company</th>
                <th className="px-6 py-4">Position & Category</th>
                <th className="w-48 px-6 py-4">Applied Date</th>
                <th className="w-48 px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map((job: any) => (
                <ClickableRow key={job.id} url={job.url} className={`${job.status === "OFFER" ? "bg-emerald-50/40 dark:bg-emerald-900/10" : job.status === "INTERVIEWING" ? "bg-blue-50/40 dark:bg-blue-900/10" : job.status === "REJECTED" ? "opacity-50 grayscale" : "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"}`}>
                  <td className="px-6 py-5 align-top font-bold text-slate-900 dark:text-white text-base">{job.company}</td>
                  <td className="px-6 py-5 align-top">
                    <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 truncate">{job.role}</div>
                    <div className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-tight">{job.category}</div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="text-slate-600 dark:text-slate-400 font-mono text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit px-2 py-1 rounded">
                      {formatAppliedAt(job.appliedAt)}
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top text-right flex flex-col gap-2 items-end">
                    <StatusSelect jobId={job.id} currentStatus={job.status} />
                    <div className="flex gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingJob(job); }}
                        className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); if(confirm("Nuke this entry?")) deleteJob(job.id); }}
                        className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}