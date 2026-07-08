import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Zap, BarChart3, ArrowRight, Trophy, RotateCcw, Home, ChevronRight, Trash2, Upload, FileText, Type, Clock, Keyboard } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function App() {
  const [quizHistory, setQuizHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('quizHistory')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('quizHistory', JSON.stringify(quizHistory))
  }, [quizHistory])

  const [mode, setMode] = useState('setup')
  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
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

  const [inputMode, setInputMode] = useState('topic')
  const [uploadedContent, setUploadedContent] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.csv', '.json']
  const ALLOWED_MIME_TYPES = [
    'application/pdf', 'text/plain', 'text/markdown',
    'text/csv', 'application/json', 'application/vnd.ms-excel'
  ]

  // Answer history for review & export
  const [answerHistory, setAnswerHistory] = useState([])
  const answerHistoryRef = useRef([])

  // Timer per question
  const [timeLeft, setTimeLeft] = useState(null)
  const timerRef = useRef(null)

  const getTimerDuration = (diff) => {
    switch(diff) {
      case 'Easy': return 60
      case 'Hard': return 30
      default: return 45
    }
  }

  // Timer countdown per question
  useEffect(() => {
    if (mode === 'question') {
      const duration = getTimerDuration(difficulty)
      setTimeLeft(duration)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            submitAnswer('')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timerRef.current)
    } else {
      setTimeLeft(null)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [mode, currentIndex])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase()
      if (mode === 'question' && !loading && timeLeft > 0) {
        if (['A', 'B', 'C', 'D'].includes(key)) {
          e.preventDefault()
          const opt = question?.options?.find(o => o.startsWith(key + ')'))
          if (opt) submitAnswer(key)
        }
      }
      if (mode === 'feedback' && !loading && feedback) {
        if (key === 'ENTER' || key === ' ') {
          e.preventDefault()
          nextQuestion()
        }
      }
      if (mode === 'results' && !loading) {
        if (key === 'R') { e.preventDefault(); resetQuiz() }
      }

    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, loading, currentIndex, question, feedback, timeLeft])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type "${ext}". Please upload a PDF, TXT, MD, CSV, or JSON file.`)
      return
    }
    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_URL}/quiz/upload`, {
        method: 'POST',
        body: formData
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.detail || json.message || `Upload failed (${res.status})`)
      }
      const data = json.data
      setUploadedContent(data.content)
      setUploadedFileName(data.filename)
    } catch (err) {
      setError(err.message || 'Failed to upload file. Make sure backend is running.')
      console.error(err)
    }
    setIsUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type "${ext}". Please upload a PDF, TXT, MD, CSV, or JSON file.`)
      return
    }
    if (fileInputRef.current) {
      const dt = new DataTransfer()
      dt.items.add(file)
      fileInputRef.current.files = dt.files
      handleFileUpload({ target: { files: dt.files } })
    }
  }

  const startQuiz = async () => {
    setLoading(true)
    setError(null)
    setAnswerHistory([])
    answerHistoryRef.current = []
    try {
      if (inputMode === 'content' && uploadedFileName) {
        setTopic(uploadedFileName)
      }
      const payload = {
        topic: inputMode === 'content' ? (uploadedFileName || 'Custom Content') : topic,
        difficulty,
        num_questions: numQuestions
      }
      if (inputMode === 'content' && uploadedContent.trim()) {
        payload.content = uploadedContent
      }
      const res = await axios.post(`${API_URL}quiz/start`, payload)
      const data = res.data.data
      setSessionId(data.session_id)
      setQuestions(data.questions || [])
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

      const userAns = data.user_answer || answer || '(timed out)'
      const correctAns = data.correct_answer || '?'
      const explanation = data.explanation || ''

      const currentQ = questions[currentIndex - 1]
      if (currentQ) {
        const entry = {
          question: currentQ.question,
          options: currentQ.options,
          userAnswer: userAns,
          correctAnswer: correctAns,
          isCorrect: data.is_correct,
          explanation: explanation || currentQ.explanation || ''
        }
        answerHistoryRef.current = [...answerHistoryRef.current, entry]
        setAnswerHistory(answerHistoryRef.current)
      }

      setFeedback({
        isCorrect: data.is_correct,
        text: data.feedback
      })
      setScore(data.score)

      if (data.quiz_complete) {
        const finalPercentage = totalQuestions > 0 ? (data.score / totalQuestions) * 100 : 0
        const newEntry = {
          topic: topic,
          score: data.score,
          total: totalQuestions,
          percentage: finalPercentage,
          date: new Date().toLocaleDateString(),
          answers: answerHistoryRef.current
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
          date: new Date().toLocaleDateString(),
          answers: answerHistoryRef.current
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
    setQuestions([])
    setQuestion(null)
    setFeedback(null)
    setError(null)
    setAnswerHistory([])
    answerHistoryRef.current = []
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }


  const clearHistory = () => {
    setQuizHistory([])
    localStorage.removeItem('quizHistory')
  }

  const progress = totalQuestions > 0 ? ((currentIndex - 1) / totalQuestions) * 100 : 0

  const totalQuizzes = quizHistory.length
  const avgScore = totalQuizzes > 0
    ? (quizHistory.reduce((a, b) => a + b.percentage, 0) / totalQuizzes).toFixed(1)
    : 0
  const bestScore = totalQuizzes > 0
    ? Math.max(...quizHistory.map(h => h.percentage)).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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

      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-center">
            {error}
            <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading overlay */}
        <AnimatePresence>
          {loading && mode === 'setup' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
                <div className="w-16 h-16 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                  <Target className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">Generating Your Quiz</h3>
                <p className="text-sm text-slate-500 mb-6">
                  AI is crafting questions about <span className="text-indigo-400 font-medium">{inputMode === 'content' ? (uploadedFileName || 'your content') : topic}</span>
                </p>
                <div className="flex gap-1.5 justify-center">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" /> Configure Quiz
                  </h2>
                  <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg">New Session</span>
                </div>

                <div className="space-y-5">
                  <div className="flex gap-2 bg-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => setInputMode('topic')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        inputMode === 'topic' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Type className="w-4 h-4" /> Topic
                    </button>
                    <button
                      onClick={() => setInputMode('content')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        inputMode === 'content' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-4 h-4" /> Upload Content
                    </button>
                  </div>

                  {inputMode === 'topic' && (
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
                  )}

                  {inputMode === 'content' && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Upload PDF / Text File or Paste Content
                      </label>
                      <div
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                        onDragLeave={() => setIsDragOver(false)}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 mb-3 ${
                          isDragOver
                            ? 'border-indigo-500 bg-indigo-500/5 scale-[1.02]'
                            : uploadedFileName
                              ? 'border-indigo-500/50 bg-indigo-500/5'
                              : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.txt,.md,.csv,.json"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 relative">
                              <div className="absolute inset-0 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                              <Upload className="w-4 h-4 text-indigo-400 absolute inset-0 m-auto" />
                            </div>
                            <span className="text-sm text-slate-400">Uploading...</span>
                          </div>
                        ) : uploadedFileName ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                              <FileText className="w-6 h-6 text-indigo-400" />
                            </div>
                            <span className="text-sm text-indigo-400 font-medium">{uploadedFileName}</span>
                            <span className="text-xs text-slate-600">Click to change file</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                              <Upload className="w-6 h-6 text-slate-500" />
                            </div>
                            <div>
                              <span className="text-sm text-slate-400">Drop a file here or <span className="text-indigo-400 underline underline-offset-2">browse</span></span>
                              <p className="text-xs text-slate-600 mt-1">Supports PDF, TXT, MD, CSV, JSON</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={uploadedContent}
                        onChange={(e) => setUploadedContent(e.target.value)}
                        placeholder="Or paste your content here..."
                        rows={4}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none text-sm transition-colors"
                      />
                      {uploadedContent && (
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-slate-600">Content ready</span>
                          <span className="text-xs text-slate-500 font-mono">{uploadedContent.length.toLocaleString()} characters</span>
                        </div>
                      )}
                    </div>
                  )}

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
                    disabled={loading || (inputMode === 'content' && !uploadedContent.trim())}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Generating...</span>
                      </div>
                    ) : (
                      <><span>Start Quiz</span> <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>

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
                  <div>
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
                      <div className="space-y-2">
                        {quizHistory.slice(-10).reverse().map((h, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${h.percentage >= 60 ? 'bg-green-400' : 'bg-red-400'}`} />
                              <div className="min-w-0">
                                <span className="text-sm text-slate-300 block truncate">{h.topic}</span>
                                <span className="text-xs text-slate-500">{h.date}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className={`h-full rounded-full ${h.percentage >= 60 ? 'bg-green-400' : 'bg-red-400'}`}
                                  style={{ width: `${h.percentage}%` }}
                                />
                              </div>
                              <span className={`text-sm font-mono font-semibold ${h.percentage >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                                {h.score}{' / '}{h.total}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">No quizzes yet</h3>
                    <p className="text-sm text-slate-500 mb-4">Complete a quiz to see your stats here</p>
                    <button
                      onClick={() => {
                        setQuizHistory([
                          { topic: 'Python Basics', score: 4, total: 5, percentage: 80, date: '2024-01-15', answers: [
                            { question: 'What is a list comprehension?', userAnswer: 'B', correctAnswer: 'B', isCorrect: true, explanation: '...' },
                            { question: 'What is a decorator?', userAnswer: 'A', correctAnswer: 'C', isCorrect: false, explanation: '...' },
                          ]},
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
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-24">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Session</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded-xl px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500 uppercase tracking-wide">{uploadedContent ? 'Source' : 'Topic'}</span>
                      <span className="text-xs font-medium text-slate-200 max-w-[100px] text-right truncate">
                        {uploadedFileName || topic}
                      </span>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Difficulty</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        difficulty === 'Easy' ? 'bg-green-500/15 text-green-400' :
                        difficulty === 'Medium' ? 'bg-yellow-500/15 text-yellow-400' :
                        'bg-red-500/15 text-red-400'
                      }`}>
                        {difficulty}
                      </span>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Progress</span>
                      <span className="text-sm font-mono font-bold text-indigo-400">{currentIndex}/{totalQuestions}</span>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Score</span>
                      <span className="text-sm font-mono font-bold text-green-400">{score}</span>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Remaining</span>
                      <span className="text-sm font-mono text-slate-400">{totalQuestions - currentIndex}</span>
                    </div>
                    {/* Timer */}
                    <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${
                      timeLeft !== null && timeLeft <= 10
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-slate-800/50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Clock className={`w-3.5 h-3.5 ${timeLeft !== null && timeLeft <= 10 ? 'text-red-400' : 'text-slate-500'}`} />
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Time</span>
                      </div>
                      <span className={`text-sm font-mono font-bold ${timeLeft !== null && timeLeft <= 10 ? 'text-red-400' : 'text-slate-200'}`}>
                        {timeLeft !== null ? `${timeLeft}s` : '--'}
                      </span>
                    </div>
                  </div>
                  {/* Progress ring mini */}
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6366f1" strokeWidth="3"
                            strokeDasharray={`${progress * 0.97} ${100 - progress * 0.97}`}
                            strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-indigo-400">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Overall</p>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Keyboard hints */}
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Keyboard className="w-3 h-3" />
                      <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs font-mono">A</kbd>–<kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs font-mono">D</kbd> to answer</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl" />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600" />
                  <div className="font-mono text-xs font-semibold text-indigo-400 uppercase tracking-[0.2em] mb-4">
                    Question {currentIndex} of {totalQuestions}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold leading-relaxed max-w-2xl mx-auto text-slate-100 relative z-10">
                    {question.question}
                  </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {question.options?.map((opt, i) => {
                    const letter = opt.split(')')[0].trim()
                    const text = opt.split(')', 1)[1]?.trim() || opt

                    return (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !loading && submitAnswer(letter)}
                        disabled={loading}
                        className="group bg-slate-800/80 border border-slate-700/50 hover:border-indigo-500/60 rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-500/5 disabled:opacity-50"
                      >
                        <div className="w-10 h-10 bg-slate-900/80 border border-slate-700 group-hover:border-indigo-500/50 rounded-lg flex items-center justify-center font-mono font-bold text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all duration-200">
                          {letter}
                        </div>
                        <span className="text-sm md:text-base text-slate-200 group-hover:text-slate-100 font-medium text-left leading-snug transition-colors">{text}</span>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto"
            >
              <div className={`rounded-2xl p-8 ${feedback.isCorrect
                ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20'
                : 'bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-500/20'
              }`}>
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    feedback.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <span className="text-3xl">{feedback.isCorrect ? '✓' : '✗'}</span>
                  </div>
                  <h2 className={`text-2xl font-bold ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    {feedback.isCorrect
                      ? 'Great job! You know your stuff.'
                      : 'Keep going — review the explanation below.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className={`bg-slate-800/80 rounded-xl p-4 text-center ${feedback.isCorrect ? '' : 'ring-1 ring-red-500/30'}`}>
                    <div className={`text-xl font-mono font-bold ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {feedback.text.match(/Your answer: ([A-D])/)?.[1] || '?'}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mt-1.5">Your Answer</div>
                  </div>
                  <div className="bg-slate-800/80 rounded-xl p-4 text-center ring-1 ring-indigo-500/30">
                    <div className="text-xl font-mono font-bold text-indigo-400">
                      {feedback.text.match(/Correct answer: ([A-D])/)?.[1] || '?'}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mt-1.5">Correct Answer</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-5 px-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Score</span>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${totalQuestions > 0 ? (score / totalQuestions) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400">{score}/{totalQuestions}</span>
                </div>

                {feedback.text.includes('Explanation:') && (
                  <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-5 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm">💡</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Explanation</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {feedback.text.split('Explanation:')[1]?.trim()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={nextQuestion}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><span>Next Question</span> <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
                <p className="text-xs text-slate-600 text-center mt-3">Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono">Enter</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono">Space</kbd> to continue</p>
              </div>
            </motion.div>
          )}

          {/* RESULTS SCREEN */}
          {mode === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 border border-slate-800 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-600/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-600/5 rounded-full blur-3xl" />

                <div className="relative z-10">
                  <div className="w-14 h-14 bg-indigo-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-7 h-7 text-indigo-400" />
                  </div>
                  <h1 className="text-3xl font-bold mb-1">Quiz Complete!</h1>
                  <p className="text-sm text-slate-500 mb-6">{topic} &middot; {difficulty}</p>

                  <div className="w-48 h-48 mx-auto mb-6 rounded-full flex items-center justify-center relative"
                    style={{
                      background: `conic-gradient(#6366f1 ${(score/totalQuestions)*360}deg, #1e293b 0)`,
                      boxShadow: '0 0 60px rgba(99, 102, 241, 0.15)'
                    }}>
                    <div className="absolute w-40 h-40 bg-slate-900 rounded-full" />
                    <div className="relative z-10 text-center">
                      <div className="text-4xl font-mono font-bold text-slate-100">{score}<span className="text-lg text-slate-500">/{totalQuestions}</span></div>
                      <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Score</div>
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-lg font-bold mb-5 ${
                    score/totalQuestions >= 0.8 ? 'bg-green-500/15 text-green-400' :
                    score/totalQuestions >= 0.6 ? 'bg-indigo-500/15 text-indigo-400' :
                    'bg-red-500/15 text-red-400'
                  }`}>
                    {score/totalQuestions >= 0.9 ? 'A+' : score/totalQuestions >= 0.8 ? 'A' : score/totalQuestions >= 0.7 ? 'B' : score/totalQuestions >= 0.6 ? 'C' : 'D'}
                  </div>

                  <p className="text-sm text-slate-500 mb-7 max-w-xs mx-auto">
                    {score/totalQuestions >= 0.8 ? 'Outstanding! You have mastered this topic.' :
                     score/totalQuestions >= 0.6 ? 'Solid effort! Review the answers below to improve.' :
                     'Keep learning! Review the answers below.'}
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-slate-800/80 rounded-xl p-4">
                      <div className="text-xl font-mono font-bold text-indigo-400">{((score/totalQuestions)*100).toFixed(1)}%</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide mt-1.5">Accuracy</div>
                    </div>
                    <div className="bg-slate-800/80 rounded-xl p-4">
                      <div className="text-xl font-mono font-bold text-green-400">{score}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide mt-1.5">Correct</div>
                    </div>
                    <div className="bg-slate-800/80 rounded-xl p-4">
                      <div className="text-xl font-mono font-bold text-red-400">{totalQuestions - score}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide mt-1.5">Incorrect</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mb-2">
                    <button onClick={resetQuiz}
                      className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                      <RotateCcw className="w-4 h-4" /> New Quiz
                    </button>
                  </div>
                  <button onClick={resetQuiz}
                    className="w-full mt-2 bg-slate-800 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/80 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
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
