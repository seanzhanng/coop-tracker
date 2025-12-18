"use client";

import { useRouter } from "next/navigation";

export default function ClickableRow({
  children,
  url,
  className,
}: {
  children: React.ReactNode;
  url: string;
  className?: string;
}) {
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "SELECT" ||
      target.tagName === "OPTION" ||
      target.closest("button") ||
      target.closest("form")
    ) {
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <tr
      onClick={handleClick}
      className={`${className} cursor-pointer transition-colors`}
    >
      {children}
    </tr>
  );
}