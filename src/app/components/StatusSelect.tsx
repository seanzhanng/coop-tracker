"use client";

import { updateJobStatus } from "@/app/actions";
import { useState, useEffect } from "react";

export default function StatusSelect({ 
  jobId, 
  currentStatus 
}: { 
  jobId: string; 
  currentStatus: string 
}) {
  const [status, setStatus] = useState(currentStatus);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value;
    setStatus(nextStatus);
    
    const formData = new FormData();
    formData.append("jobId", jobId);
    formData.append("status", nextStatus);
    
    await updateJobStatus(formData);
  };

  return (
    <select
      name="status"
      value={status}
      onChange={handleChange}
      className="text-xs font-bold border border-slate-200 dark:border-slate-700 rounded p-1 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
    >
      <option value="APPLIED">Applied</option>
      <option value="INTERVIEWING">Interviewing</option>
      <option value="REJECTED">Rejected</option>
      <option value="OFFER">Offer 🚀</option>
      <option value="OPEN">Undo (Inbox)</option>
    </select>
  );
}
