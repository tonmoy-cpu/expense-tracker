import React from 'react';
import { Pie } from 'react-chartjs-2';

interface PieChartProps {
    data: Record<string, number>;
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
    const chartData = {
        labels: Object.keys(data),
        datasets: [
            {
                data: Object.values(data),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
            },
        ],
    };

    return <Pie data={chartData} />;
};

export default PieChart;