import type { AnswerLetter, Question } from './data/questions'

export interface TestResult {
  id: string
  date: string
  mode: 'practice' | 'exam'
  total: number
  correct: number
  wrong: number
  unanswered: number
  percent: number
}

const HISTORY_KEY = 'rreshter-react-history-v1'
const MISTAKES_KEY = 'rreshter-react-mistakes-v1'

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadHistory(): TestResult[] {
  const value = read(HISTORY_KEY)
  if (!Array.isArray(value)) return []
  return value.filter((item): item is TestResult => {
    if (!item || typeof item !== 'object') return false
    const fields = ['total', 'correct', 'wrong', 'unanswered', 'percent'] as const
    return typeof item.id === 'string' && typeof item.date === 'string' &&
      Number.isFinite(Date.parse(item.date)) &&
      ['practice', 'exam'].includes(item.mode) &&
      fields.every(key => Number.isInteger(item[key]) && item[key] >= 0) &&
      item.total > 0 && item.percent <= 100 &&
      item.correct + item.wrong + item.unanswered === item.total &&
      item.percent === Math.round(item.correct / item.total * 100)
  }).slice(0, 50)
}

export function loadMistakes(): number[] {
  const value = read(MISTAKES_KEY)
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is number => Number.isInteger(id) && id > 0))]
    : []
}

export function saveMistakes(ids: number[]): boolean {
  return write(MISTAKES_KEY, [...new Set(ids)])
}

export function updateMistakes(
  previous: number[],
  questions: Question[],
  answers: Partial<Record<number, AnswerLetter>>,
  includeUnanswered: boolean,
): number[] {
  const ids = new Set(previous)
  for (const question of questions) {
    if (question.pending || question.correctAnswer === null) continue
    const answer = answers[question.id]
    if (answer === undefined && !includeUnanswered) continue
    if (answer === question.correctAnswer) ids.delete(question.id)
    else ids.add(question.id)
  }
  return [...ids]
}

export function saveHistory(history: TestResult[]): boolean {
  return write(HISTORY_KEY, history.slice(0, 50))
}
