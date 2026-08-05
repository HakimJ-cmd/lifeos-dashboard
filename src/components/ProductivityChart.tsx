"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type LogPoint = { logDate: string; productivityScore: number; lazyScore: number };

export function ProductivityChart({ data }: { data: LogPoint[] }) {
  const chartData = data.map((d) => ({
    day: new Date(d.logDate).toLocaleDateString("id-ID", { weekday: "short" }),
    Produktif: d.productivityScore,
    Bermalas: d.lazyScore,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} barGap={4}>
        <CartesianGrid vertical={false} stroke="#e4e1ee" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} stroke="#777587" />
        <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#777587" width={30} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e4e1ee", fontSize: 12 }}
          cursor={{ fill: "#f0ecf9" }}
        />
        <Bar dataKey="Produktif" fill="#5b53f0" radius={[6, 6, 0, 0]} maxBarSize={18} />
        <Bar dataKey="Bermalas" fill="#ffb68f" radius={[6, 6, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
