"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const PCOL: Record<string, string> = {
  instagram: "#E1306C",
  linkedin: "#0A66C2",
  twitter: "#1DA1F2",
  facebook: "#1877F2",
  tiktok: "#69C9D0",
  youtube: "#FF0000",
};

export default function PlatformChart({ platforms }: { platforms: string[] }) {
  const counts: Record<string, number> = {};
  platforms.forEach((p) => {
    counts[p] = (counts[p] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const backgroundColor = labels.map((l) => PCOL[l] || "#8B5CF6");

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderWidth: 2,
        borderColor: "#111118",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#8080A0",
          font: { size: 11 },
          boxWidth: 10,
        },
      },
    },
  };

  if (!labels.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-t2">
        No posts yet
      </div>
    );
  }

  return <Doughnut data={chartData} options={options} />;
}
