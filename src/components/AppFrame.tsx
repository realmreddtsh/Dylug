"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function AppFrame({
  rail,
  children,
}: {
  rail: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAppRoute = /^\/(friends|dms|guilds|settings)(\/|$)/.test(pathname);

  return (
    <>
      {isAppRoute && rail}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </>
  );
}
