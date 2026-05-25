"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type DayEntry = { date: string; copies: number };

function formatLabel(date: string) {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pickTicks(data: DayEntry[]): string[] {
  if (data.length <= 7) return data.map((d) => d.date);
  const step = Math.ceil(data.length / 7);
  return data.filter((_, i) => i % step === 0).map((d) => d.date);
}

export function CopiesChart({ data }: { data: DayEntry[] }) {
  const ticks = pickTicks(data);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          ticks={ticks}
          tickFormatter={formatLabel}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => [v, "copies"]}
          labelFormatter={(l) => formatLabel(String(l))}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            fontSize: 12,
          }}
        />
        <Bar dataKey="copies" fill="var(--primary)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
