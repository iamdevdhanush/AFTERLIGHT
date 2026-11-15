# AFTERLIGHT — 3D Planetary Archaeology & Aerospace Museum

> *Every machine leaves a story.*

**AFTERLIGHT** is an aerospace-grade 3D digital museum and planetary archaeology suite exploring human-made spacecraft, landers, rovers, and relics across **The Moon**, **Mars**, and **Deep Space**. 

Powered by React 18, TypeScript, Three.js (`@react-three/fiber` & `@react-three/drei`), `three-mesh-bvh`, GSAP, Framer Motion, and procedural Web Audio, AFTERLIGHT pairs real-time scientific 3D planetary globes with museum-grade physical hardware inspection, authentic NASA JPL CAD models, and archival mission telemetry.

---

## 🌟 Comprehensive Feature Index

### 1. 🪐 3D Planetary Archaeology Module (`PLANETARY_ARCHAEOLOGY`)
Real-time 3D planetary exploration powered by NASA Planetary Data System (PDS) and USGS Astrogeology Science Center data:
- **Unified Astronomical Celestial Rotation**: Both the Moon and Mars globes rotate continuously around their real astronomical axial tilts (`-1.54°` for Moon, `-25.19°` for Mars) with smooth orbital velocity.
- **Synchronous Multi-Layer Rotation**: Globe terrain, LOLA DEM relief displacement, geospatial coordinate graticules, rover traversal paths, and 3D beacon pins all spin in 1:1 physical synchrony.
- **Interactive Orbit Spin Toggle**: Instant toggle between `ORBIT SPIN: ACTIVE` and `PAUSED`, with momentum inertia decay and automatic resume after inspecting sites.
- **Scientific Altimetry Sampler**: Live raycasting calculates instantaneous latitude, longitude, and topographic elevation in meters under the cursor.
- **Authentic PBR Terrain Shading**:
  - **Moon**: NASA SVS CGI Moon Kit LROC 2K color + LOLA 8-bit DEM elevation map with procedural displacement and angular breccia rock formations.
  - **Mars**: MOLA elevation data + Viking color mosaic with real-time limb atmospheric scattering shader simulating Rayleigh scattering in the thin carbon dioxide atmosphere.
- **3D Rover Traversal Routes (`RoverTraversePath3D.tsx`)**: Exact historical drive paths for Apollo 15/16/17 LRVs, Opportunity (45.16 km), Curiosity, and Perseverance with clickable GPS waypoints.
- **Hardware Site Discovery Reticles (`PlanetaryMarkers.tsx`)**: Numbered pulsing 3D beacon callouts color-coded by vehicle category (Rovers, Landers, Descent Stages, Science Instruments, ALSEP stations, Impact Sites) and confidence levels (*Confirmed*, *Approximate*, *Unverified*).

### 2. 🔬 3D Hardware Inspection Studio (Aerospace Museum Edition)
A dedicated virtual laboratory for examining historical spacecraft hardware at microscopic fidelity:
- **Official NASA JPL 3D CAD Models**:
  - **Apollo 11 Lunar Module "Eagle" (LM-5)**: 134 individual mesh nodes including Descent Stage, Ascent Cabin, Mylar/Kapton thermal blankets, Aesthetically gold-foiled landing struts, and Aerozine-50 hypergolic nozzles.
  - **Mars 2020 Perseverance Rover**: Official 4.98 MB NASA JPL CAD model featuring Mastcam-Z, MMRTG nuclear generator, SuperCam, titanium chevron wheels, and the robotic sample-caching arm.
  - **InSight Mars Lander**: High-detail NASA CAD model with dual UltraFlex solar arrays, SEIS seismometer dome, and HP³ heat flow probe.
- **`three-mesh-bvh` Accelerated BVH Raycasting**: Pixel-perfect mesh-level part detection across complex 100+ node scene graphs—eliminating guessed bounding boxes or screen-space approximations.
- **NASA-Accurate Procedural PBR Material Engine**:
  - Real-world physical properties tailored per subsystem: Gold Kapton foil (`metalness: 0.72, roughness: 0.28`), aircraft aluminum alloy 2219, blackened Inconel heat shields, titanium engine bells, and deep-blue solar array cells.
  - Correct single/array material unwrapping ensuring 100% visible polygons without draw-call loss.
