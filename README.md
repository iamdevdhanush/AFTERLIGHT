# AFTERLIGHT — Interactive Space Artifact Museum

> *Every machine leaves a story.*

**AFTERLIGHT** is an interactive 3D digital museum and space documentary experience exploring human-made spacecraft, rovers, and landers left across the Moon, Mars, and interstellar Deep Space. Built with React, TypeScript, Three.js (`@react-three/fiber` & `@react-three/drei`), GSAP, Framer Motion, Zustand, and a procedural Web Audio synthesizer, it pairs real-time 3D planetary environments with restrained editorial storytelling and NASA archival metadata.

---

## Experience Flow & State Machine

User progression is governed by a deterministic Zustand state machine ([useExperienceStore.ts](src/store/useExperienceStore.ts)) with types defined in [src/types/index.ts](src/types/index.ts):

```
ARRIVAL ➔ DESTINATION_SELECT ➔ ENVIRONMENT_LOADING ➔ GUIDED_INTRO ➔ FREE_EXPLORATION
   ➔ ARTIFACT_APPROACH ➔ ARTIFACT_INSPECTION ➔ STORY_CHAPTER ➔ LEGACY ➔ RETURN_TO_EXPLORATION
```

1. **Screen 01 — Cinematic Arrival ([ScreenArrival.tsx](src/components/ui/ScreenArrival.tsx)):** Full-viewport lunar establishing shot featuring the Apollo 11 Lunar Module on the regolith with Earth suspended above the horizon, camera drift, editorial headline, and a direct `BEGIN EXPLORATION` entry action.
2. **Screen 02 — Destination Selection ([ScreenDestinationSelect.tsx](src/components/ui/ScreenDestinationSelect.tsx)):** Asymmetric editorial selector covering **The Moon**, **Mars**, and **Deep Space**, displaying epoch, surface atmosphere, temperature, and acoustic profile metadata.
3. **Screen 03 — Planetary Exploration ([ScreenExplorationUI.tsx](src/components/ui/ScreenExplorationUI.tsx)):** Full-viewport Three.js scene with minimal HUD controls (`SECTOR SELECTOR`, `ASK THE ARCHIVE`, audio mute toggle, graphics fidelity selector `low` / `medium` / `high`, artifact hover card, navigation controls, and discovery progress meter).
4. **Screen 04 — Artifact Inspection ([ScreenArtifactInspection.tsx](src/components/ui/ScreenArtifactInspection.tsx)):** GSAP-choreographed camera transition into an asymmetric, camera-safe three-quarter framing—keeping the 3D hardware unobstructed on the right while presenting mission hook, metadata, and `EXPLORE ITS STORY` on the left.
5. **Screen 05 — Cinematic Documentary ([ScreenDocumentary.tsx](src/components/ui/ScreenDocumentary.tsx)):** Full-screen chaptered narrative (`01 THE BEGINNING` through `05 THE LEGACY`) with historical context callouts, key metrics, auto-play mode, keyboard navigation (`ArrowRight` / `Space`, `ArrowLeft`, `Escape`), archival captions, and per-chapter tonal chimes.
6. **Screen 06 — Legacy ([ScreenLegacy.tsx](src/components/ui/ScreenLegacy.tsx)):** Documentary conclusion presenting what remains in situ, coordinates, status, primary NASA archive link, and `RETURN TO EXPLORATION` (smoothly restoring the saved exploration camera).
7. **Ask the Archive ([AskArchiveModal.tsx](src/components/ui/AskArchiveModal.tsx)):** Optional offline-capable mission guide offering curated NASA/JPL-cited Q&A and local keyword inquiry matching without external API dependencies.

---

## Destinations & Featured Artifacts

Defined in [src/data/destinations.ts](src/data/destinations.ts) and [src/data/artifacts.ts](src/data/artifacts.ts):

