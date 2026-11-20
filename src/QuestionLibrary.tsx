import { useState } from 'react'
import prompts from './data/question-prompts.json'
import { questions } from './data/questions'

const readyIds = new Set(questions.map(question => question.id))
const pageSize = 20

interface Props {
  onBack: () => void
}

export default function QuestionLibrary({ onBack }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('all')
  const query = search.trim().toLocaleLowerCase('sq')
  const filtered = prompts.filter(question => {
    const matchesSearch = !query || String(question.id) === query ||
      question.question.toLocaleLowerCase('sq').includes(query)
    const matchesFilter = filter === 'all' ||
      (filter === 'ready' ? readyIds.has(question.id) : !readyIds.has(question.id))
    return matchesSearch && matchesFilter
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <main className="quiz-container">
      <section className="card">
        <span className="card-label">BIBLIOTEKA E PYETJEVE</span>
        <h2>Pyetjet 1–4000</h2>
        <p>
          {prompts.length} pyetje nga PDF-i. {questions.length} kanë opsione
          dhe shpjegime për ushtrim; {prompts.length - questions.length} presin
          plotësimin dhe kontrollin e përgjigjeve. Në teste hyjnë vetëm
          pyetjet me përgjigje.
        </p>
        <label htmlFor="library-search">Kërko sipas numrit ose tekstit</label>
        <input
          id="library-search"
          type="search"
          value={search}
          placeholder="P.sh. 150 ose gjendja e jashtëzakonshme"
          onChange={event => { setSearch(event.target.value); setPage(0) }}
        />
        <label htmlFor="library-filter">Shfaq</label>
        <select id="library-filter" value={filter} onChange={event => {
          setFilter(event.target.value); setPage(0)
        }}>
          <option value="all">Të gjitha pyetjet</option>
          <option value="ready">Me përgjigje për ushtrim</option>
          <option value="pending">Në pritje të përgjigjeve</option>
        </select>
        <p role="status">U gjetën {filtered.length} pyetje.</p>
        {visible.map(question => (
          <article key={question.id} className="library-item">
            <span className="card-label">
              Nr. {question.id} · Faqja {question.pdfPage} në PDF
            </span>
            <h3>{question.question}</h3>
            <span className={readyIds.has(question.id) ? 'bank-badge ready' : 'bank-badge'}>
              {readyIds.has(question.id) ? 'Me përgjigje për ushtrim' : 'Në pritje të përgjigjeve'}
            </span>
          </article>
        ))}
        <p>Faqja {page + 1} nga {pageCount}</p>
        <div className="quiz-actions">
          <button className="button button-secondary" disabled={page === 0}
            onClick={() => setPage(previous => previous - 1)}>Faqja e mëparshme</button>
          <button className="button button-secondary" disabled={page >= pageCount - 1}
            onClick={() => setPage(previous => previous + 1)}>Faqja tjetër</button>
          <button className="button" onClick={onBack}>Kthehu në ballinë</button>
        </div>
      </section>
    </main>
  )
}
