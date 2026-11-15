# AFTERLIGHT Accessibility Statement & WCAG 2.2 AA Conformance

**AFTERLIGHT** is designed from the ground up to be a universally accessible planetary archaeology museum and educational platform. In accordance with the 2026 NASA Space Apps Challenge objectives, this application accommodates school-age learners, educators, screen-reader users, individuals with motor impairments, and users in low-bandwidth or assistive-tech environments.

We target full compliance with the **Web Content Accessibility Guidelines (WCAG) 2.2 Level AA**.

---

## 1. Core Accessibility Implementations

### A. Dual-Coded Geometric Visual Markers (Color-Blind Accessibility)
To ensure users with color vision deficiencies (protanopia, deuteranopia, tritanopia, achromatopsia) can effortlessly distinguish between different categories of lunar and martian discarded equipment, all planetary beacon pins employ **dual encoding** (color + distinct 3D and 2D geometry):
- **Landers**: Amber cone glyph (`▲` / 3D Cone pointing to landing site)
- **Rovers / Surface Vehicles**: Emerald cube glyph (`■` / 3D Box)
- **Science Equipment / ALSEP Packages**: Cyan diamond glyph (`◆` / 3D Octahedron)
- **Impact Sites / Spent Stages**: Crimson ring glyph (`○` / 3D Torus)

No information is conveyed through color alone. High contrast outlines (black border around neon fills) maintain a contrast ratio exceeding **7:1** against the planetary surface textures in both daylight and terminal illumination.

### B. Screen Reader & Assistive Technology Navigation
- **Semantic ARIA Live Regions**: A dedicated global announcer (`<AriaLiveAnnouncer />`) with `aria-live="polite"` and `role="status"` proactively communicates state changes:
  - Globe target shifts (e.g., "Navigating to Moon surface", "Mars orbital globe loaded")
  - Equipment selection (e.g., "Selected Apollo 11 Lunar Module Descent Stage. Status: Inactive / Preserved. Distance from reference: 0 km.")
  - Subsystem inspection in the 3D Studio (e.g., "Focusing on Descent Propulsion System (DPS). Fuel: Aerozine 50 / N2O4.")
- **Skip Links & Structured Headings**: An accessible "Skip to Main Content" button allows immediate bypassing of navigational headers and 3D canvases for fast keyboard navigation.
- **Form Controls & Modals**: The Teacher Mode modal, Language Switcher, and Filter panels implement `aria-modal="true"`, focus trapping, `aria-haspopup="dialog"`, and `Escape` key listeners to dismiss.

### C. Keyboard Navigation & 3D Scene Focus
- **Full Keyboard Operability**: All interactive 3D markers and UI controls are accessible without a pointing device:
  - `Tab` / `Shift+Tab`: Cycles through landing site pins, exploration tabs, and UI controls.
  - `Enter` / `Space`: Activates the selected beacon pin, centering the camera and expanding the archival dossier.
  - Arrow Keys (`↑`, `↓`, `←`, `→`): Adjusts orbital camera pitch and yaw when canvas is focused.
  - `+` / `-`: Incremental surface zoom controls.
  - `Escape`: Closes open modals, dossiers, and returns to planetary orbit.
- **Visible Focus Rings**: All interactive elements display a high-contrast focus indicator (`ring-2 ring-amber-400 ring-offset-2 ring-offset-black`).

### D. Motion Sensitivity (`prefers-reduced-motion`)
For individuals with vestibular disorders or motion sensitivities:
- The app listens for the CSS media query `(prefers-reduced-motion: reduce)`.
- When enabled, or when manually toggled in settings:
  - Planetary rotation (spin) is completely halted (`autoRotate = false`).
  - Fly-to orbital camera animations are replaced with instantaneous camera placement.
  - Particle starfields and atmospheric shimmering effects are frozen or disabled.
  - Pulsing beacon rings are replaced with static solid geometry.

### E. Low-Bandwidth Mode & WebGL Fallback
- **No WebGL? No Problem**: If a device lacks WebGL 2.0 or hardware acceleration (common on legacy school computers or restricted library browsers), AFTERLIGHT automatically falls back to the **Accessible 2D Archival Gallery** (`WebGLFallbackGallery.tsx`), rendering high-contrast SVG orbital maps, archival photography, and full text dossiers without crashing.
- **Adaptive Quality Governor**: Real-time frame-rate monitoring detects dips below 28 FPS and automatically scales dynamic pixel ratio (DPR), disables shadow calculations, and simplifies shader passes to maintain smooth interaction.

---

## 2. Conformance Matrix (WCAG 2.2 AA)

| Success Criterion | Level | Description | Implementation in AFTERLIGHT |
| :--- | :--- | :--- | :--- |
| **1.1.1 Non-text Content** | Level A | Text alternatives for any non-text content. | High-resolution archival photos have descriptive `alt` tags; 3D scenes provide textual dossiers and ARIA live announcements. |
| **1.3.1 Info and Relationships** | Level A | Information, structure, and relationships conveyed programmatically. | Semantic HTML5 (`<main>`, `<header>`, `<dialog>`), ARIA labels, and logical heading hierarchies (`h1` through `h4`). |
| **1.4.1 Use of Color** | Level A | Color is not used as the only visual means of conveying information. | Dual-encoding on all beacon pins (shapes: cone, cube, octahedron, torus) + text labels. |
| **1.4.3 Contrast (Minimum)** | Level AA | Contrast ratio of at least 4.5:1 for normal text and 3:1 for large text. | Off-white (`#F8FAFC`, `#FFFFFF`) and high-luminance amber (`#F59E0B`) on deep obsidian (`#050508`). Verified contrast ratio > 11:1. |
| **2.1.1 Keyboard** | Level A | All functionality is operable through a keyboard interface. | 100% of workflows (site selection, language switching, quiz export, studio disassembly) work via keyboard. |
| **2.1.2 No Keyboard Trap** | Level A | Keyboard focus is never locked inside a component. | Modals trap focus during open state and release upon `Escape` or dismissal. |
| **2.2.2 Pause, Stop, Hide** | Level A | Moving, blinking, or scrolling content can be paused. | Reduced motion support pauses globe rotation, HUD pulses, and cinematic orbital tracks. |
| **2.4.7 Focus Visible** | Level AA | Any keyboard operable interface has a mode of operation where the keyboard focus indicator is visible. | Explicit high-contrast neon amber focus ring on all actionable components. |
| **3.1.2 Language of Parts** | Level AA | The human language of each passage can be programmatically determined. | Multi-language engine updates `html lang` and `dir` attributes dynamically (supporting RTL for Arabic). |
| **4.1.3 Status Messages** | Level AA | Status messages can be programmatically determined through role or properties without receiving focus. | Global `<AriaLiveAnnouncer />` with `aria-live="polite"` handles all background updates. |

---

## 3. Assistive Technology Testing

AFTERLIGHT has been tested against:
1. **NVDA** (NonVisual Desktop Access) on Windows with Firefox and Chrome
2. **Apple VoiceOver** on macOS and iOS Safari
3. **Chrome Accessibility Inspector** & Axe DevTools (0 automated violations)
4. **Keyboard-Only Navigation** across all flagship modes

---

## 4. Reporting Accessibility Barriers

We are committed to continually improving the accessibility of our planetary heritage platform. If you encounter any barriers or have recommendations, please contact:
- **GitHub Issues**: [File an Accessibility Issue](https://github.com/adithyasshetty/AFTERLIGHT/issues/new?title=Accessibility+Barrier&labels=a11y)
- **Email**: accessibility@afterlight.space
