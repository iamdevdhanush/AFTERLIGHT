# AFTERLIGHT — Interactive Space Artifact Museum

> *Every machine leaves a story.*

**AFTERLIGHT** is a digital space museum and documentary experience dedicated to humanity's abandoned lunar and martian heritage. Built with **React 18**, **TypeScript**, **Three.js** (`@react-three/fiber` & `@react-three/drei`), **GSAP**, **Framer Motion**, and a procedural **Web Audio API** sound engine, it pairs photorealistic 3D planetary environments with cinematic editorial storytelling and real NASA archival telemetry.

---

## 🌟 Key Features

### 1. Cinematic Scroll-Driven Storytelling
- **6 Continuous Scenes:** Visitors scroll through an interactive space documentary that transitions from an orbital view of the Moon into archival hardware deep-dives.
  - **Scene 01 — Prologue:** Establishing lunar shot with the Apollo 11 Lunar Module and Earth rising above the horizon.
  - **Scene 02 — The Leap:** Historical context, mission timeline, and human exploration statistics.
  - **Scene 03 — Monuments Left Behind:** Feature cards for humanity's permanent surface markers (Eagle, LRV, Opportunity, InSight).
  - **Scene 04 — The Moon (Silent Seas):** Mare Tranquillitatis geology, Apollo 11 telemetry, and curated lunar hardware.
  - **Scene 05 — Mars (The Red Expedition):** Meridian Planum iron oxide atmosphere, Opportunity's 45 km marathon journey, and dust storms.
  - **Scene 06 — Enter the Archive:** Interactive dual-destination launch portals into the Moon and Mars exhibitions.
- **Scroll Performance:** Progress bar updates directly via DOM references with `requestAnimationFrame` coalescing, preventing React re-render spikes during high-frequency scrolling.

### 2. Dr. Mae Vance — 2D Illustrated Museum Curator
- **Illustrated Character & Speech Bubble:** Dr. Mae Vance, Senior Curator of Planetary Heritage, guides visitors with 7 expressive poses (`explaining`, `thinking`, `excited`, `pointing_up`, `pointing_sideways`, `concluding`, `idle`).
- **Synchronized Voice Narration:** Built on the Web Speech API with strict female voice filtering (preferring natural documentary-style voices like Microsoft Jenny, Sonia, Aria, or Google Natural Female).
- **Real-Time Mouth Visemes:** Speech audio modulates the curator's mouth movement in real time with synchronized subtitle captions.
- **Automatic Audio Ducking:** Ambient space soundscapes gently lower in volume during active narration so voice lines remain crystal clear.

### 3. Custom Spaceship Cursor
- **Hardware-Accelerated Pointer:** A custom spacecraft pointer tracks desktop mouse movements smoothly via direct GPU transform translates.
- **Calibrated Tip Hotspot:** Click coordinates are calibrated mathematically to the nose tip ($98.86\% X, 1.11\% Y$) for pixel-perfect button and 3D interactions.
- **Text Field Switching:** Automatically hides over text inputs, textareas, and editable fields to preserve the native I-beam cursor.
- **Touch Suppression:** Completely hidden on touchscreens (`pointer: coarse`) to prevent interfering with mobile touches.

### 4. Procedural Web Audio Soundscape
- **Zero External Audio Files:** All sound effects, engine rumbles, ambient space hums, and UI clicks are generated in real-time through procedural Web Audio API oscillators and filters:
  - `lunar_vacuum`: Dual 60 Hz & 120.5 Hz filtered suit-circulation drone.
  - `martian_wind`: Brownian noise shaped by LFO-modulated bandpass filters with a 55 Hz atmospheric resonance.
  - `telemetry_cues`: Pristine harmonic bell chimes and telemetry blips on button clicks, chapter shifts, and modal toggles.
- **Independent Mute Controls:** Independent toggles for master audio and sound effects with persistent `localStorage` memory.

### 5. 3D Planetary Environments & NASA Hardware
- **The Moon:** NASA LROC color mosaic and LOLA elevation datasets, dynamic low-angle morning solar shadows (~14° elevation), faceted basalt breccia boulders, and official Apollo 11 Lunar Module (Eagle) with PBR gold Kapton thermal insulation foil.
- **Mars:** Multi-octave simplex-noise terrain, basalt-to-sulfate slope coloring, drifting atmospheric dust particles, Endeavour Crater rim backdrop, and the Opportunity Rover (MER-B).
- **Instanced Rendering:** Scattered surface boulders render in a single draw call via `THREE.InstancedMesh`.

### 6. Planetary Archaeology & Hardware Inspection Studio
- **NASA Trek Surface Layers:** Real elevation models, MOLA topography, and rover traverse route tracking.
- **Studio 3D Inspector:** Interactive turntable orbit camera, component exploded views, part breakdowns, and historical engineering specifications.
- **Educational Hub:** Space archaeology glossary, craft size comparisons, and interactive knowledge quizzes.

