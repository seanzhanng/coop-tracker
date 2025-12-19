"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useState } from "react";

export default function SearchInput({ 
  placeholder, 
  defaultValue 
}: { 
  placeholder: string; 
  defaultValue: string 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="relative w-full max-w-md text-slate-400">
      <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none transition-all focus:border-slate-400 dark:focus:border-slate-600 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-800 ${
          isPending ? "opacity-70" : ""
        }`}
      />
    </div>
  );
}