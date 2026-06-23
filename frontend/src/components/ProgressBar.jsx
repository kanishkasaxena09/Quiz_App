import React from 'react'

const ProgressBar = ({ progress, label = 'Progress' }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm text-slate-400 font-medium">{label}</span>
      <span className="text-sm font-mono font-semibold text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
        {Math.round(progress)}%
      </span>
    </div>
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${progress}%` }} />
    </div>
  </div>
)

export default ProgressBar