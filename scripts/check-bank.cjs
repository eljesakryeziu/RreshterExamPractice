const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { stripTypeScriptTypes } = require('node:module')

// Execute the actual modules; the built-in parser removes only TypeScript syntax.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8')
  let code = stripTypeScriptTypes(source)
  const names = [...code.matchAll(/export (?:const|function) (\w+)/g)].map(match => match[1])
  code = code.replace(/import (\w+) from ['"]([^'"]+)['"]/g, 'const $1 = require("$2")')
    .replace(/import \{([^}]+)\} from ['"]([^'"]+)['"]/g, 'const {$1} = require("$2")')
    .replace(/export (?=const|function)/g, '')
  module._compile(code + '\nObject.assign(exports, {' + names.join(',') + '})', filename)
}
const root = path.resolve(__dirname, '..')
const { questions } = require(path.join(root, 'src/data/questions.ts'))
const { practiceQuestions } = require(path.join(root, 'src/data/practice-questions.ts'))
const prompts = require(path.join(root, 'src/data/question-prompts.json'))
const letters = ['A', 'B', 'C', 'D']
assert.equal(questions.length, 4000)
assert.equal(practiceQuestions, questions, 'Practice and exams must share the full bank')
for (const [index, question] of questions.entries()) {
  assert.equal(question.id, index + 1)
  assert.ok(!question.pending)
  assert.ok(letters.includes(question.correctAnswer))
  assert.deepEqual(Object.keys(question.options).sort(), letters)
  assert.ok(Object.values(question.options).every(value => typeof value === 'string' && value.trim()))
  assert.equal(new Set(Object.values(question.options).map(value => value.toLowerCase().trim())).size, 4)
  assert.ok(question.explanation.trim())
  assert.ok(question.source.startsWith('https://') || question.source.startsWith('/materiale/'))
  if (index >= 500) assert.equal(question.question, prompts[index].question)
  if (question.source.startsWith('/materiale/')) {
    const [file, fragment] = question.source.split('#')
    assert.ok(fs.existsSync(path.join(root, 'public', file)))
    const page = Number(fragment.replace('page=', ''))
    assert.ok(page >= 1 && page <= 498)
  }
}
// Regression checks for omissions found in the content audit.
const answerText = id => questions[id - 1].options[questions[id - 1].correctAnswer]
assert.ok(answerText(503).includes('gjinisë së kundërt'))
assert.ok(answerText(503).includes('të mitur'))
assert.ok(answerText(1065).includes('deri në 1 metër'))
for (const question of questions) {
  for (const option of Object.values(question.options)) {
    assert.ok(!/CPS Kosovo\+|Shqip\+1 Procedurat|Organizimi i Policisë së Kosovës \(532/.test(option))
    assert.ok(!/\b1 vjet\b/.test(option))
  }
}
for (const count of [10,20,30,40,50,60,70,80,90,100]) {
  const lastStart = Math.floor(questions.length / count) * count - count
  const selection = questions.slice(lastStart, lastStart + count)
  assert.equal(selection.length, count)
  assert.equal(new Set(selection.map(question => question.id)).size, count)
  assert.ok(selection.every(question => question.id > 500))
}
const memory = new Map()
global.localStorage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: key => memory.delete(key),
}
const storage = require(path.join(root, 'src/storage.ts'))
const answers = Object.fromEntries(questions.map(question => [question.id, question.correctAnswer]))
const session = { mode: 'practice', activeQuestions: questions, currentIndex: 3999, answers }
assert.equal(storage.saveSession(session), true)
const bytes = Buffer.byteLength(memory.get('rreshter-react-session-v1'))
assert.ok(bytes < 100000, 'Full practice session must fit mobile storage')
let restored = storage.loadSession()
assert.equal(restored.activeQuestions.length, 4000)
assert.equal(restored.currentIndex, 3999)
assert.deepEqual(restored.answers, answers)
assert.equal(restored.activeQuestions[3999], questions[3999])
// Backward compatibility with the previous snapshot format.
memory.set('rreshter-react-session-v1', JSON.stringify({ ...session, activeQuestions: questions.slice(0, 500), currentIndex: 499, answers: {1: questions[0].correctAnswer} }))
assert.equal(storage.loadSession().activeQuestions.length, 500)
for (const bad of [
  { questionIds: [4001], currentIndex: 0 },
  { questionIds: [1,1], currentIndex: 0 },
  { questionIds: [1], currentIndex: 1 },
  { questionIds: [1], currentIndex: 0, answers: {1:'Z'} },
]) {
  memory.set('rreshter-react-session-v1', JSON.stringify({ mode:'practice', answers:{}, ...bad }))
  assert.equal(storage.loadSession(), null)
}
localStorage.setItem = () => { throw new Error('Quota exceeded') }
assert.equal(storage.saveSession(session), false)
assert.equal(storage.clearSession(), true)
console.log(`PASS: 4000 complete records, shared practice/exam bank, all exam sizes, source links, legacy restore, corrupt storage, full session ${bytes} bytes`)
