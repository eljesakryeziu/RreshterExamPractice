# Rreshter - Përgatitja për provim

Aplikacion në shqip për përgatitje individuale për gradën rreshter në Policinë e Kosovës. Ofron ushtrime me kontroll të menjëhershëm, simulime provimi dhe ruajtje të përparimit në shfletues. Ndërfaqja përshtatet për telefon dhe kompjuter, me temë të errët navy blue.

Projekti nisi si një mjet për të ndihmuar një familjar të përgatitet për provim dhe u zhvillua me React dhe TypeScript.

## Funksionet

- **Ushtrime:** pyetjet sipas rendit të materialit, opsione A-D, kontroll i përgjigjes, shpjegim dhe lidhje te burimi për pyetjet e plotësuara.
- **Simulim provimi:** 10, 20, 30, 40, 50, 60, 70, 80, 90 ose 100 pyetje, të përziera pa përsëritje ose sipas rendit. Për rendin e materialit mund të zgjidhet grupi i pyetjeve.
- **Navigim gjatë provimit:** kthim te pyetja e mëparshme, ndryshim i përgjigjes dhe kalim te pyetja tjetër.
- **Rezultatet:** përqindja, përgjigjet e sakta, gabimet, pyetjet pa përgjigje dhe rishikimi i secilës pyetje. Në provim, përgjigjet e sakta shfaqen vetëm në fund.
- **Vazhdo ku mbete:** rikthimi i sesionit të papërfunduar pas rifreskimit ose mbylljes së faqes.
- **Historiku:** ruajtja e 50 sesioneve të fundit të përfunduara, me datën dhe rezultatin.
- **Ushtro gabimet:** përsëritja e pyetjeve ku është gabuar; një përgjigje e saktë i largon nga lista e gabimeve.

## Gjendja e pyetjeve

Materiali burimor përmban 4,000 pyetje në 153 faqe, pa opsione dhe pa çelës përgjigjesh. Integrimi i përmbajtjes vazhdon.

| Grupi | Gjendja aktuale |
| --- | --- |
| 1-300 | Me opsione A-D, përgjigje, shpjegime dhe referenca kushtetuese |
| 301-4000 | Tekstet origjinale shfaqen në ushtrim; opsionet dhe përgjigjet janë në përgatitje |

Simulimet përdorin vetëm 300 pyetjet e plotësuara. Ushtrimi përmban 4,000 pyetjet e importuara; ato që janë në përgatitje mund të kalohen dhe përjashtohen nga rezultati. Pyetjet me përgjigje që përdoruesi i lë pa plotësuar marrin zero pikë.

Përgjigjet e shtuara mbështeten në Kushtetutë, Kodin Penal dhe Kodin e Procedurës Penale. Lidhja përkatëse ruhet te secila pyetje. Për Kodin Penal janë shqyrtuar edhe ndryshimet e ligjit 08/L-188; referencat duhen rishikuar kur ndryshojnë dispozitat ose materialet e provimit. Zgjidhjet e skenarëve praktikë janë zbatime të arsyetuara të parimeve kushtetuese; procedurat operative duhet të kontrollohen edhe në materialet përkatëse. Projekti është i pavarur dhe nuk përfaqëson Policinë e Kosovës ose një çelës zyrtar provimi.

## Teknologjitë

| Teknologjia | Përdorimi |
| --- | --- |
| React | Ndërfaqja dhe menaxhimi i gjendjes me hooks |
| TypeScript | Tipizimi i pyetjeve, përgjigjeve dhe sesioneve |
| Vite | Serveri i zhvillimit dhe ndërtimi për publikim |
| CSS | Dizajni responsive dhe tema e errët |
| localStorage | Sesioni, historiku dhe gabimet në pajisjen e përdoruesit |
| Oxlint | Kontrolli statik i kodit |

Aplikacioni aktual është frontend dhe nuk kërkon backend, databazë ose llogari përdoruesi.

## Nisja lokale

Nevojiten Node.js dhe npm. Node.js 24 është versioni i përdorur gjatë zhvillimit të këtij projekti.

Nga terminali në dosjen e projektit:

```bash
npm install
npm run dev
```

Hap adresën `Local` që shfaq Vite, zakonisht `http://localhost:5173`. Nëse porta është e zënë, Vite mund të zgjedhë një tjetër. Terminali duhet të mbetet aktiv; serveri ndalet me `Ctrl + C`.

