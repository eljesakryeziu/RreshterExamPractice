import { useEffect, useRef, useState } from 'react'
import {
  loadSession,
  saveSession,
  clearSession,
} from './storage'
import type { SavedSession } from './storage'
import { questions } from './data/questions'
import type { AnswerLetter, Question } from './data/questions'
import './App.css'
import { loadHistory, loadMistakes, saveHistory, saveMistakes, updateMistakes } from './progress'
import type { TestResult } from './progress'
import { practiceQuestions } from './data/practice-questions'

type QuestionOrder = 'random' | 'ordered'
type Mode = 'practice' | 'exam'
type Screen = 'home' | 'quiz' | 'result' | 'history'
type Answers = Partial<Record<number, AnswerLetter>>

function shuffleQuestions(items: Question[]): Question[] {
  const shuffled = [...items]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))

    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

function App() {
  const [history, setHistory] = useState<TestResult[]>(loadHistory)
  const [mistakeIds, setMistakeIds] = useState<number[]>(loadMistakes)
  const finished = useRef(false)
  const savedMistakeQuestions = questions.filter(question => mistakeIds.includes(question.id))

  function persistMistakes(next: number[]) {
    setMistakeIds(next)
    if (!saveMistakes(next)) setStorageError(true)
  }

  const [savedSession, setSavedSession] =
    useState<SavedSession | null>(() => loadSession())
  const [storageError, setStorageError] = useState(false)

  const [questionCount, setQuestionCount] = useState(50)
  const [examStart, setExamStart] = useState(1)
  const [questionOrder, setQuestionOrder] =
    useState<QuestionOrder>('random')

  const [screen, setScreen] = useState<Screen>('home')
  const [mode, setMode] = useState<Mode>('practice')
  const [activeQuestions, setActiveQuestions] =
    useState<Question[]>([])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})

  useEffect(() => {
    if (screen !== 'quiz' || activeQuestions.length === 0) return

    const currentSession: SavedSession = {
      mode, activeQuestions, currentIndex, answers,
    }
    const saved = saveSession(currentSession)
    setStorageError(!saved)
    if (saved) setSavedSession(currentSession)
  }, [screen, mode, activeQuestions, currentIndex, answers])

  function continueSession() {
    if (!savedSession) return
    finished.current = false
    setMode(savedSession.mode)
    // Refresh saved prompts from the current bank without losing prior answers.
    const currentBank = new Map(practiceQuestions.map(question => [question.id, question]))
    setActiveQuestions(savedSession.activeQuestions.map(
      question => currentBank.get(question.id) ?? question
    ))
    setCurrentIndex(savedSession.currentIndex)
    setAnswers(savedSession.answers)
    setScreen('quiz')
  }

  const currentQuestion = activeQuestions[currentIndex]

  const selectedAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined

  const answeredCount = activeQuestions.filter(
    (question) => answers[question.id] !== undefined
  ).length

  const scoredQuestions = activeQuestions.filter(question => !question.pending)
  const pendingCount = activeQuestions.length - scoredQuestions.length

  const correctCount = scoredQuestions.filter(
    (question) =>
      answers[question.id] === question.correctAnswer
  ).length

  const wrongCount = answeredCount - correctCount
  const unansweredCount = scoredQuestions.length - answeredCount

  const percentage =
    scoredQuestions.length > 0
      ? Math.round((correctCount / scoredQuestions.length) * 100)
      : 0

  function startSession(
    nextMode: Mode,
    selectedQuestions: Question[]
  ) {
    if (selectedQuestions.length === 0) {
      alert('Nuk ka pyetje për këtë përzgjedhje.')
      return
    }

    if (savedSession && !window.confirm(
      'Ke një sesion të papërfunduar. A dëshiron ta zëvendësosh me një të ri?'
    )) return

    finished.current = false
    setMode(nextMode)
    setActiveQuestions(selectedQuestions)
    setCurrentIndex(0)
    setAnswers({})
    setScreen('quiz')
  }

  function startPractice() {
    const orderedQuestions = [...practiceQuestions].sort(
      (a, b) => a.id - b.id
    )

    startSession('practice', orderedQuestions)
  }

  function startExam() {
    if (questions.length < questionCount) {
      alert(
        `Janë shtuar vetëm ${questions.length} pyetje. ` +
        'Zgjedh një test më të shkurtër.'
      )
      return
    }

    const pool =
      questionOrder === 'random'
        ? shuffleQuestions(questions)
        : [...questions].sort((a, b) => a.id - b.id)

    const offset = questionOrder === 'ordered' ? examStart - 1 : 0
    const selected = pool.slice(offset, offset + questionCount)
    if (selected.length !== questionCount) {
      alert('Ky grup nuk ka mjaft pyetje. Zgjedh një grup tjetër.')
      return
    }
    startSession('exam', selected)
  }

  function chooseAnswer(letter: AnswerLetter) {
    if (!currentQuestion || currentQuestion.pending) return

    // Në ushtrim përgjigjja kontrollohet vetëm një herë.
    if (mode === 'practice' && selectedAnswer !== undefined) {
      return
    }

    if (mode === 'practice') {
      persistMistakes(updateMistakes(mistakeIds, [currentQuestion], {
        [currentQuestion.id]: letter,
      }, false))
    }

    // Në provim përgjigjja mund të ndryshohet.
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: letter,
    }))
  }

  function nextQuestion() {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex((previous) => previous + 1)
    }
  }

  function previousQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex((previous) => previous - 1)
    }
  }

  function finishSession() {
    if (finished.current) return
    if (
      unansweredCount > 0 &&
      !window.confirm(
        `Ke ${unansweredCount} pyetje pa përgjigje. ` +
        'A dëshiron ta përfundosh? ' +
        'Pyetjet pa përgjigje llogariten me zero pikë.'
      )
    ) {
      return
    }

    finished.current = true
    if (scoredQuestions.length > 0) {
      const result: TestResult = {
        id: crypto.randomUUID(), date: new Date().toISOString(), mode,
        total: scoredQuestions.length, correct: correctCount,
        wrong: wrongCount, unanswered: unansweredCount, percent: percentage,
      }
      const nextHistory = [result, ...history].slice(0, 50)
      setHistory(nextHistory)
      if (!saveHistory(nextHistory)) setStorageError(true)
      persistMistakes(updateMistakes(mistakeIds, scoredQuestions, answers, true))
    }
    if (!clearSession()) setStorageError(true)
    setSavedSession(null)
    setScreen('result')
  }

  function leaveSession() {
    setScreen('home')
  }

  function practiceMistakes() {
    const mistakes = scoredQuestions.filter(
      (question) =>
        answers[question.id] !== question.correctAnswer
    )

    startSession('practice', mistakes)
  }

  function renderFeedback(question: Question) {
    if (question.pending || question.correctAnswer === null) {
      return <p className="pending-notice">Përgjigjja dhe opsionet e kësaj pyetjeje janë në përgatitje. Nuk llogaritet në rezultat.</p>
    }
    const answer = answers[question.id]
    const isCorrect = answer === question.correctAnswer

    return (
      <div
        className={
          isCorrect
            ? 'feedback feedback-success'
            : 'feedback feedback-error'
        }
      >
        <strong>
          {answer === undefined
            ? 'Pa përgjigje.'
            : isCorrect
              ? 'Përgjigje e saktë!'
              : 'Përgjigjja nuk është e saktë.'}
        </strong>

        {answer !== undefined && !isCorrect && (
          <p>
            Përgjigjja jote: {answer}.{' '}
            {question.options[answer]}
          </p>
        )}

        <p>
          Përgjigjja e saktë:{' '}
          <strong>
            {question.correctAnswer}.{' '}
            {question.options[question.correctAnswer]}
          </strong>
        </p>

        <p>{question.explanation}</p>

        <a
          href={question.source}
          target="_blank"
          rel="noopener noreferrer"
        >
          Lexo burimin
        </a>
      </div>
    )
  }

  return (
    <>
      <header className="site-header">
        <h1>PËRGATITJE PËR GRADËN RRESHTER</h1>

        <p>
          Përforco njohuritë, mëso nga gabimet
          dhe vlerëso përgatitjen tënde për provim.
        </p>
      </header>

      {screen === 'home' && (
        <main className="home-grid">
          <section className="card">
            <span className="card-label">PËRGATITJE</span>

            <h2>Ushtrime</h2>
            <p className="bank-status">
              {practiceQuestions.length} pyetje me opsione A–D dhe shpjegime
            </p>

            <p>
              Përgjigju pyetjeve me ritmin tënd.
              Pas çdo përgjigjeje, shiko zgjidhjen
              e saktë dhe shpjegimin përkatës.
            </p>

            <button
              type="button"
              className="button"
              onClick={startPractice}
            >
              Fillo ushtrimin
            </button>

            {savedSession && (
              <button
                type="button"
                className="button button-secondary resume-button"
                onClick={continueSession}
              >
                Vazhdo {savedSession.mode === 'exam' ? 'provimin' : 'ushtrimin'} ku mbete
                {' '}({savedSession.activeQuestions.filter(
                  question => savedSession.answers[question.id] !== undefined
                ).length}/{savedSession.activeQuestions.length})
              </button>
            )}
            <p className="save-note">
              Përparimi ruhet automatikisht në këtë shfletues.
            </p>
            <button type="button" className="button button-secondary resume-button"
              onClick={() => setScreen('history')}>
              Historiku i rezultateve ({history.length})
            </button>
            <button type="button" className="button button-secondary resume-button"
              disabled={savedMistakeQuestions.length === 0}
              onClick={() => startSession('practice', savedMistakeQuestions)}>
              Ushtro gabimet ({savedMistakeQuestions.length})
            </button>
          </section>

          <section className="card">
            <span className="card-label">VETËVLERËSIM</span>

            <h2>Simulim Provimi</h2>

            <p>
              Zgjedh numrin dhe renditjen e pyetjeve.
              Rezultati dhe përgjigjet e sakta
              shfaqen vetëm në përfundim.
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                startExam()
              }}
            >
              <label htmlFor="question-count">
                Numri i pyetjeve
              </label>

              <select
                id="question-count"
                value={questionCount}
                onChange={(event) => {
                  setQuestionCount(Number(event.target.value))
                  setExamStart(1)
                }}
              >
                {Array.from({ length: 10 }, (_, index) => {
                  const count = (index + 1) * 10

                  return (
                    <option key={count} value={count}>
                      {count} pyetje
                    </option>
                  )
                })}
              </select>

              <label htmlFor="question-order">
                Renditja e pyetjeve
              </label>

              <select
                id="question-order"
                value={questionOrder}
                onChange={(event) => {
                  const value = event.target.value

                  if (
                    value === 'random' ||
                    value === 'ordered'
                  ) {
                    setQuestionOrder(value)
                  }
                }}
              >
                <option value="random">Të përziera</option>

                <option value="ordered">
                  Sipas rendit në PDF
                </option>
              </select>

              {questionOrder === 'ordered' && (
                <>
                  <label htmlFor="exam-start">Grupi i pyetjeve</label>
                  <select id="exam-start" value={examStart}
                    onChange={event => setExamStart(Number(event.target.value))}>
                    {Array.from({ length: Math.floor(questions.length / questionCount) }, (_, index) => {
                      const start = index * questionCount + 1
                      return <option key={start} value={start}>
                        Pyetjet {start}–{start + questionCount - 1}
                      </option>
                    })}
                  </select>
                </>
              )}

              <button
                type="submit"
                className="button button-blue"
              >
                Fillo provimin
              </button>
            </form>
          </section>
        </main>
      )}

      {screen === 'history' && (
        <main className="quiz-container">
          <section className="card">
            <span className="card-label">PËRPARIMI YT</span>
            <h2>Historiku i rezultateve</h2>
            <p>Ruhen 50 sesionet e fundit të përfunduara në këtë shfletues. Pyetjet në përgatitje përjashtohen nga rezultati.</p>
            {history.length === 0 ? (
              <p>Ende nuk ke përfunduar ndonjë provim ose ushtrim.</p>
            ) : history.map(result => (
              <article className="history-item" key={result.id}>
                <div className="history-heading">
                  <strong>{result.mode === 'exam' ? 'Provim' : 'Ushtrim'} · {result.total} pyetje</strong>
                  <span className="history-score">{result.percent}%</span>
                </div>
                <time dateTime={result.date}>{new Date(result.date).toLocaleString('sq-AL')}</time>
                <p>{result.correct} të sakta · {result.wrong} gabim · {result.unanswered} pa përgjigje</p>
              </article>
            ))}
            <div className="quiz-actions">
              {history.length > 0 && (
                <button type="button" className="button button-secondary" onClick={() => {
                  if (!window.confirm('A dëshiron ta fshish historikun? Gabimet dhe sesioni i ruajtur mbeten.')) return
                  if (saveHistory([])) setHistory([])
                  else setStorageError(true)
                }}>Fshi historikun</button>
              )}
              <button type="button" className="button" onClick={() => setScreen('home')}>
                Kthehu në ballinë
              </button>
            </div>
          </section>
        </main>
      )}

      {screen === 'quiz' && currentQuestion && (
        <main className="quiz-container">
          <section className="card">
            <span className="card-label">
              {mode === 'exam' ? 'PROVIM' : 'USHTRIM'} ·
              {' '}PYETJA {currentIndex + 1} NGA{' '}
              {activeQuestions.length}
            </span>

            <h2
              id="question-heading"
              className="question-heading"
            >
              {currentQuestion.question}
            </h2>

            {currentQuestion.pending ? (
              <div className="pending-notice" role="status">
                <strong>Përgjigjja është në përgatitje.</strong>
                <p>Kjo është pyetja origjinale nga PDF-i. Opsionet dhe shpjegimi ende nuk janë plotësuar. Mund të vazhdosh te pyetja tjetër; kjo pyetje nuk llogaritet në rezultat.</p>
              </div>
            ) : <div
              className="answer-list"
              role="group"
              aria-labelledby="question-heading"
            >
              {(
                Object.entries(currentQuestion.options) as [
                  AnswerLetter,
                  string,
                ][]
              ).map(([letter, text]) => {
                let className = 'answer-button'

                if (mode === 'practice' && selectedAnswer) {
                  if (
                    letter === currentQuestion.correctAnswer
                  ) {
                    className += ' answer-correct'
                  } else if (letter === selectedAnswer) {
                    className += ' answer-incorrect'
                  }
                }

                if (
                  mode === 'exam' &&
                  letter === selectedAnswer
                ) {
                  className += ' answer-selected'
                }

                return (
                  <button
                    key={letter}
                    type="button"
                    className={className}
                    aria-pressed={letter === selectedAnswer}
                    disabled={
                      mode === 'practice' &&
                      selectedAnswer !== undefined
                    }
                    onClick={() => chooseAnswer(letter)}
                  >
                    <span className="answer-letter">
                      {letter}
                    </span>

                    <span>{text}</span>
                  </button>
                )
              })}
            </div>

            }

            {mode === 'practice' && selectedAnswer && (
              <div role="status">
                {renderFeedback(currentQuestion)}
              </div>
            )}

            <p className="quiz-progress">
              Të përgjigjura: {answeredCount} nga{' '}
              {activeQuestions.length}
            </p>

            <div className="quiz-actions">
              {currentIndex > 0 && (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={previousQuestion}
                >
                  Pyetja e mëparshme
                </button>
              )}

              {currentIndex < activeQuestions.length - 1 && (
                <button
                  type="button"
                  className="button button-blue"
                  disabled={
                    mode === 'practice' &&
                    !currentQuestion.pending && selectedAnswer === undefined
                  }
                  onClick={nextQuestion}
                >
                  Pyetja tjetër
                </button>
              )}

              {(mode === 'exam' ||
                currentIndex === activeQuestions.length - 1) && (
                <button
                  type="button"
                  className="button"
                  disabled={
                    mode === 'practice' &&
                    !currentQuestion.pending && selectedAnswer === undefined
                  }
                  onClick={finishSession}
                >
                  {mode === 'exam'
                    ? 'Përfundo provimin'
                    : 'Shiko rezultatin'}
                </button>
              )}

              <button
                type="button"
                className="button button-secondary"
                onClick={leaveSession}
              >
                Kthehu në ballinë
              </button>
            </div>
          </section>
        </main>
      )}

      {screen === 'result' && (
        <main className="quiz-container">
          <section className="card">
            <span className="card-label">REZULTATI YT</span>

            <h2>
              {mode === 'exam'
                ? 'Provimi përfundoi'
                : 'Ushtrimi përfundoi'}
            </h2>

            <div className="result-percentage">
              {percentage}%
            </div>

            {mode === 'exam' && scoredQuestions.length > 0 &&
              correctCount * 2 > scoredQuestions.length && (
                <div className="dad-message" role="status">
                  <strong>Bravo babi! ❤️</strong>
                  <span>Vazhdo kështu, unë besoj në ty!</span>
                </div>
              )}

            {mode === 'exam' && scoredQuestions.length > 0 &&
              correctCount * 2 < scoredQuestions.length && (
                <div className="dad-message" role="status">
                  <strong>Mëso më shumë babi!</strong>
                </div>
              )}

            <p>
              <strong>{correctCount}</strong> të sakta ·{' '}
              <strong>{wrongCount}</strong> gabim ·{' '}
              <strong>{unansweredCount}</strong> pa përgjigje
            </p>
            {pendingCount > 0 && (
              <p>{pendingCount} pyetje në përgatitje janë përjashtuar nga rezultati. Përqindja llogaritet vetëm mbi {scoredQuestions.length} pyetjet me përgjigje.</p>
            )}

            <p>
              Gjithsej: {activeQuestions.length} pyetje.
              Rezultati shërben për vetëvlerësim dhe nuk
              përcakton kalimin në provimin zyrtar.
            </p>

            <div className="quiz-actions">
              {wrongCount + unansweredCount > 0 && (
                <button
                  type="button"
                  className="button button-blue"
                  onClick={practiceMistakes}
                >
                  Ushtro pyetjet ku gabove
                </button>
              )}

              <button
                type="button"
                className="button button-secondary"
                onClick={() => setScreen('home')}
              >
                Kthehu në ballinë
              </button>
            </div>

            <h3 className="review-title">
              Rishikimi i përgjigjeve
            </h3>

            {activeQuestions.map((question, index) => {
              const answer = answers[question.id]

              const status =
                question.pending
                  ? 'Në përgatitje'
                  : answer === undefined
                  ? 'Pa përgjigje'
                  : answer === question.correctAnswer
                    ? 'Saktë'
                    : 'Gabim'

              return (
                <details
                  key={question.id}
                  className="review-item"
                >
                  <summary>
                    {index + 1}. {question.question}
                    {' '}— {status}
                  </summary>

                  {renderFeedback(question)}
                </details>
              )
            })}
          </section>
        </main>
      )}

      {storageError && (
        <p role="alert" className="quiz-container storage-warning">
          Shfletuesi nuk po lejon ruajtjen ose fshirjen e të dhënave.
          Mos e mbyll faqen nëse dëshiron ta përfundosh këtë sesion.
        </p>
      )}

      <footer className="site-footer">
        <p>
          Platformë e pavarur për përgatitje individuale.
          Nuk është faqe zyrtare e Policisë së Kosovës.

        </p>
      </footer>
    </>
  )
}

export default App