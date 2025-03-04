import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement } from 'chart.js';

// Register the ArcElement
ChartJS.register(ArcElement);

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
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#FF9F40', '#4BC0C0'], // Add more colors if needed
            },
        ],
    };

    return <Pie data={chartData} />;
};

export default PieChart;