| Destination | Environment Implementation | Artifacts in Scene / Archive | Coordinates / Context |
| :--- | :--- | :--- | :--- |
| **The Moon** *(default)* | [MoonEnvironment.tsx](src/components/canvas/environments/MoonEnvironment.tsx): Zero-fog vacuum sky, unfiltered solar directional light + cool Earthshine fill, procedural 512×512 regolith normal map, sculpted craters (West Crater, Little West Crater), angular faceted breccia boulders, Earth above the horizon | **Apollo 11 Eagle (`apollo11_eagle`)** via official NASA `.glb` model ([ApolloEagleModel.tsx](src/components/canvas/artifacts/ApolloEagleModel.tsx)), accompanied by EASEP package, US flag, and bootprint trail | Mare Tranquillitatis (`0.67408° N, 23.47297° E`) |
| **Mars** | [MarsEnvironment.tsx](src/components/canvas/environments/MarsEnvironment.tsx): Simplex-noise fBm terrain with basalt/ochre/sulfate vertex coloring, Endeavour Crater rim rise, scattered boulders, drifting dust particles, atmospheric fog | **Opportunity (`opportunity`)** & **Spirit (`spirit`)** via procedural 6-wheel rocker-bogie rover mesh ([OpportunityModel.tsx](src/components/canvas/artifacts/OpportunityModel.tsx)) | Opportunity: Perseverance Valley (`2.34° S, 354.67° E`); Spirit: Gusev Crater (`14.57° S, 175.47° E`) |
| **Deep Space** | [DeepSpaceEnvironment.tsx](src/components/canvas/environments/DeepSpaceEnvironment.tsx): 4,000 multi-spectral stars, distant pinpoint Sun, dashed hyperbolic escape trajectory spline | **Voyager 1 (`voyager1`)** via procedural spacecraft mesh with 3.7m dish, RTG boom, magnetometer boom, scan platform, and Golden Record ([VoyagerModel.tsx](src/components/canvas/artifacts/VoyagerModel.tsx)) | Interstellar Space / Ophiuchus (`+12° 08′, 17h 15m`, `163.2 AU`) |

---

## Controls & Interaction

During `FREE_EXPLORATION` (managed by [CameraDirector.tsx](src/components/canvas/CameraDirector.tsx)):

- **Rotate Camera:** Left-click and drag (or touch drag)
- **Zoom:** Mouse wheel scroll
- **Pan:** `W` / `A` / `S` / `D` or `Arrow` keys
- **Inspect Artifact:** Hover over a spacecraft to reveal its contextual beacon and card, then click the artifact or card

During `STORY_CHAPTER` ([ScreenDocumentary.tsx](src/components/ui/ScreenDocumentary.tsx)):
- **Next Chapter / Proceed to Legacy:** `ArrowRight` or `Space`
- **Previous Chapter:** `ArrowLeft`
- **Exit Documentary:** `Escape`

### URL Deep-Linking (for Testing & Direct Entry)
[useExperienceStore.ts](src/store/useExperienceStore.ts) reads optional query parameters on load:
- `?state=<ExperienceState>` (e.g., `ARRIVAL`, `DESTINATION_SELECT`, `FREE_EXPLORATION`, `ARTIFACT_INSPECTION`, `STORY_CHAPTER`, `LEGACY`)
- `&dest=<moon|mars|deep_space>`
- `&artifact=<apollo11_eagle|opportunity|spirit|voyager1>`

---

## Project Structure

