"use client";
import React from 'react'

import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const EmployeeChart = () => {
    const chartData = {
        labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        datasets: [
            {
                label: 'Active Employees',
                data: [50, 55, 57, 56, 60, 58, 59, 57, 62],
                backgroundColor: '#28a948',
                borderWidth: 0,
            },
            {
                label: 'Inactive Employees',
                data: [80, 90, 100, 98, 85, 102, 88, 110, 95],
                backgroundColor: '#e6e6e6',
                borderWidth: 0,
            }
        ]
    };

    const options: ChartOptions<"bar"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Employee',
                color: '#171717',
                align: 'start',
                font: {
                    weight: 'bold',
                    size: 18,
                },
            },
            legend: {
                display: true,
                position: 'top' as const,
                labels: {
                    color: '#171717',
                },
            },
            tooltip: {
                enabled: true,
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Month',
                },
                grid: {
                    display: false,
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Employees',
                },
                beginAtZero: true,
                grid: {
                    display: true,
                },
            },
        },
    };

    return (
        <div className="h-60 md:h-full">
            <Bar data={chartData} options={options} />
        </div>
    )
}

export default EmployeeChart