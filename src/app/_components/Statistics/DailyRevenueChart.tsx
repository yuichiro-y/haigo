import type { StatisticsDay } from "@/app/_types/statistics";
import {
  format,
  parseISO,
} from "date-fns";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  days: StatisticsDay[];
};

export const DailyRevenueChart = ({ days }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleView = () => {
    setIsExpanded((current) => !current);
  };

  if (days.length === 0) {
    return (
      <section className="mt-2 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-bold">記録日の収益グラフ</h2>
        <p className="py-10 text-center text-sm text-muted-foreground">
          この月の記録はありません
        </p>
      </section>
    );
  }

  return (
      <section className="mt-2 min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-between">
          <h2 className="mb-4 text-sm font-bold text-foreground">
            記録日の収益グラフ
          </h2>
          <button
            type="button"
            onClick={handleToggleView}
            className="mb-3 rounded-lg border border-border px-3 py-2 text-xs font-medium"
          >
            {isExpanded ? "全体を表示" : "拡大して表示"}
          </button>
        </div>
        <div
          key={isExpanded ? "expanded" : "overview"}
          className={isExpanded ? "overflow-x-auto" : "overflow-x-hidden"}
        >
          <div
            className="h-64"
            style={{
              width: "100%",
              minWidth: isExpanded
                ? Math.max(360, days.length * 36 + 44)
                : 0,
            }}
          >
            {/* グラフ */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={days}
                className="
                  [&_.recharts-surface]:outline-none
                  [&_.recharts-surface:focus-visible]:outline
                  [&_.recharts-surface:focus-visible]:outline-2
                  [&_.recharts-surface:focus-visible]:outline-ring
                  [&_[tabindex='-1']]:outline-none
                "
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="workDate"
                  tickFormatter={(value: string) => format(parseISO(value), "d")}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  height={28}
                />

                <YAxis
                  tickFormatter={(value: number) =>
                    value === 0 ? "0" : `${value / 1000}k`
                  }
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={6}
                  width={34}
                />
                <Tooltip
                  formatter={(value) => [
                    typeof value === "number"
                      ? `¥${value.toLocaleString("ja-JP")}`
                      : value,
                    "収益",
                  ]}
                  position={{ y: 8 }}
                  offset={12}
                  labelFormatter={(label) =>
                    typeof label === "string"
                      ? format(parseISO(label), "M月d日")
                      : label
                  }
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    boxShadow: "0 4px 12px rgb(0 0 0 / 0.12)",
                  }}
                  labelStyle={{
                    color: "var(--muted-foreground)",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                  itemStyle={{
                    color: "var(--primary)",
                    fontSize: 16,
                    fontWeight: 700,
                    padding: 0,
                  }}
                />
                <Bar
                  dataKey="totalRevenue"
                  name="収益"
                  fill="var(--primary)"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

          </div>
        </div>
    </section>
  );
};