# ORBITAL — Interactive Space Archaeology Museum & Digital Archive

> *"THE MACHINES REMAIN. THE STORIES LIVE ON."*

**ORBITAL** is an immersive digital space museum and interactive space archaeology experience dedicated to preserving the history of humanity's lunar and martian heritage. Humanity explored these worlds. Its machines remain. Their stories deserve to be discovered. Built with **React 18**, **TypeScript**, **Three.js** (`@react-three/fiber` & `@react-three/drei`), **GSAP**, **Framer Motion**, and a procedural **Web Audio API** sound engine, it combines photorealistic 3D planetary environments with cinematic editorial storytelling and real NASA archival telemetry.

---

## 🧭 Product Architecture & Experience Restructuring (Revision 2.1)

ORBITAL operates as a **hybrid digital museum**: an unhurried, guided narrative prologue followed by unconstrained archival exploration.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           THE GUIDED INTRODUCTION                                │
│                                                                                  │
│   [01. ARRIVAL]  ───>  [02. THE STORY]  ───>  [03. ARTIFACT REVEALS]  ───>      │
│   (Earth + Eagle)      (Sacrificial Physics)   (Apollo 11 & Opportunity)         │
│                                                                                  │
│   ───>  [04. DESTINATION SELECTION] (Definitive End of Guided Introduction)      │
│                                │                                                 │
└────────────────────────────────┼─────────────────────────────────────────────────┘
                                 │ Choose Moon or Mars
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            THE FREE MUSEUM                                       │
│                                                                                  │
│   [05. PLANETARY EXHIBITION] (Moon Catalog  OR  Mars Catalog)                    │
│   • Featured Landmark Centerpiece                                                │
│   • Balanced 2-Column Archival Grid (Standardized 16:10 Plates)                  │
│   • Museum Archival Filter & Search Toolbar                                      │
│                                                                                  │
│   OPTIONAL MUSEUM EXTENSIONS (Preserved):                                        │
│   ├── [Artifact Details Stage] (Component Hotspots, Specs, Dr. Mae Vance Audio)  │
│   ├── [Planetary Surface Map] (Real NASA LOLA / MOLA Topography)                 │
│   ├── [Legacy Chapter] (Optional Curatorial Retrospective per Artifact)          │
│   └── [Surface Roam Mode] (Optional 3D First-Person In-Situ Roam)                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Core Architectural Principles
1. **Definitive Introduction Boundary:** Destination selection marks the unambiguous end of the guided introduction. Choosing Moon or Mars transitions directly to that world's museum catalog. Visitors are **never** forced to scroll through a compulsory Legacy section after picking a destination.
2. **Single Skip Action:** The guided introduction header features exactly **one primary button** (`[ SKIP TO MUSEUM → ]`) that routes directly to destination selection (Chapter 4). No competing or redundant header pills.
3. **Strict Destination Scope:** **The Moon and Mars only.** Deep Space remains excluded from active destination choices and exhibition routing.
4. **Factual Rigor & NASA Primary Sources:** Speculative aggregate numbers (e.g., "200+ Metric Tons") have been eliminated and replaced with verified primary-source metrics (Tranquility Base duration, NASA PDS site coordinates, and Opportunity's traverse record).
5. **Preserved Core Identity:** 100% of authentic NASA 3D models, Dr. Mae Vance curatorial narration, procedural Web Audio, and planetary surface maps are preserved.
6. **Route-Based Code Splitting & Performance:** Initial entry JavaScript chunk reduced by 56% (535 kB → 236 kB) via `React.lazy()` route splitting across secondary screens and heavy 3D modules. WebGL Canvas lifecycle preservation eliminates the 2-second return-to-story freeze.

---

## 🏛️ World-Class Product Transformation Blueprint

AFTERLIGHT's product redesign and technical architecture are documented in full detail:
- [AFTERLIGHT_PRODUCT_TRANSFORMATION_BLUEPRINT.md](file:///d:/NASA/AFTERLIGHT_PRODUCT_TRANSFORMATION_BLUEPRINT.md): Comprehensive product redesign blueprint, visitor journey, information architecture, visual direction, and technical implications.
- [AFTERLIGHT_GLOBAL_ENGINEERING_AUDIT.md](file:///d:/NASA/AFTERLIGHT_GLOBAL_ENGINEERING_AUDIT.md): Five-dimensional engineering, performance, curatorial, and accessibility audit.
- [AFTERLIGHT_PRODUCT_RESTRUCTURE_PLAN.md](file:///d:/NASA/AFTERLIGHT_PRODUCT_RESTRUCTURE_PLAN.md): Architectural specification for guided vs. free museum navigation.

---

## 🗂️ Complete File-by-File Codebase Analysis

Below is an exhaustive architectural breakdown of every file across the ORBITAL repository.

### 1. Root Configuration & Harness Files

| File Path | Description, Role & Architectural Purpose |
| :--- | :--- |
| `index.html` | Entry HTML document. Configures responsive meta tags, dark mode background (`#080B10`), Google Fonts preloads (`Instrument Serif`, `Inter`, `JetBrains Mono`), and mounts the React root DOM container. |
| `package.json` | Project manifest defining core runtime dependencies (`three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`, `gsap`, `zustand`, `lucide-react`, `simplex-noise`) and build toolchain (`vite`, `tailwindcss`, `typescript`). |
| `vite.config.ts` | Vite bundler configuration. Configures React plugin, local dev server port (`3000`), and Rollup `manualChunks` splitting (`vendor-three`, `vendor-motion`, `vendor-core`, `vendor-icons`). |
| `tailwind.config.js` | Tailwind CSS configuration defining the "Signal & Stone" design tokens (`obsidian`, `surface`, `meteorite`, `bone`, `signal`, `lunar-gold`) and custom font families. |
| `tsconfig.json` | TypeScript configuration enforcing strict type checking (`strict: true`, `noImplicitAny: true`), ES2022 target, JSX transform, and module resolution. |
| `tsconfig.node.json` | TypeScript compiler configuration dedicated to Vite config and Node build tooling. |
| `postcss.config.js` | PostCSS pipeline integrating `tailwindcss` and `autoprefixer` for cross-browser CSS compilation. |
| `AFTERLIGHT_PRODUCT_RESTRUCTURE_PLAN.md` | Revision 2.1 architecture and interaction blueprint defining user journeys, URL resolution rules, factual taxonomy, and milestone boundaries. |
| `AFTERLIGHT_PERFORMANCE_AUDIT.md` | Comprehensive Phase 1 performance audit detailing baseline CDP measurements, confirmed bottlenecks, memory lifecycle analysis, and optimization roadmap. |

---

### 2. Application Core Entry (`src/`)

| File Path | Description, Role & Architectural Purpose |
| :--- | :--- |
| `src/main.tsx` | Client bootstrapping script. Initializes React 18 Concurrent Root (`createRoot`) and renders the top-level `<App />` component. |
| `src/App.tsx` | Master application view coordinator. Mounts the global Three.js `<SceneCanvas />`, the film grain vignette overlay, the state-driven screen switch (`ScreenArrival`, `ScreenDestinationSelect`, `ScreenExhibition`, etc.), and the hardware-accelerated `<SpaceshipCursor />`. Initializes `navigation.init()` for browser history synchronization. |
| `src/index.css` | Global stylesheet containing Tailwind directives, typography utilities, scrollbar hiding classes, and custom cursor pointer-event rules. |

---

### 3. Audio Architecture (`src/audio/`)

| File Path | Description, Role & Architectural Purpose |
| :--- | :--- |
| `src/audio/GuideVoiceEngine.ts` | Curatorial voice narration engine built on the Web Speech API. Selects natural female documentary voices (e.g., Microsoft Jenny, Aria, Sonia, Google Natural Female), generates real-time mouth viseme signals for character lipsync, parses subtitle captions, and coordinates audio ducking with `SoundManager`. |
| `src/audio/SoundManager.ts` | Procedural Web Audio API sound synthesizer engine. Generates zero-file-size ambient soundscapes (`lunar_vacuum` 60Hz/120Hz drone, `martian_wind` Brownian noise with resonant bandpass), telemetry chimes, interface clicks, and modal audio transitions. Supports independent master and SFX mute states with `localStorage` persistence. |

---

### 4. 3D Canvas & Three.js Rendering Pipeline (`src/components/canvas/`)

| File Path | Description, Role & Architectural Purpose |
| :--- | :--- |
| `src/components/canvas/SceneCanvas.tsx` | Main Three.js `<Canvas>` wrapper. Configures high-performance WebGL renderer, shadow maps, DPR clamping (`Math.min(1.5, dpr)`), and camera setup. Features demand-based render throttling (`frameloop="demand"` when scrolled past hero) to eliminate GPU draw calls during text-heavy beats. |
| `src/components/canvas/CameraDirector.tsx` | GSAP and Three.js camera choreography engine. Drives smooth orbital camera motions, position tweening, lookAt interpolation, and free exploration spherical controls. Snaps without tweening when `reducedMotion` is active. |
| `src/components/canvas/Artifact3DStage.tsx` | Dedicated 3D studio inspection turntable. Renders individual artifact GLTF models with studio three-point lighting, contact shadows, floor reference grid, and OrbitControls. Reused inside `ScreenArtifactDetails`. |
| `src/components/canvas/PlanetSphere.tsx` | Interactive 3D orbital planetary globe. Renders Moon and Mars spheres with high-pass derived relief bump mapping, specular masks, atmospheric rim fresnels, and slow axial rotation. |
| `src/components/canvas/artifacts/ApolloEagleModel.tsx` | 3D Apollo 11 Lunar Module Eagle descent stage. Loads Draco-compressed GLB (`/models/apollo_lunar_module.glb`), isolates descent stage structure, applies gold Kapton foil PBR shaders, and provides interactive click/hover raycasting. Configured with local `/draco/` decoder path. |
| `src/components/canvas/artifacts/OpportunityModel.tsx` | 3D MER-B Opportunity Rover model. Procedural high-gain antenna tracking, instrument arm articulation, hazard-cam placement, and solar array dust accumulation shaders. |
| `src/components/canvas/artifacts/VoyagerModel.tsx` | 3D Voyager interstellar probe model with high-gain dish, RTG boom, and magnetometers. *(Maintained as archival asset).* |
| `src/components/canvas/environments/MoonEnvironment.tsx` | Lunar surface environment: NASA LROC color mosaic and LOLA elevation dataset, dynamic morning sun casting long shadows, procedural fractured basalt breccia boulders via `THREE.InstancedMesh`, and Earth rising above the lunar horizon. |
| `src/components/canvas/environments/MarsEnvironment.tsx` | Martian surface environment: procedural multi-octave simplex-noise terrain, basalt-to-sulfate gradient vertex coloring, drifting atmospheric dust particles, and Endeavour Crater rim backdrop. |
| `src/components/canvas/environments/EarthGlobe.tsx` | Photorealistic Blue Marble Earth globe with 23.4° axial obliquity, separate drifting cloud sphere, and Rayleigh atmospheric blue limb glow. |
| `src/components/canvas/environments/lunarGeology.ts` | Mathematical and geological synthesis library for lunar regolith. Implements seeded PRNG, value noise, fractional Brownian motion (fBm), 2D offscreen canvas pixel extraction for LROC/LOLA fusion, and procedural breccia geometries. |
| `src/components/canvas/environments/DeepSpaceEnvironment.tsx` | Deep cosmic starfield environment with distant celestial lighting. *(Maintained as archival reference).* |

---

### 5. User Interface & Screen Components (`src/components/ui/`)

| File Path | Description, Role & Architectural Purpose |
| :--- | :--- |
| `src/components/ui/ScreenArrival.tsx` | The 4-Beat Guided Introduction container (`scene-prologue`, `scene-story`, `scene-reveals`, `scene-destinations`). Features minimal wordmark header with single `[ SKIP TO MUSEUM → ]` button, verifiable NASA metrics (55+ Years In Situ, 8 Curated Sites, 45.16 km Traverse), landmark artifact reveal cards, and dual atmospheric planetary portals. |
| `src/components/ui/ScreenExhibition.tsx` | The primary Free Museum Catalog Hub. Displays featured artifact hero plate, standardized 16:10 secondary artifact grid, search input, status/category filters, and surface map toggle. Features sticky top header with `[ ← RETURN TO STORY ]` and destination switcher (`[ SWITCH TO MARS → ]` / `[ SWITCH TO MOON → ]`). |
| `src/components/ui/ScreenArtifactDetails.tsx` | Core specimen deep-dive modal overlay. Renders high-res archival photography, component hotspot inspection, technical engineering specs, official primary source documentation links, `[ RETROSPECTIVE → ]` legacy link, and embedded Dr. Mae Vance curatorial narration card. Reused identically from both story reveals and museum grid. |
| `src/components/ui/ScreenDestinationSelect.tsx` | Full-screen 3D orbital globe selector. Allows visitors to inspect the Moon and Mars with atmospheric data readouts, surface temperature telemetry, and arrival distance calculations. |
| `src/components/ui/ScreenDocumentary.tsx` | Full-bleed cinematic photographic slideshow viewer. Plays multi-chapter historical stories (`storyChapters`) with synchronized curatorial captions and audio narration. |
| `src/components/ui/ScreenLegacy.tsx` | Curatorial retrospective conclusion screen. Summarizes in-situ condition, international space treaty protections, and verified NASA NSSDC records. Accessible on-demand via `ScreenArtifactDetails`. |
| `src/components/ui/ScreenLoading.tsx` | Atmospheric interplanetary transit screen with telemetry status readouts and smooth descent crossfades. |
| `src/components/ui/ScreenExplorationUI.tsx` | 3D first-person surface roam HUD for free camera exploration across Tranquility Base and Gale Crater. |
| `src/components/ui/ScreenArtifactInspection.tsx` | Standalone hardware inspection stage. *(Consolidated into `ScreenArtifactDetails` 3D view toggle).* |
| `src/components/ui/AfterlightGuide.tsx` | Unified curator presenter card (`OrbitalGuide`). Integrates Dr. Mae Vance's 2D illustrations, animated speech bubble, voice narration controls (play/pause/restart/mute), volume slider, and telemetry readouts into a connected editorial card. |
| `src/components/ui/CuratorPresenter2D.tsx` | 2D illustrated character presenter supporting 7 expressive Dr. Mae Vance poses (`explaining`, `thinking`, `excited`, etc.) with real-time mouth movement synchronized to speech visemes. |
| `src/components/ui/PlanetarySurfaceMap.tsx` | 2D surface topography map viewer displaying NASA LOLA (Moon) and MOLA (Mars) elevation datasets with interactive artifact coordinate pins. |
| `src/components/ui/SpaceshipCursor.tsx` | Custom spaceship desktop cursor. Tracks mouse movement via GPU `translate3d`, calibrates click hotspot mathematically to the nose tip (98.86% X, 1.11% Y), suppresses on touchscreens (`pointer: coarse`), and auto-hides over text inputs. |

---

### 6. Data Models, State & Navigation (`src/data/`, `src/store/`, `src/navigation/`, `src/theme/`, `src/utils/`)

| File Path | Description, Role & Architectural Purpose |
| :--- | :--- |
| `src/data/artifacts.ts` | Master authoritative database of all 8 curated NASA artifacts (`apollo11_eagle`, `opportunity`, `apollo_lrv`, `surveyor3`, `apollo_alsep`, `sojourner`, `spirit`, `insight`). Contains verified NSSDC IDs, in-situ coordinates, hardware classifications, component specs, and multi-chapter documentary content. |
| `src/data/destinations.ts` | Authoritative planetary destination metadata for the Moon and Mars (orbital radius, gravity, atmospheric composition, initial camera coordinates, ambient sound presets). |
| `src/data/modelsManifest.ts` | 3D model configuration manifest mapping artifact records to their respective GLB files, bounding box normalizations, camera constraints, and NASA source attributions. |
| `src/store/useExperienceStore.ts` | Central Zustand reactive store. Manages state machine (`state`), active destination (`currentDestination`), selected artifact, camera coordinates, audio settings, graphics quality, and `reducedMotion` detection. |
| `src/navigation/navigationController.ts` | Bi-directional browser history and URL query synchronizer. Parses and sanitizes URL search parameters, manages browser Back/Forward popstate listeners with `_orbitalDepth` (and `_afterlightDepth` fallback) tracking, and provides public navigation methods (`toArrival`, `toDestination`, `toArtifact`, etc.). |
| `src/theme/tokens.ts` | Signal & Stone theme tokens and helper functions (`getDestinationTheme`) providing dynamic color palettes, accents, and borders based on destination context. |
| `src/types/index.ts` | Core TypeScript definitions covering `ArtifactData`, `Destination`, `ExperienceState`, `HardwareStatus`, `ArtifactCategory`, and `CharacterPose`. |
| `src/utils/curatorNarrative.ts` | Natural language text parsing utility. Splits narrative prose into spoken phrases, calculates sentence durations, and maps emotional keywords to Dr. Mae Vance character poses. |

---

### 7. Planetary Archaeology Module (`src/modules/planetary-archaeology/`)

Dedicated 3D planetary exploration module featuring NASA Trek elevation datasets, orbital globes, rover traverse tracking, and mission archives.

| Sub-Directory | File Path | Description, Role & Purpose |
| :--- | :--- | :--- |
| **Root** | `index.ts` | Public module export interface exporting components, services, and types. |
| **Components** | `PlanetaryArchaeologyModule.tsx` | Root container coordinating globe canvas, HUD overlay, search bar, and site modals. |
| | `PlanetaryGlobeCanvas.tsx` | Dedicated R3F Canvas rendering the interactive 3D planetary globe. |
| | `PlanetaryGlobe.tsx` | 3D planetary mesh applying NASA LOLA/MOLA texture mosaics and normal maps. |
| | `PlanetaryMarkers.tsx` | 3D billboarding landing site markers with pulsing visual cues. |
| | `RoverTraversePath3D.tsx` | 3D spline rendering MER-B Opportunity's 45.16 km traverse across Martian terrain. |
| | `PlanetaryHUD.tsx` | Aerospace telemetry overlay displaying coordinates, elevation, and sun angle. |
| | `PlanetaryControls.tsx` | Interactive camera zoom, pan, tilt, and projection mode controls. |
| | `PlanetarySearch.tsx` | Real-time search autocomplete for planetary landing sites and craters. |
| | `PlanetarySiteModal.tsx` | Modal dialog displaying deep historical data for selected landing sites. |
| | `HardwareLegend.tsx` | Visual legend categorizing hardware by nation, mission era, and operational status. |
| | `HardwareFilterDrawer.tsx` | Collapsible filter panel for filtering surface sites by classification. |
| | `HardwareInspectionStudio.tsx`| 3D hardware inspection studio within the planetary module. |
| | `ArtifactDiscoveryPanel.tsx` | Sidebar panel detailing newly discovered planetary artifacts. |
| | `EducationalHubModal.tsx` | Interactive space archaeology glossary, quizzes, and craft scale comparisons. |
| | `MissionStorytellingExperience.tsx` | Guided historical tour flying the camera between landmark surface sites. |
| | `RegionalTerrainInspector.tsx` | High-resolution elevation inspector for localized surface craters. |
| **Data** | `data/planetarySites.ts` | Curated dataset of 40+ lunar and martian landing sites with verified coordinates. |
| | `data/roverTraverses.ts` | Waypoint telemetry for Opportunity, Spirit, Curiosity, and Apollo traverses. |
| | `data/missionStories.ts` | Curated historical narrative scripts for guided orbital flyover tours. |
| | `data/educationalData.ts` | Space archaeology glossary terms, educational quizzes, and scale ratios. |
| **Services** | `services/nasaTrekService.ts` | Integration client for NASA Trek WMTS tile services and LOLA/MOLA elevation endpoints. |
| | `services/planetaryMath.ts` | Spherical-to-Cartesian trigonometry, great-circle distances, and coordinate transforms. |
| **Types** | `types/planetary.ts` | TypeScript interfaces for planetary sites, terrain layers, and orbital cameras. |
| | `types/storytelling.ts` | TypeScript types for guided flyover chapters and educational quizzes. |

---

### 8. Scripts & Verification Tooling (`scripts/`)

| File Path | Description, Role & Architectural Purpose |
| :--- | :--- |
| `scripts/audit-glb-meshes.mjs` | Node.js binary parser for GLTF/GLB files. Reads binary headers, extracts JSON chunks, and audits sub-mesh names, primitive counts, and node hierarchies without Three.js. |
| `scripts/capture_screenshots.cjs` | Automated Microsoft Edge Chrome DevTools Protocol (CDP) script for capturing multi-viewport screenshots and validating layout integrity. |

---

### 9. Static Assets Inventory (`public/`)

| Directory | Key Files | Usage & Optimization Profile |
| :--- | :--- | :--- |
| `public/models/` | `apollo_lunar_module.glb` (717 KB), `opportunity_rover.glb` (36.6 KB), `insight_lander.glb` (3.94 MB), `perseverance_rover.glb` (4.98 MB), `voyager_probe.glb` (1.72 MB). | Official NASA 3D assets. Apollo LM and Opportunity are essential, highly optimized centerpieces. |
| `public/characters/mae-vance/` | 7 poses (`concluding.png`, `excited.png`, `explaining.png`, `idle.png`, `pointing_sideways.png`, `pointing_up.png`, `thinking.png`). Total: 6.39 MB. | Expressive transparent PNG poses for Dr. Mae Vance. Candidate for WebP conversion (~1.1 MB). |
| `public/textures/` | `moon/` (`lroc_color_2k.jpg`, `ldem_3_8bit.jpg`), `mars/` (`mars_color_2k.jpg`, `mars_mola_dem_1024.jpg`), `earth/` (`earth_atmos_2048.jpg`, `earth_normal_2048.jpg`, `earth_specular_2048.jpg`). | High-fidelity scientific planetary textures sourced from NASA SVS. |
| `public/images/exhibits/` | Archival NASA mission photography (`apollo_boot.jpg`, `eagle_plaque.jpg`, `opportunity.jpg`, `insight_selfie.jpg`, `surveyor3.jpg`, etc.). | Authentic in-situ photography. Essential historical records. |
| `public/draco/` | `draco_decoder.js`, `draco_decoder.wasm`, `draco_wasm_wrapper.js`, `draco_encoder.js`. | Google Draco 3D geometry decompression runtime required by `@react-three/drei`'s `useGLTF`. |
| `public/data/` | `parts.moon.json`, `parts.mars.json`, `parts.insight.json`, `parts.perseverance.json`. | Sub-component coordinate and hotspot metadata for 3D hardware exploded views. |
| `public/cursors/` | `spaceship-cursor.png` (primary calibrated cursor asset), `spaceship-cursor-28.png`, `spaceship-cursor-36.png`, `spaceship-cursor-48.png`. | Multi-DPI icons for the desktop custom spaceship cursor. |

---

## 🧭 Canonical URL Schema & Navigation Precedence

ORBITAL implements an unambiguous query parameter resolution hierarchy in [navigationController.ts](src/navigation/navigationController.ts):

| Canonical URL | Mode | Target View | World | Artifact ID | Sub-View | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `guided` | `arrival` | `null` | `null` | — | 4-Beat Guided Introduction scroll container. |
| `/?state=destinations` | `guided` | `arrival` | `null` | `null` | — | Direct deep link to Chapter 4 (Orbital Globe Selector). |
| `/?dest=moon` | `free` | `exhibition` | `moon` | `null` | `collection` | Moon Museum Exhibition (Catalog Grid). |
| `/?dest=mars` | `free` | `exhibition` | `mars` | `null` | `collection` | Mars Museum Exhibition (Catalog Grid). |
| `/?dest=moon&view=map` | `free` | `map` | `moon` | `null` | `map` | Moon Surface Topography Map (NASA LOLA dataset). |
| `/?dest=mars&view=map` | `free` | `map` | `mars` | `null` | `map` | Mars Surface Topography Map (NASA MOLA dataset). |
| `/?dest=moon&artifact=apollo11_eagle` | `free` / `guided` | `artifactDetails` | `moon` | `apollo11_eagle` | `details` | Apollo 11 Eagle Deep-Dive Modal Overlay. |
| `/?dest=mars&artifact=opportunity` | `free` / `guided` | `artifactDetails` | `mars` | `opportunity` | `details` | Opportunity Rover Deep-Dive Modal Overlay. |
| `/?dest=moon&artifact=apollo11_eagle&view=story` | `free` | `documentary` | `moon` | `apollo11_eagle` | `story` (Ch. 0) | Optional Multi-Chapter Story Slideshow. |
| `/?dest=moon&artifact=apollo11_eagle&view=story&chapter=2` | `free` | `documentary` | `moon` | `apollo11_eagle` | `story` (Ch. 2) | Specific Documentary Chapter Slide. |
| `/?dest=moon&artifact=apollo11_eagle&view=legacy` | `free` | `legacy` | `moon` | `apollo11_eagle` | `legacy` | Optional Curatorial Legacy Retrospective. |
| `/?dest=moon&mode=explore` | `free` | `exploration` | `moon` | `null` | `explore` | Optional 3D First-Person Surface Roam. |

*Browser Back/Forward buttons smoothly transition between states using internal `_orbitalDepth` (and legacy `_afterlightDepth`) state tracking.*

---

## 🎨 Design System — "Signal & Stone"

ORBITAL follows a strict architectural and editorial aesthetic combining technical aerospace instrumentation with modern digital museum typography.

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

## ⚡ Performance Architecture & Baseline

Performance is continuously verified using automated headless Chrome DevTools Protocol (CDP) scripts across standard viewport targets:

| Viewport Target | Average Framerate | Frame Times (p95) | Initial Load Duration |
| :--- | :---: | :---: | :---: |
| **1920×1080 (Desktop Full HD)** | **57.4 FPS** | **17.6 ms** | **474 ms** |
| **1440×900 (MacBook / Pro Display)** | **58.1 FPS** | **17.2 ms** | **412 ms** |
| **1366×768 (Standard Laptop)** | **59.4 FPS** | **16.9 ms** | **380 ms** |
| **1024×768 (Tablet Landscape)** | **60.1 FPS** | **16.6 ms** | **310 ms** |
| **768×1024 (Tablet Portrait)** | **60.0 FPS** | **16.6 ms** | **295 ms** |
| **390×844 (Mobile iPhone)** | **60.2 FPS** | **16.5 ms** | **280 ms** |

### Key Optimization Principles:
1. **Demand-Driven Three.js Rendering:** When scrolling past the landing hero into text-heavy beats, the 3D canvas rendering is throttled (`setArrivalHeroVisible(false)`), reducing Three.js draw calls to 0 and freeing 100% GPU bandwidth.
2. **Device Pixel Ratio (DPR) Clamping:** DPR is clamped to `Math.min(1.5, window.devicePixelRatio)` on high-density displays to prevent fill-rate bottlenecks.
3. **Instanced Surface Boulders:** Fractured lunar basalt and Martian boulders render via `THREE.InstancedMesh`, consolidating dozens of objects into a single GPU draw call.
4. **Procedural Web Audio:** Zero external audio files are downloaded; all audio is synthesized at runtime via Web Audio API nodes.
5. **Reduced-Motion Support:** Full compliance with `prefers-reduced-motion` detected in `useExperienceStore.ts`. Disables camera tweening, uses instant scroll jumps, zeros out Framer Motion translations, and pauses planet rotations.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v18.0 or higher recommended; tested on v22)
- **npm** (v9.0 or higher)

### Installation
```bash
git clone https://github.com/your-username/orbital.git
cd orbital
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Preview
```bash
npm run build
npm run preview
```
The production bundle will be built into the `dist/` directory.

### Running Audits & Benchmarks
- **Inspect 3D GLB Meshes:**
  ```bash
  node scripts/audit-glb-meshes.mjs
  ```
- **Run Headless Browser CDP Performance Benchmark:**
  ```bash
  node scratch/run_performance_benchmark.cjs
  ```

---

## 📚 Data Citations & Primary Sources

- **NASA Apollo 11 Mission Report (NASA SP-214):** Official mission flight telemetry and landing site coordinates (NSSDC ID: `1969-059C`).
- **NASA JPL Opportunity Science Synthesis (JPL-Pub 19-3):** 15-year MER-B mission records and 45.16 km traverse dataset.
- **NASA Planetary Data System (PDS) Cartography Group:** Authoritative planetary coordinates for lunar and martian heritage sites.
- **NASA Lunar Reconnaissance Orbiter Camera (LROC):** Mare Tranquillitatis NAC high-resolution photographic imaging.
- **NASA Mars Reconnaissance Orbiter (MRO) HiRISE:** In-situ high-resolution orbital verification of Martian hardware.

---

## 📄 License

This project is created for educational, historical, and archival purposes under the **MIT License**. NASA imagery, 3D models, and telemetry datasets are in the public domain and credited to NASA/JPL-Caltech.
