import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';

// Register the necessary components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define the props type for the PieChart component
interface PieChartProps {
    data: Record<string, number>; // Expecting an object with string keys and number values
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
    const chartData = {
        labels: Object.keys(data),
        datasets: [
            {
                data: Object.values(data),
                backgroundColor: [
                    '#FF6384', 
                    '#36A2EB', 
                    '#FFCE56', 
                    '#FF9F40', 
                    '#4BC0C0', 
                    '#9966FF', 
                    '#FF6698'
                ], // Add more colors if needed
                hoverOffset: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            tooltip: {
                callbacks: {
                    label: (tooltipItem: TooltipItem<'pie'>) => {
                        const label = tooltipItem.label || '';
                        const value = tooltipItem.raw as number || 0; // Cast to number
                        return `${label}: $${value.toFixed(2)}`; // Format the tooltip
                    },
                },
            },
        },
    };

    return <Pie data={chartData} options={options} />;
};

export default PieChart;