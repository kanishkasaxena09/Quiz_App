import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Target, BarChart3, ArrowRight } from 'lucide-react'
import MetricBox from './MetricBox'

const SetupScreen = ({ onStart, loading, history }) => {
  const [topic, setTopic] = useState('Python Programming')
  const [difficulty, setDifficulty] = useState('Medium')
  const [numQuestions, setNumQuestions] = useState(5)

  const totalQuizzes = history.length
  const avgScore = totalQuizzes > 0 
    ? (history.reduce((a, b) => a + b.percentage, 0) / totalQuizzes).toFixed(1)
    : 0
  const bestScore = totalQuizzes > 0
    ? Math.max(...history.map(h => h.percentage)).toFixed(1)
    : 0

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      {/* Configure Card */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Configure Quiz
          </h2>
          <span className="text-xs font-semibold bg-primary/10 text-primary-light px-3 py-1 rounded-lg">New Session</span>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Quiz Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Machine Learning"
              className="w-full bg-bg-input border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-bg-input border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Number of Questions: {numQuestions}</label>
            <input
              type="range"
              min="1"
              max="15"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full h-2 bg-bg-input rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>

          <button
            onClick={() => onStart(topic, difficulty, numQuestions)}
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Start Quiz <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>

      {/* Dashboard Card */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Performance Dashboard
          </h2>
        </div>

        {totalQuizzes > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <MetricBox value={totalQuizzes} label="Quizzes" color="text-primary-light" />
              <MetricBox value={`${avgScore}%`} label="Avg Score" color="text-success" />
              <MetricBox value={`${bestScore}%`} label="Best" color="text-warning" />
            </div>

            <div className="border-t border-slate-700/30 pt-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {history.slice(-5).reverse().map((h, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${h.percentage >= 60 ? 'bg-success' : 'bg-danger'}`} />
                      <span className="text-sm text-slate-300 truncate max-w-[180px]">{h.topic}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-1 bg-bg-input rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${h.percentage >= 60 ? 'bg-success' : 'bg-danger'}`} style={{ width: `${h.percentage}%` }} />
                      </div>
                      <span className={`text-sm font-mono font-semibold ${h.percentage >= 60 ? 'text-success' : 'text-danger'}`}>
                        {h.score}/{h.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No quizzes yet</h3>
            <p className="text-sm text-slate-500">Configure your first quiz to start tracking performance</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default SetupScreen