- **7-Point Aerospace Studio Lighting Rig**:
  - Soft cold-space ambient base.
  - Key solar spotlight with soft shadow penumbra (`bias: -0.0003`, `normalBias: 0.04`).
  - Cool-blue deep-space bounce light.
  - Golden rim highlight tracing the rear spacecraft silhouette.
  - Under-vehicle anti-black bounce fill.
  - Overhead museum spotlight and ACES Filmic tone mapping (`exposure: 1.35`).
- **Smooth Exploded Subassembly View**: Lerps each subsystem along its specific mechanical explode vector while 3D numbered hotspot beacons smoothly glide with their hardware anchors.
- **Synchronized Camera Fly-To**: Smooth GSAP camera choreography triggered by mesh clicks, hotspot pins, right-hand drawer buttons, or arrow keys.
- **Data-Driven JSON Manifests**: Verified NASA engineering specifications, launch mass, dimensions, functional descriptions, mission facts, and source citations stored in `/public/data/parts.*.json`.
- **Authenticity Badging**: Prominent green `AUTHENTIC NASA 3D MODEL` shields vs. amber `ARCHIVAL RECONSTRUCTION` badges detailing model provenance.

### 3. 📖 7-Chapter Mission Storytelling Experience (`MissionStorytellingExperience.tsx`)
Interactive narrative engine providing deep chronological retrospectives:
- Chaptered documentary format with archival photography, transcripts, and telemetry metrics.
- Synchronized camera choreography: selecting narrative chapters automatically flies the camera to the historical surface site on the globe.
- Direct entry points into the 3D Hardware Inspection Studio for related vehicles.

### 4. 🎓 Space Archaeology Educational Hub (`EducationalHubModal.tsx`)
A full-featured educational resource built directly into the application:
- **Aerospace Glossary**: Indexed glossary of terms from ALSEP and Hypergolic Propellants to Regolith and Mass Spectrometry.
- **Spacecraft Comparison Matrix**: Side-by-side comparison of lunar and martian landers, rovers, masses, power sources, and operational lifespans.
- **Knowledge Challenge**: Interactive interactive trivia challenge testing users on mission history and planetary science.

### 5. 🎛️ Forgotten Hardware Filter Drawer (`HardwareFilterDrawer.tsx`)
Comprehensive spatial filtering tool:
- Filter by **Category** (Rovers, Landers, Descent Stages, Instruments, ALSEPs, Impact Sites).
- Filter by **Disposition** (Intentionally Left Behind, Operational Abandonment, Crash/Impact).
- Filter by **Operational Status** (Active, Inactive/Silent, Destroyed).
- Filter by **Location Confidence** (Confirmed to ±0.5m, Approximate, Unverified).
- Dual-slider **Launch Year Range Filter** (1959 – 2024).
- Dedicated search bar with instant autocomplete across all historical missions.

### 6. 🚀 Cinematic Scroll-Driven Arrival (`ScreenArrival.tsx`)
- Full-viewport lunar establishing shot featuring the Apollo 11 Lunar Module on the regolith with Earth rising above the limb.
- Asymmetric editorial typography and smooth transitions into the Destination Selector.

### 7. 🛰️ Custom Spaceship Cursor (`SpaceshipCursor.tsx`)
- Hardware-accelerated custom mouse cursor modeled as an exploration spacecraft with calibrated click hotspot, thruster particle glow, and interactive button-hover states.

---

## 🗺️ Experience Flow & Navigation State Machine

The user journey is governed by a deterministic Zustand state machine (`useExperienceStore.ts`):

```
ARRIVAL ➔ DESTINATION_SELECT ➔ PLANETARY_ARCHAEOLOGY ➔ 3D HARDWARE STUDIO
   │                  │                      │
   ▼                  ▼                      ▼
EXHIBITION ➔ ARTIFACT_INSPECTION ➔ STORY_CHAPTER ➔ LEGACY
```

