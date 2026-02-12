"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/onboarding", label: "Booking" },
  { href: "/", label: "Pipeline Demo" },
  { href: "/impact", label: "Impact" },
];

export default function NavToggle() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-1.5 rounded-md transition-colors ${
              isActive
                ? "bg-white text-vueling-dark shadow-sm"
                : "text-vueling-gray hover:text-vueling-dark"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
