import React from 'react'

const SidebarStats = ({ topic, difficulty, currentIndex, totalQuestions, score }) => {
  const diffColor = {
    'Easy': 'text-success',
    'Medium': 'text-warning',
    'Hard': 'text-danger'
  }[difficulty] || 'text-slate-200'

  return (
    <div className="sidebar-panel space-y-1">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Session Overview</h3>
      
      {[
        { label: 'Topic', value: topic?.slice(0, 18) + (topic?.length > 18 ? '...' : '') },
        { label: 'Difficulty', value: difficulty, color: diffColor },
        { label: 'Progress', value: `${currentIndex}/${totalQuestions}` },
        { label: 'Score', value: score, color: 'text-success' },
        { label: 'Remaining', value: totalQuestions - currentIndex }
      ].map((stat, i) => (
        <div key={i} className="stat-row">
          <span className="text-sm text-slate-400">{stat.label}</span>
          <span className={`text-sm font-mono ${stat.color || 'text-slate-200'}`}>{stat.value}</span>
        </div>
      ))}
    </div>
  )
}

export default SidebarStats