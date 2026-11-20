import questionBank from './question-bank.json'

// Banka e ushtrimeve. Përgjigjet 501–4000 bazohen në PDF-në e dhënë dhe plotësimet e dokumentuara.
export type AnswerLetter = 'A' | 'B' | 'C' | 'D'

export interface Question {
  id: number
  question: string
  options: Partial<Record<AnswerLetter, string>>
  correctAnswer: AnswerLetter | null
  pending?: boolean
  explanation: string
  source: string
  article?: string
  pdfPage?: number
}

export const questions: Question[] = questionBank as Question[]
