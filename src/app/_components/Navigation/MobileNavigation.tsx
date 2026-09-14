"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  House,
  Plus,
  Settings,
} from "lucide-react";

const navigationItems = [
  {
    label: "ホーム",
    href: null, // リンク先未設定の場合null
    icon: House,
    kind: "normal",
  },
  {
    label: "カレンダー",
    href: null,
    icon: CalendarDays,
    kind: "normal",
  },
  {
    label: "今日の記録",
    href: "/daily_record",
    icon: Plus,
    kind: "primary",
  },
  {
    label: "統計",
    href: null,
    icon: ChartNoAxesColumnIncreasing,
    kind: "normal",
  },
  {
    label: "設定",
    href: "/settings/delivery_types",
    icon: Settings,
    kind: "normal",
  },
];

export const MobileNavigation = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="メインメニュー"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card md:hidden"
    >
      <div className="mx-auto grid h-15 w-full max-w-[470px] grid-cols-5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href !== null && pathname === item.href;

          // リンク先未設定の場合null
          if (item.href === null) {
            return (
              <span
                key={item.label}
                aria-disabled="true"
                className="flex h-15 cursor-not-allowed flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground opacity-50"
              >
                <Icon size={20} aria-hidden="true" />
                <span>{item.label}</span>
              </span>
            );
          }

          // 中央の＋だけ、通常メニューとは別の見た目を返す
          if (item.kind === "primary") {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className="relative flex h-15 items-center justify-center"
              >
                {/* mainとメニューの境界を円形に切り抜く外枠 */}
                <span className="absolute -top-6 z-10 flex size-17 items-center justify-center rounded-full border border-border bg-card">
                  {/* 実際のオレンジボタン */}
                  <span className="flex size-15 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <Icon size={32} aria-hidden="true" />
                  </span>
                </span>
              </Link>
            );
          }

          // それ以外の4項目は同じ見た目
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-15 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
