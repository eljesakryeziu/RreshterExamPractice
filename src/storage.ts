import type { AnswerLetter, Question } from './data/questions'
import { practiceQuestions } from './data/practice-questions'

export interface SavedSession {
  mode: 'practice' | 'exam'
  activeQuestions: Question[]
  currentIndex: number
  answers: Partial<Record<number, AnswerLetter>>
}

const SESSION_KEY = 'rreshter-react-session-v1'
const bank = new Map(practiceQuestions.map(question => [question.id, question]))
const letters = ['A', 'B', 'C', 'D']

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw)
    if (!value || !['practice', 'exam'].includes(value.mode) ||
      !Number.isInteger(value.currentIndex) || value.currentIndex < 0 ||
      !value.answers || typeof value.answers !== 'object' || Array.isArray(value.answers)) return null
    // Older versions stored entire question snapshots. New sessions store only IDs.
    const ids: unknown = value.questionIds ?? value.activeQuestions?.map((question: Question) => question?.id)
    if (!Array.isArray(ids) || !ids.length || ids.length > bank.size ||
      new Set(ids).size !== ids.length || value.currentIndex >= ids.length) return null
    const activeQuestions: Question[] = []
    for (const id of ids) {
      if (!Number.isInteger(id) || !bank.has(id)) return null
      activeQuestions.push(bank.get(id)!)
    }
    const answers: SavedSession['answers'] = {}
    for (const [id, letter] of Object.entries(value.answers)) {
      const ident = Number(id)
      if (!ids.includes(ident) || !letters.includes(letter as string)) return null
      answers[ident] = letter as AnswerLetter
    }
    return { mode: value.mode, activeQuestions, currentIndex: value.currentIndex, answers }
  } catch {
    return null
  }
}

export function saveSession(session: SavedSession): boolean {
  try {
    // A 4,000-question session stays small enough for mobile localStorage quotas.
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      version: 2,
      mode: session.mode,
      questionIds: session.activeQuestions.map(question => question.id),
      currentIndex: session.currentIndex,
      answers: session.answers,
    }))
    return true
  } catch {
    return false
  }
}

export function clearSession(): boolean {
  try {
    localStorage.removeItem(SESSION_KEY)
    return true
  } catch {
    return false
  }
}
