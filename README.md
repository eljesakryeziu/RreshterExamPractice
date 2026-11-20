Rreshter Exam Practice
An Albanian-language web app for preparing for the Kosovo Police Sergeant exam. It helps candidates practise questions, take mock exams, review their answers, and track their progress.

The project began as a study tool for a family member and was built with React and TypeScript.
Features
- Practice mode: Work through questions in source order, check answers immediately, and review explanations and references for completed questions.
- Mock exams: Choose from 10 to 100 questions. Questions can be shuffled without repetition or shown in source order; source-order exams can be limited to a selected question range.
- Exam navigation: Move between questions and change answers before submitting.
- Results and review: See your score, correct and incorrect answers, unanswered questions, and a review of each question. Correct answers are revealed after the exam.
- Resume progress: Continue an unfinished session after refreshing or reopening the page.
- History: Keep up to 50 completed sessions with their dates and scores.
- Practise mistakes: Retry questions answered incorrectly. Correct answers are removed from the mistakes list.
Question bank status
The source material contains 4,000 questions across 153 pages and does not include answer choices or an answer key. Question preparation is ongoing.
Questions	Status
1–300	Answer choices, answers, explanations, and legal references are available
301–4,000	Original question text is available; answer choices and answers are still being prepared


Mock exams use the 300 completed questions. Practice mode includes all 4,000 imported questions; questions still in preparation can be skipped and are excluded from the score. Questions with available answers that are left unanswered count as incorrect.

Completed answers are based on references to the Constitution, the Criminal Code, and the Criminal Procedure Code. Legal references should be checked against current laws and exam materials.
This is an independent study project. It is not affiliated with or endorsed by the Kosovo Police, and its answers are not an official exam answer key.

Technology
- React
- TypeScript
- Vite
- CSS
- localStorage for local progress
- Oxlint
The app is a frontend project. It does not currently require a backend, database, or user account.
Run locally
You need Node.js and npm. The project was developed using Node.js 24.
npm install
npm run dev
Open the local URL shown by Vite, usually http://localhost:5173. Keep the terminal running while using the app. Stop the development server with Ctrl + C.
Available commands
Command	Description
npm run dev	Start the local development server
npm run build	Type-check the project and create a production build in dist/
npm run preview	Preview the production build locally
npm run lint	Run Oxlint


Project structure
src/
  data/
    questions.ts              # Completed questions, types, and answers
    question-prompts.json     # Imported question text and source page numbers
    practice-questions.ts     # Combines completed and in-progress questions
  App.tsx                     # Main app, practice, exams, results, and history
  App.css                     # Component styles and dark theme
  index.css                   # Base styles
  main.tsx                    # App entry point
  storage.ts                  # Session storage and validation
  progress.ts                 # History and mistakes tracking
Add completed questions
Add completed questions to src/data/questions.ts, preserving the original question ID. Example structure:
{
  id: 201,
  question: 'Question text from the study material',
  options: {
    A: 'Option A',
    B: 'Option B',
    C: 'Option C',
    D: 'Option D',
  },
  correctAnswer: 'B',
  explanation: 'An explanation supported by the relevant source.',
  source: 'https://official-source-url',
  article: 'Article number',
  pdfPage: 1,
}
Before adding a question, check that its ID is unique, all four options are distinct, and the answer is supported by its source. Keep the list sorted by ID. Do not mark a question as completed until its answer has been checked.
Progress and privacy
The active session, exam history, and mistakes are stored in the browser’s localStorage. The app does not send this progress to a server.
- Progress is separate for each browser and device.
- Progress does not transfer automatically between the local app and a published website.
- Clearing site data or closing a private browsing session may erase saved progress.
- The app displays a notice if the browser blocks local storage.
Deployment
The app can be deployed as a static website and does not currently require environment variables.

For a Netlify deployment connected to GitHub, use:
- Build command: npm run build
- Publish directory: dist
- Node.js version: 24
To create a manual deployment, run npm run build and upload the generated dist folder to Netlify. Build and upload it again after future changes.

localhost is available only on the computer running the development server. Share the deployed HTTPS link with other users.
Planned improvements
- Complete and review questions 301–4,000.
- Verify answers against the relevant study materials and procedures.
- Add an optional exam timer.
- Explore a backend and database if cross-device progress syncing is added.
