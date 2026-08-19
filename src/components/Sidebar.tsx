"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  Tag,
  ShoppingCart,
  Warehouse,
  CreditCard,
  Gauge,
  BarChart3,
  TrendingUp,
  Target,
  FileText,
  LayoutGrid,
  Lock,
  type LucideIcon,
} from "lucide-react";

// `href` present → real route in this app. Absent → decorative (demo only).
type NavItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: { label: string; href: string }[];
};

const navItems: NavItem[] = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "Catalog", icon: ClipboardList, href: "/products" },
  { label: "Pricing", icon: Tag },
  { label: "Orders", icon: ShoppingCart, href: "/orders" },
  { label: "WFS", icon: Warehouse },
  { label: "Payments", icon: CreditCard, href: "/payments" },
  { label: "Performance", icon: Gauge, href: "/performance" },
  {
    label: "Analytics",
    icon: BarChart3,
    children: [{ label: "Sales Insights", href: "/" }],
  },
  { label: "Growth", icon: TrendingUp },
  { label: "Advertising", icon: Target },
  { label: "Reports", icon: FileText, href: "/import" },
  { label: "Apps", icon: LayoutGrid },
];

const baseRow =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";

export default function Sidebar() {
  const pathname = usePathname();
  const isInsights = pathname === "/";

  return (
    <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-slate-200 bg-white lg:flex">
      <nav className="flex flex-col gap-0.5 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.children) {
            return (
              <div key={item.label}>
                <div
                  className={`${baseRow} ${
                    isInsights ? "text-wm-blue" : "text-slate-700"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </div>
                <div className="ml-9 flex flex-col gap-0.5">
                  {item.children.map((c) => {
                    const active = pathname === c.href;
                    return (
                      <Link
                        key={c.label}
                        href={c.href}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          active
                            ? "font-semibold text-wm-blue"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            active ? "bg-wm-blue" : "bg-slate-300"
                          }`}
                        />
                        {c.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          // "/" is the Sales Insights dashboard, highlighted via the Analytics
          // child above — no top-level item owns "/", so a simple prefix match works.
          const active = item.href ? pathname.startsWith(item.href) : false;

          if (!item.href) {
            return (
              <div
                key={item.label}
                className={`${baseRow} cursor-pointer text-slate-700 hover:bg-slate-100 hover:text-slate-900`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`${baseRow} ${
                active
                  ? "bg-blue-50 text-wm-blue"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className={`${baseRow} cursor-default text-slate-500`}>
          <Lock className="h-5 w-5" />
          Unlock
        </div>
      </div>
    </aside>
  );
}
