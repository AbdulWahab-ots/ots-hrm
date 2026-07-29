"use client";
import React, { useRef, useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
} from "chart.js";
import SegmentedTabs from "@/components/common/SegmentedTabs";

const PERIOD_OPTIONS: { value: "year" | "month"; label: string }[] = [
  { value: "year", label: "Y" },
  { value: "month", label: "M" },
];

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CompanyTimelineChart: React.FC = () => {
  const chartRef = useRef<any>(null);
  const [activeFilter, setActiveFilter] = useState<"month" | "year">("year");
  const [gradient, setGradient] = useState<CanvasGradient | null>(null);

  // Get current date info
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();
  const currentMonthName = currentDate.toLocaleString("default", {
    month: "long",
  });

  // Create gradient after first render
  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      const ctx = chart.ctx;
      const height = chart.chartArea.bottom;

      const gradientFill = ctx.createLinearGradient(0, 0, 0, height);
      gradientFill.addColorStop(0, "#597BE8");
      gradientFill.addColorStop(1, "#FFFFFF00");

      setGradient(gradientFill);
    }
  }, [chartRef.current, activeFilter]);

  const getData = (): ChartData<"line"> => {
    // Yearly data (showing months)
    const yearlyData = [5, 10, 15, 8, 12, 18, 22, 19, 14, 10, 33, 25];

    // Monthly data (showing days up to current date)
    const daysInMonth = currentDay;
    const monthlyData = Array.from(
      { length: daysInMonth },
      (_, i) => Math.floor(Math.random() * 20) + 5
    );

    return {
      labels:
        activeFilter === "year"
          ? [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ]
          : Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
      datasets: [
        {
          data: activeFilter === "year" ? yearlyData : monthlyData,
          fill: gradient
            ? {
              target: "origin",
              above: gradient,
            }
            : false,
          borderColor: "#597BE8",
          borderWidth: 2,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    };
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "nearest",
      intersect: false,
      axis: "x",
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: "nearest",
        intersect: false,
        callbacks: {
          label: (context) => `${context.parsed.y} companies`,
          title: (context) =>
            activeFilter === "year"
              ? context[0].label
              : `${context[0].label} ${currentMonthName}`,
        },
        displayColors: false,
        backgroundColor: "#1C202F80",
        bodyColor: "#FFFFFF",
        titleColor: "#FFFFFF",
        bodyFont: {
          weight: "bold",
          size: 14,
        },
        titleFont: {
          size: 12,
        },
        padding: 12,
        cornerRadius: 16,
        bodyAlign: "center",
        titleAlign: "center",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: activeFilter === "year" ? 40 : 30,
        ticks: {
          color: "#7782AE",
        },
        border: {
          display: false,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        ticks: {
          color: "#7782AE",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const handleFilterChange = (filter: "month" | "year") => {
    setActiveFilter(filter);
  };

  return (
    <div className="min-w-2xs md:w-full md:col-span-4 p-4 bg-g-background-100 lg:p-6 rounded-2xl border-[1px] border-g-gray-alpha-400 lg:rounded-3xl">
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-2xl font-medium text-[#1C202F]">
          Company Creation Timeline
        </h2>
        <SegmentedTabs
          options={PERIOD_OPTIONS}
          value={activeFilter}
          onChange={handleFilterChange}
        />
      </div>

      <div className="h-[300px]">
        <Line
          ref={chartRef}
          data={getData()}
          options={options}
          plugins={[
            {
              id: "dashedLineOnHover",
              afterDraw: (chart) => {
                const ctx = chart.ctx;
                const tooltip = chart.tooltip;

                if (tooltip?.getActiveElements()?.length) {
                  const x = tooltip.caretX;
                  const chartArea = chart.chartArea;

                  if (x >= chartArea.left && x <= chartArea.right) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.setLineDash([5, 3]);
                    ctx.moveTo(x, chartArea.top);
                    ctx.lineTo(x, chartArea.bottom);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#597BE880";
                    ctx.stroke();
                    ctx.restore();
                  }
                }
              },
            },
          ]}
        />
      </div>
    </div>
  );
};

export default CompanyTimelineChart;
