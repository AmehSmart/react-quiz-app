import { useState } from 'react'
import './App.css'

export default function App() {
  const [quizStarted, setQuizStarted] = useState(false)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [answersChecked, setAnswersChecked] = useState(false)
  const [score, setScore] = useState(0)

  // Decodes ugly HTML entities like &quot; and &amp;
  function decodeHtml(html) {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  }

  // Fetches and formats data from the API
  async function fetchQuestions() {
    setLoading(true)
    setAnswersChecked(false)
    setScore(0)
    try {
      const res = await fetch('https://opentdb.com/api.php?amount=10')
      const data = await res.json()
      
      const formattedQuestions = data.results.map((q) => {
        const decodedCorrect = decodeHtml(q.correct_answer)
        const decodedIncorrects = q.incorrect_answers.map(ans => decodeHtml(ans))
        const allAnswers = [decodedCorrect, ...decodedIncorrects].sort(() => Math.random() - 0.5)

        return {
          id: Math.random().toString(36).substr(2, 9), // Unique ID for tracking mapping
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

  // Updates the state with the selected choice for a specific question
  function handleSelectAnswer(questionId, answerValue) {
    if (answersChecked) return // Lock selections if answers are checked

    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === questionId ? { ...q, selectedAnswer: answerValue } : q
      )
    )
  }

  // Calculates correct choices and locks state
  function handleCheckAnswers() {
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
          <div className="start-contain">
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
                {questions.map((q) => (
                  <div key={q.id} className="question-block">
                    <h3 className="question-text">{q.question}</h3>
                    <div className="answers-row">
                      {q.answers.map((answer, i) => {
                        // Class logic for dynamic styling states
                        let btnClass = "answer-btn"
                        
                        if (!answersChecked) {
                          // Standard styling before grading
                          if (q.selectedAnswer === answer) {
                            btnClass += " selected"
                          }
                        } else {
                          // Post-grading styling classes
                          if (answer === q.correctAnswer) {
                            btnClass += " correct" // Always green
                          } else if (q.selectedAnswer === answer && answer !== q.correctAnswer) {
                            btnClass += " incorrect" // Clicked wrong answer turns red
                          } else {
                            btnClass += " dimmed" // Everything else fades out
                          }
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
                
                {/* Conditional UI block footer */}
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
