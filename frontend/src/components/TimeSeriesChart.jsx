import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function TimeSeriesChart({ title, labels, data, unit, color = "#2f7550" }) {
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        borderColor: color,
        backgroundColor: `${color}33`,
        tension: 0.3,
        fill: true,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y.toLocaleString()} ${unit}`,
        },
      },
      title: { display: false },
    },
    scales: {
      x: { title: { display: true, text: "Year" } },
      y: { title: { display: true, text: unit } },
    },
  };

  return (
    <div className="card p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
