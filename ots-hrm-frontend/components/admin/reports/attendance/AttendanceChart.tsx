import React from "react";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    ChartOptions,
    ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend
);

type AttendanceChartProps = {
    data: ChartData<"line">;
    options?: ChartOptions<"line">;
};

const AttendanceChart: React.FC<AttendanceChartProps> = ({ data, options }) => {
    
    const defaultOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: "bottom",
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 120,
            },
        },
    };

    return (
        <div className="h-60 md:h-full">

            <Line data={data} options={defaultOptions}/>
            </div>
        )};

export default AttendanceChart;
