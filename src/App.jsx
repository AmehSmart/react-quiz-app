import { useState, useEffect } from 'react'
import './App.css'

export default function App() {
  const [quizStarted, setQuizStarted] = useState(false)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [answersChecked, setAnswersChecked] = useState(false)
  const [score, setScore] = useState(0)
  
  // Timer State (e.g., 60 seconds)
  const [timeLeft, setTimeLeft] = useState(60)

  // Decodes HTML entities
  function decodeHtml(html) {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  }

  // Fetch Logic
  async function fetchQuestions() {
    setLoading(true)
    setAnswersChecked(false)
    setScore(0)
    setTimeLeft(60) // Reset timer clock on clean fetch
    try {
      const res = await fetch('https://opentdb.com/api.php?amount=5')
      const data = await res.json()
      
      const formattedQuestions = data.results.map((q) => {
        const decodedCorrect = decodeHtml(q.correct_answer)
        const decodedIncorrects = q.incorrect_answers.map(ans => decodeHtml(ans))
        const allAnswers = [decodedCorrect, ...decodedIncorrects].sort(() => Math.random() - 0.5)

        return {
          id: Math.random().toString(36).substr(2, 9),
          question: decodeHtml(q.question),
          correctAnswer: decodedCorrect,
          answers: allAnswers,
          selectedAnswer: null 
        }
      })
      setQuestions(formattedQuestions)
    } catch (error) {
      console.error("Error loading quiz data:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleStartQuiz() {
    setQuizStarted(true)
    fetchQuestions()
  }

  // Countdown Clock Side-Effect Hook
  useEffect(() => {
    // Only run the timer if the quiz has started and answers haven't been checked yet
    if (!quizStarted || answersChecked || loading) return

    // If time runs out, automatically check whatever answers they have selected
    if (timeLeft === 0) {
      handleCheckAnswers()
      return
    }

    // Tick downwards every 1000ms (1 second)
    const timerInterval = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1)
    }, 1000)

    // Clear the interval when the component unmounts or states flip
    return () => clearInterval(timerInterval)
  }, [quizStarted, timeLeft, answersChecked, loading])

  function handleSelectAnswer(questionId, answerValue) {
    if (answersChecked) return 
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === questionId ? { ...q, selectedAnswer: answerValue } : q
      )
    )
  }

  function handleCheckAnswers() {
    if (answersChecked) return // Prevent multiple calculations
    let correctCount = 0
    questions.forEach(q => {
      if (q.selectedAnswer === q.correctAnswer) {
        correctCount++
      }
    })
    setScore(correctCount)
    setAnswersChecked(true)
  }

  return (
    <>
      {!quizStarted ? (
        /* START SCREEN */
        <div className="quiz-body-wrapper">
          <div className="start-container">
            <h1 className="quiz-title">Quizzical</h1>
            <p className="quiz-desc">Test your knowledge with 5 random multiple choice questions</p>
            <button className="start-btn" onClick={handleStartQuiz}>
              Start quiz
            </button>
          </div>
        </div>
      ) : (
        /* QUIZ SCREEN */
        <div className="quiz-body-wrapper">
          <div className="quiz-questions-container">
            {loading ? (
              <p className="loading-text">Loading quiz questions...</p>
            ) : (
              <>
                {/* Visual Timer Display Bar */}
                <div className={`timer-banner ${timeLeft <= 10 ? 'urgent' : ''}`}>
                  {answersChecked ? "Quiz Completed" : `Time Remaining: ${timeLeft}s`}
                </div>

                {questions.map((q) => (
                  <div key={q.id} className="question-block">
                    <h3 className="question-text">{q.question}</h3>
                    <div className="answers-row">
                      {q.answers.map((answer, i) => {
                        let btnClass = "answer-btn"
                        if (!answersChecked) {
                          if (q.selectedAnswer === answer) btnClass += " selected"
                        } else {
                          if (answer === q.correctAnswer) btnClass += " correct"
                          else if (q.selectedAnswer === answer && answer !== q.correctAnswer) btnClass += " incorrect"
                          else btnClass += " dimmed"
                        }

                        return (
                          <button 
                            key={i} 
                            className={btnClass}
                            onClick={() => handleSelectAnswer(q.id, answer)}
                            disabled={answersChecked}
                          >
                            {answer}
                          </button>
                        )
                      })}
                    </div>
                    <hr className="divider" />
                  </div>
                ))}
                
                {!answersChecked ? (
                  <button className="check-btn" onClick={handleCheckAnswers}>
                    Check answers
                  </button>
                ) : (
                  <div className="results-container">
                    <p className="score-text">You scored {score}/{questions.length} correct answers</p>
                    <button className="check-btn" onClick={fetchQuestions}>
                      Play again
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
