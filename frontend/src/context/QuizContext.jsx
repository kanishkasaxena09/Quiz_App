import React, { createContext, useContext } from 'react'
import { useQuiz } from '../hooks/useQuiz'

const QuizContext = createContext(null)

export const QuizProvider = ({ children }) => {
  const quiz = useQuiz()
  
  return (
    <QuizContext.Provider value={quiz}>
      {children}
    </QuizContext.Provider>
  )
}

export const useQuizContext = () => {
  const context = useContext(QuizContext)
  if (!context) throw new Error('useQuizContext must be used within QuizProvider')
  return context
}