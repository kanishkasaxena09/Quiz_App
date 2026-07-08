import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const quizApi = {
  startQuiz: (topic, difficulty, numQuestions) =>
    api.post('/api/quiz/start', { topic, difficulty, num_questions: numQuestions }),

  submitAnswer: (sessionId, answer) =>
    api.post('/api/quiz/answer', { session_id: sessionId, answer }),

  nextQuestion: (sessionId) =>
    api.post('/api/quiz/next', { session_id: sessionId, answer: '' }),

  healthCheck: () =>
    api.get('/api/health')
}

export default quizApi