import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const COLORS = {
  authorized: '#7ADFFF',     // cyan
  unauthorized: '#FF97AD',   // pink
  noUser: '#F9E27D'          // yellow
}

export default function ActivityChart({ bucket }) {
  const labels = Object.keys(bucket).sort()

  const data = {
    labels,
    datasets: [
      {
        label: 'Authorized (Manish)',
        data: labels.map((l) => bucket[l]?.authorized ?? 0),
        borderColor: COLORS.authorized,
        backgroundColor: 'rgba(122,223,255,.2)',
        pointRadius: 2,
        tension: 0.35
      },
      {
        label: 'Unauthorized Person',
        data: labels.map((l) => bucket[l]?.unauthorized ?? 0),
        borderColor: COLORS.unauthorized,
        backgroundColor: 'rgba(255,151,173,.2)',
        pointRadius: 2,
        tension: 0.35
      },
      {
        label: 'No User Detected',
        data: labels.map((l) => bucket[l]?.noUser ?? 0),
        borderColor: COLORS.noUser,
        backgroundColor: 'rgba(249,226,125,.18)',
        pointRadius: 2,
        tension: 0.35
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.06)' } },
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.06)' } }
    }
  }

  return (
    <div style={{ height: 280 }}>
      <Line data={data} options={options} />
    </div>
  )
}
