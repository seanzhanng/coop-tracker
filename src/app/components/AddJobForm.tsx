"use client";

import { useState, useEffect } from "react";
import { manuallyAddJob } from "@/app/actions";

interface Props {
  existingCategories: string[];
  initialData?: {
    id: string;
    company: string;
    role: string;
    location: string;
    category: string;
    url: string;
  } | null;
  onClose?: () => void;
}

export default function AddJobForm({ existingCategories, initialData, onClose }: Props) {
  const [isOpen, setIsOpen] = useState(!!initialData);

  useEffect(() => {
    if (initialData) setIsOpen(true);
  }, [initialData]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 w-full justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500 transition-all font-bold text-sm"
      >
        + Add Manual Application
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-slate-900 dark:text-white">
          {initialData ? "Edit Entry" : "Manual Application"}
        </h2>
        <button onClick={handleClose} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
      </div>
      <form
        action={async (fd) => {
          await manuallyAddJob(fd);
          handleClose();
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {initialData && <input type="hidden" name="id" value={initialData.id} />}
        
        <input name="company" placeholder="Company" defaultValue={initialData?.company} required className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input name="role" placeholder="Role / Position" defaultValue={initialData?.role} required className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input name="location" placeholder="Location" defaultValue={initialData?.location} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        
        <select 
          name="category" 
          required 
          defaultValue={initialData?.category || ""} 
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="" disabled>Select Category</option>
          {existingCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
          <option value="Other">Other</option>
        </select>

        <div className="md:col-span-2 lg:col-span-3">
          <input name="url" placeholder="Application URL (Optional)" defaultValue={initialData?.url} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-md hover:bg-blue-700 transition-all">
          {initialData ? "Update Entry" : "Save Entry"}
        </button>
      </form>
    </div>
  );
}