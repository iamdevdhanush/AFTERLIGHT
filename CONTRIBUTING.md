# Contributing to AFTERLIGHT

Thank you for your interest in contributing to **AFTERLIGHT**! This project was built for the **2026 NASA Space Apps Challenge** ("Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars") to celebrate humanity's planetary heritage and inspire the next generation of space explorers.

We welcome contributions from software engineers, scientific researchers, educators, 3D artists, and translators.

---

## Code of Conduct

Please treat all contributors with kindness, empathy, and respect. We are dedicated to providing a welcoming, harassment-free environment for everyone regardless of background or experience.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (Node 20 LTS recommended)
- **npm**: v9.0.0 or higher
- **Git**

### 2. Fork and Clone
```bash
git clone https://github.com/adithyasshetty/AFTERLIGHT.git
cd AFTERLIGHT
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Development Standards & Quality Gates

Before opening a pull request, your code must pass all four quality checks:

### 1. Strict TypeScript Check
Ensure no type errors exist:
```bash
npx tsc --noEmit
```

### 2. Scientific Data Integrity Validation
AFTERLIGHT enforces automated checks over all planetary coordinates, citations, and mission manifests:
```bash
npm run validate
```
*Note: Any PR adding sites or hardware without verified NASA/USGS/LROC URLs or with invalid coordinate bounds will fail CI.*

### 3. Unit and Regression Tests
Run the Vitest test suite:
```bash
npm test
```
To run tests in watch mode:
```bash
npx vitest
```

### 4. Production Build Test
Verify that the production bundle compiles cleanly:
```bash
npm run build
```

---

## Adding or Correcting Artifact Data

When adding new hardware, landing sites, or correcting specifications:
1. Open the relevant file in `src/data/` (e.g., `planetarySites.ts` or `hardwareManifests.ts`).
2. Provide all required scientific attributes:
   - `id`: Unique kebab-case identifier
   - `name`: Official NASA mission name
   - `coordinates`: `{ lat, lon }` (strictly bounded)
   - `confidence`: `'High' | 'Moderate' | 'Estimated'`
   - `source`: Valid NASA PDS, USGS, or LROC URL
   - `specs`: Verified engineering metrics (mass, operational dates, status)
3. Run `npm run validate` to ensure schema adherence.

---

## Translations (i18n)

Translations reside in `src/i18n/index.ts`.
Currently supported languages:
- English (`en`)
- Hindi (`hi`)
- Spanish (`es`)
- French (`fr`)
- Arabic (`ar`) — supports right-to-left layout
- Mandarin (`zh`)
- Portuguese (`pt`)

When adding new strings, ensure all language dictionaries are updated to preserve a complete multilingual experience.

---

## Submitting Pull Requests

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat(archaeology): add Surveyor 3 camera retrieval annotations"
   ```
3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a Pull Request against the `master` branch. Ensure the automated GitHub Actions CI workflow turns green.

Thank you for helping preserve humanity's off-world history!
