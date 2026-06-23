import React from 'react'

const ScoreRing = ({ score, total, percentage }) => (
  <div className="score-ring mb-6" style={{ '--score-pct': percentage }}>
    <div className="relative z-10 text-center">
      <div className="text-4xl font-mono font-bold text-slate-100">
        {score}<span className="text-xl text-slate-500">/{total}</span>
      </div>
    </div>
  </div>
)

export default ScoreRing