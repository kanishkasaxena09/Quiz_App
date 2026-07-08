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
    api.post('/quiz/start', { topic, difficulty, num_questions: numQuestions }),
  
  submitAnswer: (sessionId, answer) => 
    api.post('/quiz/answer', { session_id: sessionId, answer }),
  
  nextQuestion: (sessionId) => 
    api.post('/quiz/next', { session_id: sessionId, answer: '' }),
  
  healthCheck: () => 
    api.get('/health')
}

export default quizApi