| State | Component | Key User Capabilities |
| :--- | :--- | :--- |
| `ARRIVAL` | `ScreenArrival.tsx` | Prologue narrative, Earthrise vista, entry CTA |
| `DESTINATION_SELECT` | `ScreenDestinationSelect.tsx` | Switch between Moon and Mars, view atmospheric specs, choose Museum Catalog or 3D Map |
| `PLANETARY_ARCHAEOLOGY` | `PlanetaryArchaeologyModule.tsx` | Full 3D orbital globe, surface coordinates, landing site beacons, rover traverses, altimetry |
| `HARDWARE_STUDIO` | `HardwareInspectionStudio.tsx` | 3D exploded view, BVH raycasting, PBR materials, turntable, engineering dossier |
| `EXHIBITION` | `ScreenExhibition.tsx` | Museum catalog grid with high-resolution photography and historical provenance |
| `ARTIFACT_INSPECTION` | `ScreenArtifactInspection.tsx` | Oblique 3/4 hardware inspection with telemetry cards |
| `STORY_CHAPTER` | `ScreenDocumentary.tsx` | Chaptered documentary with audio chimes and archival photo galleries |
| `LEGACY` | `ScreenLegacy.tsx` | Final status of in-situ relics, coordinates, and NASA archival links |

---

## ⌨️ Controls & Interaction Quick Reference

### 3D Orbital Globe (Moon & Mars)
- **Rotate Globe**: Left-click + drag (with smooth inertial release).
- **Zoom Surface**: Mouse wheel scroll / pinch-to-zoom.
- **Inspect Landing Site**: Click any glowing numbered beacon pin.
- **Toggle Auto-Rotation**: Click `ORBIT SPIN: ACTIVE / PAUSED` in top-left or bottom telemetry bar.
- **Switch Worlds**: Click `MOON` or `MARS` in the top-right selector.
- **Open Filter Drawer**: Click `FILTERS` or the circular tools icon in the bottom right.

### 3D Hardware Inspection Studio
- **Pick Part**: Click directly on physical hardware geometry or hotspot pin.
- **Rotate Vehicle**: Left-click + drag around the museum pedestal.
- **Cycle Subassemblies**: Press `←` (Left Arrow) or `→` (Right Arrow) keys.
- **Toggle Exploded View**: Click `EXPLODED VIEW` in top-left toolbar.
- **Toggle Turntable**: Click `TURNTABLE ON / OFF`.
- **Exit Studio**: Press `Escape` or click `✕` in header.

---

## 📁 Repository File Structure

