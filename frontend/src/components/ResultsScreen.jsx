import React from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Home, Trophy } from 'lucide-react'
import ScoreRing from './ScoreRing'
import MetricBox from './MetricBox'

const ResultsScreen = ({ score, totalQuestions, onNewQuiz, history }) => {
  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0
  const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : 'D'
  
  const gradeConfig = {
    'A+': { color: 'text-success bg-success/15', message: 'Outstanding performance! You have mastered this topic.' },
    'A': { color: 'text-success bg-success/15', message: 'Outstanding performance! You have mastered this topic.' },
    'B': { color: 'text-primary-light bg-primary/15', message: 'Solid effort! Review the incorrect answers to improve.' },
    'C': { color: 'text-warning bg-warning/15', message: 'Keep learning! Practice makes perfect.' },
    'D': { color: 'text-danger bg-danger/15', message: 'Keep learning! Practice makes perfect.' }
  }[grade]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="glass-card text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Trophy className="w-12 h-12 text-primary-light mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Quiz Complete!</h1>
          <p className="text-slate-400 mb-8">Great job finishing the quiz</p>

          <ScoreRing score={score} total={totalQuestions} percentage={percentage} />

          <div className={`inline-block px-8 py-2 rounded-full text-xl font-bold mb-6 ${gradeConfig.color}`}>
            Grade {grade}
          </div>

          <p className="text-slate-400 mb-8 max-w-md mx-auto">{gradeConfig.message}</p>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
            <MetricBox value={`${percentage.toFixed(1)}%`} label="Accuracy" color="text-primary-light" />
            <MetricBox value={score} label="Correct" color="text-success" />
            <MetricBox value={totalQuestions - score} label="Incorrect" color="text-danger" />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={onNewQuiz} className="btn-primary flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" /> New Quiz
          </button>
          <button onClick={onNewQuiz} className="btn-secondary flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /> Dashboard
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-8 glass-card">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Recent Quizzes</h3>
          <div className="space-y-3">
            {history.slice(-5).reverse().map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/20 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${h.percentage >= 60 ? 'bg-success' : 'bg-danger'}`} />
                  <span className="text-sm text-slate-300">{h.topic}</span>
                </div>
                <span className={`text-sm font-mono font-semibold ${h.percentage >= 60 ? 'text-success' : 'text-danger'}`}>
                  {h.score}/{h.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default ResultsScreen