---

## 🧭 Navigation & Experience Flow

User progression is managed by a deterministic Zustand state machine ([src/store/useExperienceStore.ts](src/store/useExperienceStore.ts)) with bi-directional browser history synchronization ([src/navigation/navigationController.ts](src/navigation/navigationController.ts)):

```
ARRIVAL (Scroll Story)
   │
   ├──▶ DESTINATION_SELECT ──▶ ENVIRONMENT_LOADING ──▶ EXHIBITION (Moon or Mars)
   │                                                         │
   │                                                         ├──▶ ARTIFACT_DETAILS
   │                                                         │       │
   │                                                         │       ├──▶ STORY_CHAPTER
   │                                                         │       └──▶ LEGACY
   │                                                         │
   │                                                         └──▶ PLANETARY_ARCHAEOLOGY
   └──▶ FREE_EXPLORATION ──▶ ARTIFACT_INSPECTION
```

### URL Deep-Linking & History Support
The application synchronizes state cleanly with the browser URL:
- Landing: `/`
- Destination Selection: `/?state=destinations`
- Moon Exhibition: `/?dest=moon`
- Mars Exhibition: `/?dest=mars`
- Artifact Details: `/?dest=moon&artifact=apollo11_eagle`
- Documentary Story: `/?dest=moon&artifact=apollo11_eagle&view=story&chapter=0`
- Surface Map: `/?dest=moon&view=map`
- Planetary Archaeology: `/?module=planetary3d&dest=mars`

Browser **Back** and **Forward** buttons smoothly transition between states with appropriate audio cues.

---

## 🎨 Design System — "Signal & Stone"

AFTERLIGHT follows a strict architectural and editorial aesthetic combining technical aerospace instrumentation with modern digital museum typography.

| Token | Hex Code | Visual Purpose |
| :--- | :--- | :--- |
| **Obsidian (Void)** | `#080B10` | Deep cosmic black background |
| **Surface** | `#0E131B` | Raised cards, panels, and modal containers |
| **Bone (Starlight)** | `#F5F3EF` | Primary editorial headings and high-contrast text |
| **Stone Muted** | `#7A8494` | Secondary metadata, labels, and timestamps |
| **Meteorite** | `#1C2432` | Structural hairline dividers, borders, and grid guides |
| **Signal Orange** | `#F05A38` | Primary active accent, telemetry markers, and Mars theme |
| **Lunar Gold** | `#DEB275` | Apollo Kapton gold foil highlights and Moon theme |

### Typography
- **Headings & Editorial Titles:** `Instrument Serif` (italic and regular)
- **Body & Story Narrative:** `Inter` (geometric sans-serif)
- **Telemetry, Coordinates & Specs:** `JetBrains Mono` (monospace)

---

## ⚡ Performance Architecture

AFTERLIGHT is optimized for smooth, stutter-free performance across mobile, tablet, and desktop viewports:

| Viewport Target | Average Framerate | Frame Drops (>24ms) | Initial Page Load |
| :--- | :---: | :---: | :---: |
| **1920×1080 (Desktop Full HD)** | **48.3 FPS** | Low (30 / 121 frames) | **395 ms** |
| **1366×768 (Standard Laptop)** | **60.3 FPS** | **0 / 151 (0.0%)** | **158 ms** |
| **1024×768 (Tablet Landscape)** | **60.1 FPS** | **0 / 151 (0.0%)** | **71 ms** |
| **390×844 (Mobile Phone)** | **60.2 FPS** | **0 / 151 (0.0%)** | **69 ms** |

### Key Optimization Techniques:
1. **Demand-Driven Canvas Rendering:** When visitors scroll past the landing hero into opaque documentary chapters, Three.js switches to `frameloop="demand"`, idling the GPU and reserving 100% of compute power for smooth scrolling.
2. **Device Pixel Ratio (DPR) Cap:** DPR is capped to `Math.min(1.5, window.devicePixelRatio)` on high-density screens, preventing fill-rate bottlenecks.
3. **Instanced Meshes:** 80 Martian rocks are consolidated into a single `THREE.InstancedMesh`, reducing 160 draw calls down to 1.
4. **Cached Image Processing:** 524,288-pixel high-pass relief calculations for planet bump maps are cached in memory and execute only once per planet.
5. **Rollup Vendor Chunking:** Code is split into `vendor-three`, `vendor-motion`, `vendor-core`, and `vendor-icons` chunks to enable parallel browser parsing.

---

## 📁 Repository Structure