Nëse shfaqet `ERR_CONNECTION_REFUSED`, ndiz përsëri serverin me `npm run dev` dhe përdor adresën e afishuar në terminal.

### Komandat e projektit

| Komanda | Qëllimi |
| --- | --- |
| `npm run dev` | Nis serverin lokal me përditësim automatik |
| `npm run build` | Kontrollon TypeScript-in dhe krijon versionin në `dist/` |
| `npm run preview` | Shërben lokalisht versionin e ndërtuar |
| `npm run lint` | Ekzekuton Oxlint |

## Struktura kryesore

```text
src/
  data/
    questions.ts             # Pyetjet e plotësuara, tipat dhe përgjigjet
    question-prompts.json    # Tekstet e 4,000 pyetjeve dhe faqet e PDF-it
    practice-questions.ts    # Bashkon pyetjet e plota me ato në përgatitje
  App.tsx                   # Ballina, ushtrimi, provimi, rezultatet dhe historiku
  App.css                   # Stilet e komponentëve dhe tema navy
  index.css                 # Stilet bazë
  main.tsx                  # Pika hyrëse e React-it
  storage.ts                # Ruajtja dhe kontrolli i sesionit
  progress.ts               # Historiku dhe lista e gabimeve
```

## Shtimi i pyetjeve

Pyetjet e plotësuara shtohen te `src/data/questions.ts`, duke ruajtur ID-në origjinale nga PDF-i. Shembull i strukturës, jo pyetje për ta importuar:

```ts
{
  id: 201,
  question: 'Teksti i pyetjes nga materiali',
  options: {
    A: 'Alternativa A',
    B: 'Alternativa B',
    C: 'Alternativa C',
    D: 'Alternativa D',
  },
  correctAnswer: 'B',
  explanation: 'Shpjegimi i mbështetur në burimin përkatës.',
  source: 'https://adresa-e-burimit-zyrtar',
  article: 'Numri i nenit',
  pdfPage: 1,
}
```

Përpara shtimit, kontrollo që ID-ja nuk përsëritet, të katër opsionet janë të dallueshme dhe përgjigjja mbështetet nga burimi. Pas shtimit, pyetja përdoret automatikisht nga ushtrimi dhe simulimet. Mbaje listën të renditur sipas ID-së.

Të 4,000 tekstet dhe faqet e tyre janë importuar te `question-prompts.json`. Mos i shëno si të plotësuara pyetjet që ende nuk kanë përgjigje të kontrolluara.

## Ruajtja e të dhënave

Sesioni aktiv, historiku dhe gabimet ruhen në `localStorage`, pa u dërguar në një server nga aplikacioni. Ruajtja është specifike për shfletuesin dhe adresën e faqes.

- Një pajisje ose shfletues tjetër ka përparim të veçantë.
- Kalimi nga localhost në faqen e publikuar nuk e transferon automatikisht historikun.
- Fshirja e të dhënave të faqes ose përfundimi i një sesioni privat mund t'i fshijë të dhënat.
- Nëse shfletuesi bllokon ruajtjen, aplikacioni shfaq një njoftim.

## Publikimi në Netlify

Projekti mund të publikohet si faqe statike; nuk kërkon variabla mjedisi për funksionet aktuale.

### Përmes GitHub-it

1. Ngarko kodin në një repository në GitHub.
2. Në Netlify, importo repository-n.
3. Përdor komandën e ndërtimit `npm run build` dhe dosjen e publikimit `dist`.
4. Përdor Node.js 24 në mjedisin e ndërtimit.
5. Pas publikimit, hape linkun HTTPS në telefon.

### Publikim manual

Ekzekuto `npm run build`, pastaj ngarko dosjen `dist` në publikimin manual të Netlify. Çdo ndryshim i ardhshëm kërkon ndërtim dhe ngarkim të ri.

`localhost` hapet vetëm në kompjuterin ku punon serveri; linku i publikuar është ai që mund t'i dërgohet një përdoruesi tjetër. Mos ngarko `node_modules` ose `dist` në GitHub; ato janë përjashtuar nga `.gitignore`.

## Hapat e ardhshëm

- Plotësimi dhe kontrolli i opsioneve e përgjigjeve për pyetjet 301-4000.
- Sigurimi i doracakëve dhe procedurave që referohen nga pyetjet, për kontroll të përgjigjeve përkatëse.
- Kohëmatës opsional për provimin.
- Publikimi në Netlify dhe provimi në telefon.
- Backend dhe databazë për sinkronizim ndërmjet pajisjeve, nëse shtohen më vonë.