```text
AFTERLIGHT/
├── public/
│   ├── data/
│   │   ├── parts.moon.json              # Apollo 11 LM NASA hardware manifest
│   │   ├── parts.perseverance.json      # Perseverance Rover NASA CAD manifest
│   │   ├── parts.insight.json           # InSight Lander hardware manifest
│   │   └── parts.mars.json              # Opportunity Rover hardware manifest
│   ├── models/
│   │   ├── apollo_lunar_module.glb      # Official NASA Apollo LM-5 (0.68 MB)
│   │   ├── perseverance_rover.glb       # Official NASA JPL Perseverance CAD (4.98 MB)
│   │   ├── insight_lander.glb           # Official NASA JPL InSight Lander (3.77 MB)
│   │   └── voyager_probe.glb            # Interstellar Voyager 1 CAD (1.64 MB)
│   └── textures/
│       ├── moon/                        # NASA LROC color & LOLA DEM displacement maps
│       └── mars/                        # NASA Viking color & MOLA elevation maps
├── scripts/
│   └── audit-glb-meshes.mjs             # Node CLI utility to inspect & validate GLB mesh graphs
├── src/
│   ├── App.tsx                          # Root state router & custom cursor overlay
│   ├── audio/
│   │   ├── SoundManager.ts              # Web Audio procedural planetary ambient synthesizer
│   │   └── GuideVoiceEngine.ts          # Archival audio narration controller
│   ├── components/
│   │   ├── canvas/                      # Global environment Three.js components
│   │   │   ├── PlanetSphere.tsx         # 3D interactive destination selector globe
│   │   │   └── SceneCanvas.tsx          # R3F canvas wrapper & camera director
│   │   └── ui/                          # Arrival, Destination, Exhibition & Legacy screens
│   ├── modules/
│   │   └── planetary-archaeology/       # Complete 3D Planetary Archaeology Suite
│   │       ├── components/
│   │       │   ├── ArtifactDiscoveryPanel.tsx     # Site dossier with archival photo & specs
│   │       │   ├── EducationalHubModal.tsx        # Glossary, comparisons, trivia quiz
│   │       │   ├── HardwareFilterDrawer.tsx       # Multi-criteria hardware filter drawer
│   │       │   ├── HardwareInspectionStudio.tsx   # 3D PBR studio, BVH raycast, exploded view
│   │       │   ├── MissionStorytellingExperience.tsx # 7-chapter storytelling overlay
│   │       │   ├── PlanetaryArchaeologyModule.tsx # Top-level 3D orbital controller & HUD
│   │       │   ├── PlanetaryGlobe.tsx             # PBR planetary terrain mesh & DEM displacement
│   │       │   ├── PlanetaryGlobeCanvas.tsx       # R3F Canvas, starfield, unified spin group
│   │       │   ├── PlanetaryMarkers.tsx           # 3D pulsing hardware beacon pins
│   │       │   ├── RegionalTerrainInspector.tsx   # Topographic cross-section altimetry
│   │       │   └── RoverTraversePath3D.tsx        # 3D historical rover paths & GPS waypoints
│   │       ├── data/
│   │       │   ├── planetarySites.ts              # 60+ verified lunar & martian landing sites
│   │       │   └── roverTraverses.ts              # GPS coordinate tracks for rovers & LRVs
│   │       └── services/
│   │           ├── nasaTrekService.ts             # Elevation samplers & NASA WMTS tile mappings
│   │           └── planetaryMath.ts               # Spherical lat/lon to Cartesian vector math
│   ├── store/
│   │   └── useExperienceStore.ts        # Zustand global state store & query sync
│   └── types/
│       ├── index.ts                     # Core destination & artifact interfaces
│       └── planetary.ts                 # Planetary archaeological & GIS interfaces
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ Technology Stack

- **Frontend Core**: React 18.3, TypeScript 5.6, Tailwind CSS 3.4
- **3D Graphics & WebGL**: Three.js 0.169, `@react-three/fiber` 8.17, `@react-three/drei` 9.117
- **Raycasting & Geometry**: `three-mesh-bvh` 0.8.0 (Bounding Volume Hierarchy spatial acceleration)
- **Animation & Transitions**: GSAP 3.12, Framer Motion 11.11
- **State & Architecture**: Zustand 5.0
- **Audio Synthesis**: Procedural Web Audio API (zero external `.mp3` dependencies)
- **Build System**: Vite 5.4

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- `npm`

### Installation
```bash
# Clone the repository
git clone https://github.com/shettyadi57/AFTERLIGHT.git
cd AFTERLIGHT

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev

# Open in browser:
http://localhost:3000/
# Or directly access the 3D Planetary Map:
http://localhost:3000/?state=destinations
```

### Production Build & Type Checking
```bash
# Run TypeScript validation and compile bundle
npm run build

# Preview production build locally
npm run preview
```

### Auditing 3D GLB Meshes
To inspect the scene graph, mesh names, and node hierarchies of any spacecraft model:
```bash
node scripts/audit-glb-meshes.mjs public/models/perseverance_rover.glb
```

---

## 📜 Citations & Authentic Sources

- **NASA 3D Resources**: Apollo Lunar Module LM-5, Perseverance Rover CAD, InSight Lander Mesh (`nasa/NASA-3D-Resources`).
- **NASA Planetary Data System (PDS)**: LOLA (Lunar Orbiter Laser Altimeter) & LROC datasets.
- **USGS Astrogeology Science Center & NASA Solar System Treks**: Topographic DEM and albedo map tiles (`trek.nasa.gov`).
- **NASA Jet Propulsion Laboratory (JPL)**: Mars Exploration Rover & Mars 2020 mission engineering documentation.

---

*Designed and engineered for humanity's permanent archaeological record.*