```text
d:\NASA\
├── index.html                           # Root HTML with Google Fonts preloads
├── package.json                         # Dependencies & scripts
├── tailwind.config.js                   # Signal & Stone design tokens
├── tsconfig.json                        # Strict TypeScript compiler options
├── vite.config.ts                       # Vite build config with Rollup chunk splitting
├── public/
│   ├── characters/mae-vance/            # 7 illustrated poses for Dr. Mae Vance (PNG)
│   ├── cursors/                         # Custom spaceship cursor assets
│   ├── draco/                           # Draco 3D geometry decoder (WASM)
│   ├── images/                          # NASA mission photography & archival photos
│   ├── models/                          # Official NASA 3D GLB assets (Apollo LM, Opportunity)
│   └── textures/                        # 2K planetary surface maps (Moon LROC/LOLA, Earth, Mars)
├── scripts/
│   ├── audit-glb-meshes.mjs             # Node.js binary parser for inspecting GLB sub-meshes
│   └── capture_screenshots.cjs          # Headless browser validation script
└── src/
    ├── App.tsx                          # Root experience state router
    ├── main.tsx                         # Entry React mount point
    ├── index.css                        # Tailwind directives & global cursor styles
    ├── audio/
    │   ├── GuideVoiceEngine.ts          # Web Speech API curator engine & viseme generator
    │   └── SoundManager.ts              # Procedural Web Audio API synthesizer
    ├── components/
    │   ├── canvas/
    │   │   ├── Artifact3DStage.tsx      # Studio lighting turntable for individual hardware
    │   │   ├── CameraDirector.tsx       # GSAP orbital camera choreography
    │   │   ├── PlanetSphere.tsx         # 3D orbital globe selector for Moon & Mars
    │   │   ├── SceneCanvas.tsx          # R3F Canvas container with demand-rendering logic
    │   │   ├── artifacts/               # 3D models (Apollo Eagle, Opportunity Rover, Voyager)
    │   │   └── environments/            # MoonEnvironment, MarsEnvironment, EarthGlobe
    │   └── ui/
    │       ├── AskArchiveModal.tsx      # Curated mission Q&A guide
    │       ├── CuratorPresenter2D.tsx   # Dr. Mae Vance character presenter & speech bubble
    │       ├── PlanetarySurfaceMap.tsx  # 2D surface site locator
    │       ├── ScreenArrival.tsx        # 6-scene cinematic scroll documentary
    │       ├── ScreenArtifactDetails.tsx# Curated artifact telemetry & gallery
    │       ├── ScreenDestinationSelect.tsx # Moon & Mars destination selector
    │       ├── ScreenDocumentary.tsx    # Chaptered documentary viewer with audio
    │       ├── ScreenExhibition.tsx     # Artifact gallery grid & category filters
    │       ├── ScreenExplorationUI.tsx  # Free exploration HUD
    │       ├── ScreenLegacy.tsx         # Historical conclusion & in-situ status
    │       ├── ScreenLoading.tsx        # Smooth transit crossfade
    │       └── SpaceshipCursor.tsx      # Hardware-accelerated desktop spaceship pointer
    ├── data/
    │   ├── artifacts.ts                 # Full NASA specs, history, components, and chapters
    │   ├── destinations.ts              # Planetary metadata & camera configurations
    │   └── modelsManifest.ts            # 3D model paths & bounding box metadata
    ├── modules/planetary-archaeology/   # Dedicated 3D NASA Trek surface map & hardware studio
    ├── navigation/
    │   └── navigationController.ts      # Browser popstate listener & query param serializer
    ├── store/
    │   └── useExperienceStore.ts        # Zustand reactive state store
    ├── theme/
    │   └── tokens.ts                    # Signal & Stone color palettes & theme helpers
    ├── types/
    │   └── index.ts                     # Core TypeScript interfaces & enums
    └── utils/
        └── curatorNarrative.ts          # Script parser splitting text into spoken phrases
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v18.0 or higher recommended; tested on v22)
- **npm** (v9.0 or higher)

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/afterlight.git
cd afterlight
npm install
```

### Local Development
Start the Vite development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Preview
Compile TypeScript and generate optimized production bundles:
```bash
npm run build
npm run preview
```
The production bundle will be built into the `dist/` directory.

### Running Audits and Benchmark Scripts
- **Inspect 3D GLB Meshes:**
  ```bash
  node scripts/audit-glb-meshes.mjs
  ```
- **Run Headless Browser Performance Benchmark (CDP):**
  ```bash
  node scratch/benchmark_performance.cjs
  ```

---

## 📚 Data Citations & Acknowledgments

- **NASA 3D Resources:** Official 3D models for the Apollo 11 Lunar Module (Eagle) and Mars Opportunity Rover.
- **NASA Scientific Visualization Studio (SVS):** Lunar Reconnaissance Orbiter Camera (LROC) global mosaic and Lunar Orbiter Laser Altimeter (LOLA) elevation maps.
- **NASA JPL Trek Services:** Mars Orbiter Laser Altimeter (MOLA) and Mars Global Surveyor surface topography.
- **NASA Apollo Lunar Surface Journal (ALSJ):** Surface photographic archives and historical transcripts.

---

## 📄 License

This project is created for educational, historical, and archival purposes under the **MIT License**. NASA imagery, 3D models, and telemetry datasets are in the public domain and credited to NASA/JPL-Caltech.
