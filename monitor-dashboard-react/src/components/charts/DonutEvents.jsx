import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function DonutEvents({ counts }) {
  const data = {
    labels: ['Authorized (Manish)', 'Unauthorized Person', 'No User Detected'],
    datasets: [
      {
        data: [counts.authorized || 0, counts.unauthorized || 0, counts.noUser || 0],
        backgroundColor: ['#7ADFFF', '#FF97AD', '#F9E27D'],
        borderColor: '#1e2a52',
        borderWidth: 2
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    cutout: '65%'
  }

  return (
    <div style={{ height: 300 }}>
      <Doughnut data={data} options={options} />
    </div>
  )
}
