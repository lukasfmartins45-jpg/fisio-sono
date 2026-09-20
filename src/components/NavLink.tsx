"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

export default function NavLink({
  href,
  children,
}: {
  href: Route | string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href as Route}
      className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-teal-50 text-teal-700"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </Link>
  );
}
