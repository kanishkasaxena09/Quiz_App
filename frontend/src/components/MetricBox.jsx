import React from 'react'

const MetricBox = ({ value, label, color = 'text-slate-100' }) => (
  <div className="metric-box">
    <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{label}</div>
  </div>
)

export default MetricBox