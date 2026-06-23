import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import ProgressBar from './ProgressBar'
import MetricBox from './MetricBox'
import { parseFeedback } from '../utils/parseFeedback'

const FeedbackScreen = ({ feedback, onNext, loading }) => {
  const isCorrect = feedback?.isCorrect
  const { yourAnswer, correctAnswer, explanation } = parseFeedback(feedback?.text)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-8">
        <ProgressBar progress={100} />
      </div>

      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={isCorrect ? 'feedback-success' : 'feedback-error'}
      >
        <div className="text-5xl mb-4">{isCorrect ? '✅' : '❌'}</div>
        <h2 className={`text-2xl font-bold mb-2 ${isCorrect ? 'text-success' : 'text-danger'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </h2>
        <p className="text-slate-400 mb-6">
          {isCorrect ? 'Great job! Keep it up.' : 'Do not worry, review the explanation below.'}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`metric-box ${isCorrect ? 'bg-success/10 border-success/20' : 'bg-danger/10 border-danger/20'}`}>
            <div className={`text-2xl font-mono font-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
              {yourAnswer}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Your Answer</div>
          </div>
          <div className="metric-box">
            <div className="text-2xl font-mono font-bold text-primary-light">{correctAnswer}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Correct Answer</div>
          </div>
        </div>

        {explanation && (
          <div className="bg-bg-card border border-slate-700/30 rounded-xl p-4 text-left">
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-100">💡 Explanation:</span> {explanation}
            </p>
          </div>
        )}
      </motion.div>

      <div className="mt-8">
        <button
          onClick={onNext}
          disabled={loading}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Next Question <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </motion.div>
  )
}

export default FeedbackScreen