```text
.
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── images/
│   │   └── apollo11_surface.jpg          # NASA archival photo (as11-40-5927)
│   ├── models/
│   │   └── apollo_lunar_module.glb       # Official NASA-3D-Resources Apollo LM
│   └── textures/moon/
│       ├── ldem_3_8bit.jpg               # NASA SVS CGI Moon Kit elevation map (stored asset)
│       └── lroc_color_2k.jpg             # NASA SVS CGI Moon Kit LROC color map (stored asset)
├── scripts/
│   └── capture_screenshots.cjs           # Headless Edge CDP screenshot validation script
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── audio/
    │   └── SoundManager.ts               # Web Audio API planetary & UI sound synthesizer
    ├── components/
    │   ├── canvas/
    │   │   ├── CameraDirector.tsx        # GSAP & free-orbit camera ownership controller
    │   │   ├── SceneCanvas.tsx           # R3F Canvas container & environment switcher
    │   │   ├── artifacts/
    │   │   │   ├── ApolloEagleModel.tsx
    │   │   │   ├── OpportunityModel.tsx
    │   │   │   └── VoyagerModel.tsx
    │   │   └── environments/
    │   │       ├── DeepSpaceEnvironment.tsx
    │   │       ├── MarsEnvironment.tsx
    │   │       └── MoonEnvironment.tsx
    │   └── ui/
    │       ├── AskArchiveModal.tsx
    │       ├── ScreenArrival.tsx
    │       ├── ScreenArtifactInspection.tsx
    │       ├── ScreenDestinationSelect.tsx
    │       ├── ScreenDocumentary.tsx
    │       ├── ScreenExplorationUI.tsx
    │       ├── ScreenLegacy.tsx
    │       └── ScreenLoading.tsx
    ├── data/
    │   ├── artifacts.ts                  # Mission specs, coordinates, story chapters, legacy, Q&A
    │   └── destinations.ts               # Planetary metadata & initial camera targets
    ├── store/
    │   └── useExperienceStore.ts         # Zustand state machine
    └── types/
        └── index.ts                      # TypeScript interfaces
```

---

## Visual Direction & Audio

### Palette & Typography ([tailwind.config.js](tailwind.config.js), [index.html](index.html))
- **Void Black:** `#080B10` (`void` / `space-900`)
- **Space Grey:** `#171E28` (`space-700`)
- **Starlight:** `#E8E3D9` (`starlight`)
- **Dust Grey:** `#A5A7A9` (`dust`)
- **Mission Gold:** `#D99A63` (`gold`)
- **Optional Emerald:** `#63F0C8` (`emerald-accent`)
- **Fonts:** `Instrument Serif` (editorial headlines), `Inter` (narrative & UI), `JetBrains Mono` (coordinates & mission metadata)

### Procedural Audio ([SoundManager.ts](src/audio/SoundManager.ts))
Zero external audio files are required. Web Audio API nodes synthesize:
- `lunar_vacuum`: 60 Hz & 120.5 Hz filtered suit-circulation hum
- `martian_wind`: Brownian noise through an LFO-modulated bandpass filter + 55 Hz drone
- `deep_telemetry`: 43.65 Hz low-pass cosmic drone
- Interaction cues: transition swooshes, harmonic artifact chimes, and click feedback

---

## Tech Stack

- **UI & State:** React `18.3`, TypeScript `5.6`, Zustand `5.0`, Framer Motion `11.11`, Lucide React, Tailwind CSS `3.4`
- **3D & Motion:** Three.js `0.169`, `@react-three/fiber` `8.17`, `@react-three/drei` `9.117`, GSAP `3.12`, `simplex-noise` `4.0`
- **Build Tooling:** Vite `5.4`

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended; tested on v22) and `npm`

### Development
```bash
npm install
npm run dev
```
The Vite dev server is configured in [vite.config.ts](vite.config.ts) to run on port `3000` (`http://localhost:3000`).

### Type-Check & Production Build
```bash
npm run build
npm run preview
```

### Visual Screenshot Capture (Windows / Edge)
After running `npm run build`, [scripts/capture_screenshots.cjs](scripts/capture_screenshots.cjs) launches `vite preview` on `127.0.0.1:5050` and uses headless Microsoft Edge (`--remote-debugging-port=9222`, `--enable-webgl`) to capture 1920×1080 PNG screenshots of the Arrival, Artifact Inspection, Legacy, and Free Exploration states:
```bash
node scripts/capture_screenshots.cjs
```
