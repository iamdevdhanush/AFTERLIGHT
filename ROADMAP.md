# AFTERLIGHT — Prioritized Engineering & Product Roadmap

> Based on the NASA Space Apps Challenge 2026 Audit (`AUDIT.md`)

---

## 🎯 P0: Must-Ship Core (Phase 1 — Current Sprint)

### 1. Problem Fit & Flagship Storytelling Flow
- [x] **Sub-10s Flagship Story Mode**: Add a prominent "Launch Story Mode" directly on landing with zero barrier to entry.
- [x] **Relatable Robotic Explorer Perspectives**: Incorporate first-person narrative excerpts from rovers (e.g., Opportunity's 15-year odyssey, Apollo 11 descent engine standing alone at Tranquility Base).
- [x] **Deep Connecting Lore**: Explicitly connect the engineering hardware to the science discoveries made and current Artemis/Mars Sample Return plans.

### 2. Global Reach & Localization
- [x] **Multilingual Support (i18n)**: English, Hindi, Spanish, French, Arabic (with RTL styling), Mandarin, and Portuguese.
- [x] **Unit & Measurement Toggle**: Metric (`kg`, `km`, `m`, `°C`) vs Imperial (`lb`, `mi`, `ft`, `°F`) with locale formatting.
- [x] **Offline-First PWA**: Web App Manifest (`manifest.json`), service worker caching models, textures, and UI assets for rural schools.
- [x] **Low-Bandwidth Adaptive Quality Governor**: Dynamic frame time monitor that downscales resolution, turns off shadows/displacement, and enforces 30+ FPS on budget devices.
- [x] **WebGL Fallback**: Graceful semantic 2D archival gallery when WebGL is unavailable.

### 3. Accessibility & Inclusivity (WCAG 2.2 AA)
- [x] **`aria-live` Telemetry Announcer**: Off-screen polite live regions announcing landing site and hardware subassembly inspections.
- [x] **Complete Keyboard Navigation**: Full tab index, visible focus rings (`focus-visible:ring-2 ring-amber-400`), keyboard shortcut map.
- [x] **`prefers-reduced-motion` Enforcement**: Disables canvas auto-spin, camera fly-to lerps, and pulsars.
- [x] **Color-Blind Dual Encoding**: Beacons differentiated by both geometric SVG shape and high-contrast color.
- [x] **Screen Reader Semantic Descriptions**: Rich text descriptions for every physical part and landing site.

### 4. Scientific Integrity & Data Validation
- [x] **Data Schema Enforcement**: Add `{ source, url, retrievedAt, confidence }` across all sites and hardware manifest entries.
- [x] **CI Data Validation Script (`scripts/validate-data.mjs`)**: Automated build gate verifying coordinates, dates, URLs, and mesh node mappings.
- [x] **"Report a Scientific Correction" Link**: Direct GitHub issue template for community and scientific peer review.
- [x] **Unverified Data Flagging**: Prominently distinguish authentic NASA CAD from educational reconstructions.

### 5. Learning, Educator Tools & Impact
- [x] **Teacher Mode & Classroom Deep Links**: Query params for direct artifact assignment (`?site=...`, `?part=...`, `?story=...`).
- [x] **Printable Student Mission Worksheet**: Print-optimized CSS summary of mission facts and questions.
- [x] **LMS Quiz Export**: Export 10-question space archaeology trivia quiz directly to CSV for Google Classroom / Canvas.
- [x] **Embeddable Kiosk / Widget Mode**: Lightweight `?embed=true` URL parameter.

### 6. Engineering Quality & CI
- [x] **Vitest Test Suite**: Comprehensive unit tests covering planetary math, filtering logic, and state management.
- [x] **Code Splitting & Bundle Optimization**: Dynamic chunking for Three.js / Drei / Heavy components.
- [x] **GitHub Actions Workflow (`.github/workflows/ci.yml`)**: Automated typecheck, lint, test, and build pipeline.

---

## 🚀 P1: Near-Term Enhancements (Phase 2)
- [ ] **Interactive Cross-World Timeline**: Unified timeline spanning 1959 to present across Moon, Mars, and Deep Space.
- [ ] **Side-by-Side Spacecraft Scale Compare Mode**: Real-scale visual comparison between Apollo LM, Curiosity/Perseverance, and Opportunity.
- [ ] **WebXR Augmented Reality ("Place on your desk")**: QuickLook and WebXR anchor to view rovers on a physical classroom tabletop.
- [ ] **Automated Multi-lingual Voice Narration**: Offline browser SpeechSynthesis integration for spoken read-aloud of story chapters.

---

## 🔮 P2: Future Exploration
- [ ] **Community Crowdsourced Field Notes**: Moderated submissions of astronomical photographs and amateur radio telemetry recordings.
- [ ] **Venus & Outer Solar System Expansion**: Venera, Huygens (Titan), Galileo (Jupiter), and Cassini (Saturn) probes.
- [ ] **Real-time Orbital Ephemeris**: Live tracking of Voyagers 1 & 2, New Horizons, and Pioneer 10 relative to the solar system heliopause.
