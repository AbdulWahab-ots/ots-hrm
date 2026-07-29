"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  DoughnutController,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, DoughnutController);

/* Reads a set of Geist CSS custom properties off :root and re-reads them
   whenever the theme flips (the toggle stamps `data-theme` on <html>), so the
   chart's fills track light/dark without hardcoded hex. */
function useThemeTokens(names: string[]) {
  const read = () => {
    if (typeof window === "undefined") return {} as Record<string, string>;
    const cs = getComputedStyle(document.documentElement);
    return names.reduce((acc, n) => {
      acc[n] = cs.getPropertyValue(n).trim();
      return acc;
    }, {} as Record<string, string>);
  };

  const [tokens, setTokens] = useState<Record<string, string>>(read);

  useEffect(() => {
    setTokens(read());
    const observer = new MutationObserver(() => setTokens(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class", "style"],
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return tokens;
}

interface CompositionDonutProps {
  active: number;
  inactive: number;
}

const CompositionDonut = ({ active, inactive }: CompositionDonutProps) => {
  const t = useThemeTokens([
    "--g-green-700",
    "--g-gray-500",
    "--g-gray-alpha-200",
    "--g-background-100",
  ]);

  const total = active + inactive;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const activeColor = t["--g-green-700"] || "#28a948";
  const inactiveColor = t["--g-gray-500"] || "#c9c9c9";
  const surface = t["--g-background-100"] || "#ffffff";
  const emptyColor = t["--g-gray-alpha-200"] || "rgba(0,0,0,0.08)";

  const { data, options } = useMemo(() => {
    const isEmpty = total === 0;
    return {
      data: {
        labels: ["Active", "Inactive"],
        datasets: [
          {
            data: isEmpty ? [1] : [active, inactive],
            backgroundColor: isEmpty
              ? [emptyColor]
              : [activeColor, inactiveColor],
            // 2px surface gap between slices (dataviz mark spec)
            borderColor: surface,
            borderWidth: isEmpty ? 0 : 2,
            hoverOffset: isEmpty ? 0 : 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: !isEmpty,
            callbacks: {
              label: (ctx: any) =>
                ` ${ctx.label}: ${ctx.parsed} (${pct(ctx.parsed)}%)`,
            },
          },
        },
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, inactive, total, activeColor, inactiveColor, surface, emptyColor]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[180px] w-[180px]">
        <Doughnut data={data as any} options={options as any} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-heading-32 text-g-gray-1000 leading-none">
            {total}
          </span>
          <span className="text-label-12 text-g-gray-700 mt-1">
            {total === 1 ? "Employee" : "Employees"}
          </span>
        </div>
      </div>

      {/* Legend with direct labels — identity + magnitude never rely on the
          slice fill alone (satisfies the light-mode contrast relief). */}
      <div className="flex items-center gap-5 mt-5">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: activeColor }}
          />
          <span className="text-label-13 text-g-gray-900">
            Active{" "}
            <span className="text-g-gray-1000 font-medium">
              {active} ({pct(active)}%)
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: inactiveColor }}
          />
          <span className="text-label-13 text-g-gray-900">
            Inactive{" "}
            <span className="text-g-gray-1000 font-medium">
              {inactive} ({pct(inactive)}%)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompositionDonut;
