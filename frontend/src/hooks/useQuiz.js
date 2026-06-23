import { useState, useCallback } from 'react'
import { quizApi } from '../api/quizApi'

export const useQuiz = () => {
  const [sessionId, setSessionId] = useState(null)
  const [question, setQuestion] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [mode, setMode] = useState('setup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const startQuiz = useCallback(async (topic, difficulty, numQuestions) => {
    setLoading(true)
    setError(null)
    try {
      const res = await quizApi.startQuiz(topic, difficulty, numQuestions)
      const data = res.data.data
      
      setSessionId(data.session_id)
      setQuestion(data.question)
      setCurrentIndex(data.current_index)
      setTotalQuestions(data.total_questions)
      setScore(data.score)
      setMode('question')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const submitAnswer = useCallback(async (answer) => {
    if (!sessionId) return
    setLoading(true)
    try {
      const res = await quizApi.submitAnswer(sessionId, answer)
      const data = res.data.data
      
      setFeedback({
        isCorrect: data.is_correct,
        text: data.feedback,
        score: data.score
      })
      setScore(data.score)
      
      if (data.quiz_complete) {
        setMode('results')
      } else {
        setMode('feedback')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const nextQuestion = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const res = await quizApi.nextQuestion(sessionId)
      const data = res.data.data
      
      if (data.quiz_complete) {
        setMode('results')
      } else {
        setQuestion(data.question)
        setCurrentIndex(data.current_index + 1)
        setMode('question')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const reset = useCallback(() => {
    setMode('setup')
    setSessionId(null)
    setQuestion(null)
    setFeedback(null)
    setError(null)
  }, [])

  return {
    mode,
    question,
    currentIndex,
    totalQuestions,
    score,
    feedback,
    loading,
    error,
    startQuiz,
    submitAnswer,
    nextQuestion,
    reset
  }
}