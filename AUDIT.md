# AFTERLIGHT — Engineering, Scientific & Accessibility Audit (Phase 0)

> **Challenge:** 2026 NASA Space Apps Challenge — *Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars*  
> **Audience:** School-age space enthusiasts, educators, researchers, and global explorers  
> **Target Standard:** World-Class, Globally Accessible, Scientifically Rigorous, WCAG 2.2 AA Compliant

---

## 1. Executive Summary & Problem Fit Gap Analysis

### 1.1 The NASA Challenge Mandate
The challenge tasks creators to tell the story of equipment left by NASA across the solar system (the Moon, Mars, and deep space) to inspire school-age space enthusiasts and casual learners. Key challenge requirements include:
1. **Translating complex historical & engineering data into engaging storytelling.**
2. **Highlighting the forgotten robotic explorers** (landers, rovers, descent stages, scientific payloads).
3. **Explaining what they are, why they were sent, and the breakthrough science they made possible.**
4. **Fostering a personal, emotional connection to silent monuments.**
5. **Ensuring high scientific accuracy with real historical facts and mission telemetry.**

### 1.2 Current State vs. Challenge Mandate Gap Analysis

| Dimension | Current Implementation in AFTERLIGHT | The Competition & Real-World Gap | Severity |
| :--- | :--- | :--- | :--- |
| **Youth & Student Appeal** | Dense academic prose (e.g. *"hypergolic bipropellant Aerozine-50"*, *"pulverized basaltic regolith"*). | Lacks accessible, age-tiered narrative perspectives (e.g. storytelling from the rover's own perspective: *"Sol 5,352: My battery is low and it's getting dark"*). | **P0** |
| **Discoverability Under 10s** | Multi-screen state transitions requiring multiple clicks or URL parameters. | Students on classroom Chromebooks need an instant "Launch Mission Story" within 10 seconds of landing with zero login. | **P0** |
| **Global Accessibility (i18n)** | 100% English only. Coordinates and units are hardcoded in mixed formats. | Must support major world languages (English, Hindi, Spanish, French, Arabic RTL, Mandarin, Portuguese) and Metric/Imperial toggle. | **P0** |
| **Offline & Low-Bandwidth** | 1.85 MB monolithic JS bundle + 4.98 MB uncompressed GLBs. Requires persistent high-speed internet. | Rural classrooms and mobile users experience blank screens or slow loads. Needs offline PWA caching, WebGL fallbacks, and adaptive LOD. | **P0** |
| **Accessibility (WCAG 2.2 AA)** | Zero `aria-live` announcements. 3D canvas is mouse-heavy. Beacons use color alone. | Screen reader users receive no feedback on part inspection. Needs keyboard tab indexing, dual-coded shapes + colors, and reduced-motion enforcement. | **P0** |
| **Educator & Classroom Tools** | No exportable materials or teacher resources. | Teachers cannot share specific deep-linked lesson modules, print offline study worksheets, or export classroom quizzes to CSV. | **P0** |
| **Data Integrity & CI** | Data scattered across JSONs and TypeScript files without automated schema enforcement. | No automated build check ensures every fact has a verifiable NASA URL, retrieval date, and valid coordinate bounds. | **P0** |

---

## 2. Technical Performance Audit

### 2.1 Bundle & Asset Payload
- **JavaScript Bundle**: Single bundle of `1,849.02 kB` (uncompressed) / `528.93 kB` (gzip). 
  - *Risk*: Evaluates slowly on low-end ARM mobile processors.
  - *Remedy*: Dynamic code-splitting with `React.lazy()` for 3D canvases, heavy modals, and route views using Vite `manualChunks`.
- **3D Geometry Weight**:
  - `perseverance_rover.glb`: `4.98 MB` (CAD-level detail with 68 meshes).
  - `insight_lander.glb`: `3.77 MB`.
  - `apollo_lunar_module.glb`: `0.68 MB`.
  - *Risk*: Initial load on 3G/4G connections can stall.
  - *Remedy*: Draco/Meshopt compression and progressive LOD loading.
- **Texture Payloads**: Planetary 2K maps (~2.5 MB total).
  - *Risk*: Consumes mobile GPU memory if rendered at high resolution on budget Android devices.
  - *Remedy*: Adaptive Quality Governor that monitors frame rendering times and automatically scales down pixel ratio, shadow maps, and displacement when FPS dips below 30.

---

## 3. Accessibility & Inclusivity Audit (WCAG 2.2 AA)

1. **Screen Reader Live Regions (`aria-live`)**:
   - Currently, selecting a landing site or spacecraft subassembly only updates visual DOM without notifying assistive technologies.
   - *Fix*: Implement an off-screen `aria-live="polite"` telemetry announcer that speaks site names, coordinates, and functional part summaries immediately upon selection.
2. **Keyboard Navigation in 3D Canvas**:
   - Orbit controls capture pointer events but do not provide an obvious DOM keyboard tab ring for 3D hotspot callouts.
   - *Fix*: Provide HTML-mirrored focusable elements with visible focus rings (`focus-visible:ring-2 ring-amber-400`) and keyboard shortcuts (`Tab`, `Enter`, `←`, `→`, `Escape`, `Space`).
3. **Motion Sensitivity (`prefers-reduced-motion`)**:
   - While `ScreenArrival` checked `reducedMotion`, `PlanetaryGlobe` and `HardwareInspectionStudio` auto-rotation did not respect system OS reduced-motion preferences.
   - *Fix*: Automatically freeze auto-spin, camera fly-to lerps, and pulsars when `prefers-reduced-motion: reduce` is detected.
4. **Color-Blind Safe Telemetry Palette**:
   - Beacons previously used color alone (amber, yellow, red, cyan) to signal status.
   - *Fix*: Implement dual encoding combining high-contrast colors with distinct geometric SVG glyphs (▲ Lander, ⛟ Rover, ⬡ Descent Stage, ◆ Scientific Payload, ◎ Impact Site).
5. **No-WebGL Graceful Fallback**:
   - If WebGL is disabled or unsupported (e.g. restricted classroom environments), the app must render an accessible 2D High-Resolution Archival Exhibition Gallery with full transcripts and metadata.

---

## 4. Scientific Accuracy & Data Verification Audit

1. **Coordinate Verification**:
   - All 60+ lunar and martian landing sites in `planetarySites.ts` must be validated against official NASA Planetary Data System (PDS) and LROC NAC frame databases.
   - Bounds must strictly satisfy: `-90.0° <= Latitude <= +90.0°` and `-180.0° <= Longitude <= +180.0°`.
2. **Model Provenance Transparency**:
   - Models must be explicitly tagged as either `AUTHENTIC NASA 3D MODEL` (official NASA/JPL CAD) or `ARCHIVAL RECONSTRUCTION` (educational 3D reconstruction). Unverified claims must be flagged.
3. **Citation Completeness**:
   - Every hardware specification (launch mass, dimensions, primary instruments, mission facts) must include:
     - `source`: Official title (e.g., *NASA NSSDC Master Catalog*, *JPL Mars Exploration Rover Technical Description*).
     - `url`: Direct canonical URL.
     - `retrievedAt`: ISO verification timestamp.
     - `confidence`: `confirmed` | `approximate` | `unverified`.
4. **Automated Validation Script**:
   - Implement `scripts/validate-data.mjs` run in CI to fail the build if any citation is missing, any coordinates are invalid, or any mesh names in `parts.*.json` do not exist in the corresponding GLB files.

---

## 5. Global Reach & Internationalization (i18n)

1. **Multilingual Architecture**:
   - Integrated with `i18next` and `react-i18next`.
   - Core languages supported:
     - 🇺🇸 English (`en`) — Default
     - 🇮🇳 Hindi (`hi`) — हिंदी
     - 🇪🇸 Spanish (`es`) — Español
     - 🇫🇷 French (`fr`) — Français
     - 🇦🇪 Arabic (`ar`) — العربية (with full bidirectional RTL layout support)
     - 🇨🇳 Mandarin (`zh`) — 简体中文
     - 🇧🇷 Portuguese (`pt`) — Português
2. **Localized Measurements & Units**:
   - Metric (`kg`, `m`, `km`, `°C`) and Imperial (`lb`, `ft`, `mi`, `°F`) toggle with locale-aware number formatting (`Intl.NumberFormat`).

---

## 6. Educational Impact & Classroom Utility

1. **Teacher & Classroom Mode**:
   - Deep-linking engine enabling educators to assign specific artifacts directly:
     `?state=PLANETARY_ARCHAEOLOGY&dest=moon&site=apollo_11`
     `?state=HARDWARE_STUDIO&model=apollo11_eagle&part=lm-descent-engine`
   - One-click **Printable Student Mission Worksheet** (printer-optimized CSS).
   - Exportable **10-Question Knowledge Challenge CSV** for Google Classroom and Canvas LMS import.
2. **Embeddable Kiosk / Widget Mode**:
   - Lightweight `?embed=true` URL parameter that strips complex navigation bars, making AFTERLIGHT embeddable into museum kiosks and school library portals.

---

## 7. Audit Sign-Off
This audit establishes the baseline for the prioritized Phase 1 (P0) engineering build.
