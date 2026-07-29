"use client";

import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Assessment, Skill } from "@/utils/performanceTypes";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

// Distinct, on-brand line colors assigned per skill.
const PALETTE = ["#e08a2e", "#9c5cc4", "#3f8f5b", "#2f7fe0", "#cf4b3a", "#b8a06a", "#0ea5a5", "#d6409f"];

interface ProgressChartProps {
  assessments: Assessment[]; // ascending by date
  skills: Skill[];
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });

const ProgressChart = ({ assessments, skills }: ProgressChartProps) => {
  const { data, options } = useMemo(() => {
    const labels = assessments.map((a) => fmt(a.assessedOn));

    // Which skills actually have data (do not backfill zeros for skills added later).
    const measuredSkillIds = new Set<string>();
    assessments.forEach((a) => a.scores.forEach((s) => measuredSkillIds.add(s.skillId)));
    const measuredSkills = skills.filter((sk) => measuredSkillIds.has(sk.id));

    const skillDatasets = measuredSkills.map((sk, i) => {
      const color = PALETTE[i % PALETTE.length];
      return {
        label: sk.name,
        // normalize to % of the skill's max so different scales stay comparable
        data: assessments.map((a) => {
          const sc = a.scores.find((s) => s.skillId === sk.id);
          if (!sc) return null;
          const max = sc.skill?.scaleMax || sk.scaleMax || 1;
          return Math.round((sc.score / max) * 100 * 10) / 10;
        }),
        // keep the raw score for tooltips
        raw: assessments.map((a) => a.scores.find((s) => s.skillId === sk.id)?.score ?? null),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        spanGaps: true,
        tension: 0.3,
      };
    });

    const overallDataset = {
      label: "Overall",
      data: assessments.map((a) => a.overall),
      raw: assessments.map((a) => a.overall),
      borderColor: "#e1511e",
      backgroundColor: "rgba(225,81,30,0.08)",
      borderWidth: 3.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
      tension: 0.3,
    };

    return {
      data: { labels, datasets: [overallDataset, ...skillDatasets] as any },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index" as const, intersect: false },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { callback: (v: any) => `${v}%`, color: "#8a8a8a" },
            grid: { color: "rgba(150,150,150,0.12)" },
          },
          x: { ticks: { color: "#8a8a8a" }, grid: { display: false } },
        },
        plugins: {
          legend: { position: "top" as const, labels: { usePointStyle: true, boxWidth: 8, padding: 16 } },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const ds = ctx.dataset;
                const raw = ds.raw?.[ctx.dataIndex];
                if (ds.label === "Overall") return `Overall: ${ctx.parsed.y}%`;
                return raw == null ? "" : `${ds.label}: ${raw} (${ctx.parsed.y}%)`;
              },
            },
          },
        },
      },
    };
  }, [assessments, skills]);

  return (
    <div className="h-[360px] w-full">
      <Line data={data} options={options} />
    </div>
  );
};

export default ProgressChart;
