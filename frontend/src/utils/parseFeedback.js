export const parseFeedback = (feedbackText) => {
  if (!feedbackText) return { yourAnswer: '', correctAnswer: '', explanation: '' }
  
  const lines = feedbackText.split('\n')
  
  const yourAnswer = lines.find(l => l.includes('Your answer:'))?.split(': ')[1] || ''
  const correctAnswer = lines.find(l => l.includes('Correct answer:'))?.split(': ')[1] || ''
  const explanation = lines.find(l => l.includes('Explanation:'))?.split(': ')[1] || ''
  
  return { yourAnswer, correctAnswer, explanation }
}