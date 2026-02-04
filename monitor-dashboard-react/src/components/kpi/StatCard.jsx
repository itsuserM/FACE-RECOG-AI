export default function StatCard({ label, value, unit, hint }) {
  return (
    <div className="hk-kpi">
      <div className="hk-kpiTop">
        <div className="hk-kpiLabel">{label}</div>
        <div className="hk-kpiPulse" aria-hidden="true" />
      </div>

      <div className="hk-kpiValue">
        {value}
        {unit && <span className="hk-kpiUnit">{unit}</span>}
      </div>

      {hint && <div className="hk-kpiHint">{hint}</div>}
      <div className="hk-kpiScan" aria-hidden="true" />
    </div>
  )
}
