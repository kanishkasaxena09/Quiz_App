import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Zap, BarChart3, ArrowRight, Trophy, RotateCcw, Home, ChevronRight, Trash2 } from 'lucide-react'
import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

function App() {
  // Load history from localStorage
  const [quizHistory, setQuizHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('quizHistory')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Save to localStorage when history changes
  useEffect(() => {
    localStorage.setItem('quizHistory', JSON.stringify(quizHistory))
  }, [quizHistory])

  const [mode, setMode] = useState('setup')
  const [sessionId, setSessionId] = useState(null)
  const [question, setQuestion] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [topic, setTopic] = useState('Python Programming')
  const [difficulty, setDifficulty] = useState('Medium')
  const [numQuestions, setNumQuestions] = useState(5)

  const startQuiz = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API_URL}/quiz/start`, {
        topic,
        difficulty,
        num_questions: numQuestions
      })
      
      const data = res.data.data
      setSessionId(data.session_id)
      setQuestion(data.question)
      setCurrentIndex(data.current_index)
      setTotalQuestions(data.total_questions)
      setScore(data.score)
      setMode('question')
    } catch (err) {
      setError('Failed to start quiz. Make sure backend is running on port 8000!')
      console.error(err)
    }
    setLoading(false)
  }

  const submitAnswer = async (answer) => {
    if (!sessionId) return
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/quiz/answer`, {
        session_id: sessionId,
        answer
      })
      
      const data = res.data.data
      setFeedback({
        isCorrect: data.is_correct,
        text: data.feedback
      })
      setScore(data.score)
      
      if (data.quiz_complete) {
        // Save to history when quiz ends
        const finalPercentage = totalQuestions > 0 ? (data.score / totalQuestions) * 100 : 0
        const newEntry = {
          topic: topic,
          score: data.score,
          total: totalQuestions,
          percentage: finalPercentage,
          date: new Date().toLocaleDateString()
        }
        setQuizHistory(prev => [...prev, newEntry])
        setMode('results')
      } else {
        setMode('feedback')
      }
    } catch (err) {
      setError('Failed to submit answer')
      console.error(err)
    }
    setLoading(false)
  }

  const nextQuestion = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/quiz/next`, {
        session_id: sessionId,
        answer: ''
      })
      
      const data = res.data.data
      
      if (data.quiz_complete) {
        const finalPercentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0
        const newEntry = {
          topic: topic,
          score: score,
          total: totalQuestions,
          percentage: finalPercentage,
          date: new Date().toLocaleDateString()
        }
        setQuizHistory(prev => [...prev, newEntry])
        setMode('results')
      } else {
        setQuestion(data.question)
        setCurrentIndex(data.current_index + 1)
        setMode('question')
      }
    } catch (err) {
      setError('Failed to get next question')
      console.error(err)
    }
    setLoading(false)
  }

  const resetQuiz = () => {
    setMode('setup')
    setSessionId(null)
    setQuestion(null)
    setFeedback(null)
    setError(null)
  }

  const clearHistory = () => {
    setQuizHistory([])
    localStorage.removeItem('quizHistory')
  }

  const progress = totalQuestions > 0 ? ((currentIndex - 1) / totalQuestions) * 100 : 0

  // Calculate stats
  const totalQuizzes = quizHistory.length
  const avgScore = totalQuizzes > 0 
    ? (quizHistory.reduce((a, b) => a + b.percentage, 0) / totalQuizzes).toFixed(1)
    : 0
  const bestScore = totalQuizzes > 0
    ? Math.max(...quizHistory.map(h => h.percentage)).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">QuizMaster Pro</h1>
              <p className="text-xs text-slate-500">AI-Powered Learning</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-400">Groq AI</span>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-center">
            {error}
            <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* SETUP SCREEN */}
          {mode === 'setup' && (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Configure */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" /> Configure Quiz
                  </h2>
                  <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg">New Session</span>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Quiz Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Machine Learning"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Difficulty Level</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Number of Questions: {numQuestions}</label>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-full accent-indigo-500"
                    />
                  </div>

                  <button
                    onClick={startQuiz}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Start Quiz <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>

              {/* Dashboard */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" /> Dashboard
                  </h2>
                  {totalQuizzes > 0 && (
                    <button 
                      onClick={clearHistory}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {totalQuizzes > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-slate-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-mono font-bold text-indigo-400">{totalQuizzes}</div>
                        <div className="text-xs text-slate-500 uppercase mt-1">Quizzes</div>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-mono font-bold text-green-400">{avgScore}%</div>
                        <div className="text-xs text-slate-500 uppercase mt-1">Avg Score</div>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-mono font-bold text-yellow-400">{bestScore}%</div>
                        <div className="text-xs text-slate-500 uppercase mt-1">Best</div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        {quizHistory.slice(-5).reverse().map((h, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${h.percentage >= 60 ? 'bg-green-400' : 'bg-red-400'}`} />
                              <div>
                                <span className="text-sm text-slate-300 block">{h.topic}</span>
                                <span className="text-xs text-slate-500">{h.date}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${h.percentage >= 60 ? 'bg-green-400' : 'bg-red-400'}`}
                                  style={{ width: `${h.percentage}%` }}
                                />
                              </div>
                              <span className={`text-sm font-mono font-semibold ${h.percentage >= 60 ? 'text-green-400' : 'text-red-400'}`}>
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
                    <p className="text-sm text-slate-500 mb-4">Complete a quiz to see your stats here</p>
                    <button
                      onClick={() => {
                        // Demo data for testing
                        setQuizHistory([
                          { topic: 'Python Basics', score: 4, total: 5, percentage: 80, date: '2024-01-15' },
                          { topic: 'JavaScript', score: 3, total: 5, percentage: 60, date: '2024-01-14' },
                          { topic: 'React Hooks', score: 5, total: 5, percentage: 100, date: '2024-01-13' },
                        ])
                      }}
                      className="text-sm text-indigo-400 hover:text-indigo-300 underline"
                    >
                      Load demo data
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* QUESTION SCREEN */}
          {mode === 'question' && question && (
            <motion.div
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
              <div className="lg:col-span-1">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Session</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Topic</span>
                      <span className="text-slate-200">{topic.slice(0, 18)}{topic.length > 18 ? '...' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Difficulty</span>
                      <span className={difficulty === 'Easy' ? 'text-green-400' : difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'}>
                        {difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Progress</span>
                      <span className="font-mono">{currentIndex}/{totalQuestions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Score</span>
                      <span className="font-mono text-green-400">{score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Remaining</span>
                      <span className="font-mono">{totalQuestions - currentIndex}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Question Progress</span>
                    <span className="text-sm font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={currentIndex}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-indigo-400" />
                  <div className="font-mono text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">
                    Question {currentIndex} of {totalQuestions}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold leading-relaxed max-w-2xl mx-auto">
                    {question.question}
                  </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {question.options?.map((opt, i) => {
                    const letter = opt.split(')')[0].trim()
                    const text = opt.split(')', 1)[1]?.trim() || opt
                    
                    return (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !loading && submitAnswer(letter)}
                        disabled={loading}
                        className="bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl p-4 flex items-center gap-4 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        <div className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center font-mono font-bold text-slate-400 hover:border-indigo-500 hover:text-indigo-400">
                          {letter}
                        </div>
                        <span className="text-slate-100 font-medium">{text}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* FEEDBACK SCREEN */}
          {mode === 'feedback' && feedback && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto text-center"
            >
              <div className={`rounded-2xl p-8 ${feedback.isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <div className="text-5xl mb-4">{feedback.isCorrect ? '✅' : '❌'}</div>
                <h2 className={`text-2xl font-bold mb-2 ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                </h2>
                <p className="text-slate-400 mb-6">
                  {feedback.isCorrect ? 'Great job! Keep it up.' : 'Do not worry, review the explanation below.'}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`bg-slate-800 rounded-xl p-4 text-center ${feedback.isCorrect ? 'border border-green-500/20' : 'border border-red-500/20'}`}>
                    <div className={`text-2xl font-mono font-bold ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {feedback.text.match(/Your answer: ([A-D])/)?.[1] || '?'}
                    </div>
                    <div className="text-xs text-slate-500 uppercase mt-1">Your Answer</div>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                    <div className="text-2xl font-mono font-bold text-indigo-400">
                      {feedback.text.match(/Correct answer: ([A-D])/)?.[1] || '?'}
                    </div>
                    <div className="text-xs text-slate-500 uppercase mt-1">Correct Answer</div>
                  </div>
                </div>

                {feedback.text.includes('Explanation:') && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left">
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-slate-100">💡 Explanation:</span>{' '}
                      {feedback.text.split('Explanation:')[1]?.trim()}
                    </p>
                  </div>
                )}

                <button
                  onClick={nextQuestion}
                  disabled={loading}
                  className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Next Question <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* RESULTS SCREEN */}
          {mode === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <Trophy className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
                <p className="text-slate-400 mb-2">{topic} • {difficulty}</p>

                <div className="w-48 h-48 mx-auto my-6 rounded-full flex items-center justify-center relative"
                  style={{
                    background: `conic-gradient(#6366f1 ${(score/totalQuestions)*100}%, #334155 0)`,
                    boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)'
                  }}>
                  <div className="absolute w-40 h-40 bg-slate-900 rounded-full" />
                  <div className="relative z-10 text-center">
                    <div className="text-4xl font-mono font-bold">{score}<span className="text-xl text-slate-500">/{totalQuestions}</span></div>
                  </div>
                </div>

                <div className={`inline-block px-8 py-2 rounded-full text-xl font-bold mb-6 ${
                  score/totalQuestions >= 0.8 ? 'bg-green-500/15 text-green-400' :
                  score/totalQuestions >= 0.6 ? 'bg-indigo-500/15 text-indigo-400' :
                  'bg-red-500/15 text-red-400'
                }`}>
                  Grade {score/totalQuestions >= 0.9 ? 'A+' : score/totalQuestions >= 0.8 ? 'A' : score/totalQuestions >= 0.7 ? 'B' : score/totalQuestions >= 0.6 ? 'C' : 'D'}
                </div>

                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  {score/totalQuestions >= 0.8 ? 'Outstanding performance! You have mastered this topic.' :
                   score/totalQuestions >= 0.6 ? 'Solid effort! Review the incorrect answers to improve.' :
                   'Keep learning! Practice makes perfect.'}
                </p>

                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                  <div className="bg-slate-800 rounded-xl p-4">
                    <div className="text-2xl font-mono font-bold text-indigo-400">{((score/totalQuestions)*100).toFixed(1)}%</div>
                    <div className="text-xs text-slate-500 uppercase mt-1">Accuracy</div>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-4">
                    <div className="text-2xl font-mono font-bold text-green-400">{score}</div>
                    <div className="text-xs text-slate-500 uppercase mt-1">Correct</div>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-4">
                    <div className="text-2xl font-mono font-bold text-red-400">{totalQuestions - score}</div>
                    <div className="text-xs text-slate-500 uppercase mt-1">Incorrect</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={resetQuiz} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" /> New Quiz
                  </button>
                  <button onClick={resetQuiz} className="bg-slate-800 border border-slate-700 hover:border-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Home className="w-4 h-4" /> Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App