import React from 'react'
import { motion } from 'framer-motion'
import ProgressBar from './ProgressBar'
import SidebarStats from './SidebarStats'
import OptionCard from './OptionCard'

const QuestionScreen = ({ question, currentIndex, totalQuestions, score, onAnswer, loading }) => {
  const progress = ((currentIndex - 1) / totalQuestions) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-4 gap-8"
    >
      <div className="lg:col-span-1">
        <SidebarStats
          topic={question?.topic}
          difficulty={question?.difficulty}
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          score={score}
        />
      </div>

      <div className="lg:col-span-3 space-y-6">
        <ProgressBar progress={progress} label="Question Progress" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          key={currentIndex}
          className="bg-bg-card border border-slate-700/30 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-light" />
          <div className="font-mono text-xs font-semibold text-primary-light uppercase tracking-widest mb-4">
            Question {currentIndex} of {totalQuestions}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 leading-relaxed max-w-2xl mx-auto">
            {question?.question}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {question?.options?.map((option, i) => (
            <OptionCard
              key={i}
              option={option}
              index={i}
              onSelect={onAnswer}
              disabled={loading}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default QuestionScreen