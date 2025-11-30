"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function ScoreGauge({ score }: { score: number }) {
  const data = [{ value: score }, { value: 100 - score }];

  let color = "#ef4444"; // Red
  if (score > 50) color = "#f59e0b"; // Orange
  if (score > 75) color = "#10b981"; // Green

  return (
    <div className="relative h-48 w-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={180}
            endAngle={0}
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill="#e2e8f0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-2/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-2">
        <span className="text-4xl font-bold text-slate-800">{score}</span>
        <span className="text-sm text-slate-500 block">/100</span>
      </div>
    </div>
  );
}
