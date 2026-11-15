# AFTERLIGHT — 3-Minute Competition Demo Walkthrough
**2026 NASA Space Apps Challenge: Abandoned but not Forgotten**
*Presenters: Engineering & Scientific Visualization Lead*
*Target Time: 03:00 Minutes*

---

## High-Level Cue Sheet

| Timestamp | Phase | On-Screen Action | Key Talking Points |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:30** | **The Problem** | Landing on Arrival Screen (`ScreenArrival.tsx`). Slow orbit of Moon and Mars in background. | Over 50 years of robotic exploration left hundreds of silent monuments across the Moon and Mars. Most students only know active missions; textbooks make past relics dry and technical. |
| **00:30 - 01:15** | **The Solution (<10s Discovery)** | Click **"LAUNCH STORY MODE"** or **"EXPLORE 3D SITES"**. Smooth camera transition into 3D Orbital Globe. | Direct, zero-login discovery in under 10 seconds. Real NASA PDS & USGS coordinates. Toggle between Moon and Mars with 1 click. Dual-coded geometric pins ensure 100% color-blind accessibility. |
| **01:15 - 01:50** | **Scientific Studio & Disassembly** | Select **Apollo 11 Descent Stage** or **Perseverance**. Enter **3D Hardware Studio**. Click "EXPLODE CAD". | Exploded CAD breakdown of actual subsystems (DPS engine, ALSEP, landing radar). Direct links to NASA source documentation. Instant unit toggle between Metric and Imperial. |
| **01:50 - 02:25** | **Global Reach & Teacher Mode** | Switch language to **Hindi / Spanish / Arabic (RTL)**. Open **Teacher Mode Modal**. Show 10-Question Quiz & CSV export. | Built for a schoolkid on a \$50 Android phone or a classroom in rural India or Colombia. 7 languages, PWA offline caching, adaptive quality governor (60 FPS), printable lesson plan, exportable CSV quiz. |
| **02:25 - 03:00** | **Impact & Future Vision** | Show WebGL fallback preview & CI badge. Closing slide. | 281 automated scientific integrity checks in CI, WCAG 2.2 AA compliant. Transforming dead metal into living inspiration for the Artemis generation. |

---

## Detailed Speaker Script

### 1. The Challenge (00:00 - 00:30)
> *"Judges, since 1964, humanity has left over 200 metric tons of technological marvels across the Moon, Mars, and deep space. From the Apollo lunar modules to the silent wheels of Opportunity in Endeavour Crater, these are not space junk—they are humanity’s off-world cultural heritage.
>
> But school-age space enthusiasts face a steep barrier: their stories are locked behind dense NASA PDS telemetry databases or dry textbooks.
>
> We built **AFTERLIGHT** to bridge that gap—a free, open-source, museum-grade planetary archaeology platform designed to run smoothly on any device, anywhere in the world."*

---

### 2. Flagship Discovery & 3D Planetary Exploration (00:30 - 01:15)
> *"With zero logins and under 10 seconds from landing, any student can launch directly into the experience.
>
> Notice our interactive 3D Orbital Globes of both the Moon and Mars, powered by Three.js and custom shaders. Every single site marker is calibrated to true selenographic and aerocentric coordinates directly from NASA PDS and LROC Narrow Angle Camera observations.
>
> Notice also our visual pins: we don't rely solely on color. Following WCAG 2.2 AA standards, each marker uses dual-coded 3D geometry: cones for landers, cubes for rovers, octahedrons for science packages, and toruses for impact craters—making it instantly accessible for color-blind learners."*

---

### 3. Engineering Studio & Subsystem Storytelling (01:15 - 01:50)
> *"Let's zoom into Tranquillity Base and inspect the Apollo 11 Lunar Module Descent Stage.
>
> When we step into the 3D Hardware Studio, students can interactively disassemble the machine with our exploded-view slider. Here is the Descent Propulsion System, the hypergolic fuel tanks, and the landing radar that made Neil and Buzz’s landing possible.
>
> Every subsystem card includes historical mission context, verified mass figures, and direct links to authentic NASA source documentation. If a student or researcher spots a coordinate discrepancy, our built-in 'Report Correction' flow links straight into our open GitHub scientific issue tracker."*

---

### 4. Global Classroom Impact: i18n & Teacher Mode (01:50 - 02:25)
> *"A world-class educational tool must reach real students everywhere, not just high-bandwidth classrooms in major cities.
>
> With one click on our Language Switcher, AFTERLIGHT instantly translates into **Hindi, Spanish, French, Mandarin, Portuguese, and full right-to-left Arabic**, complete with localized metric and imperial units.
>
> For educators, our **Teacher Mode** provides shareable deep links to specific hardware parts, a one-click printable student lesson sheet, and a curriculum-aligned 10-question space archaeology quiz that teachers can export directly as a CSV for Google Classroom or Canvas.
>
> Under the hood, an adaptive quality governor monitors frame rates and dynamically scales resolution to maintain 60 FPS on desktop and 30+ FPS on mobile, while our Service Worker enables full offline operation."*

---

### 5. Verification & Summary (02:25 - 03:00)
> *"Every claim in AFTERLIGHT is backed by 281 automated scientific integrity tests running in GitHub Actions CI. If WebGL is unavailable, our accessible 2D gallery ensures no child is left behind.
>
> AFTERLIGHT turns abandoned off-world artifacts into an enduring narrative of scientific curiosity, inspiring the Artemis generation to carry exploration forward.
>
> Thank you, and we welcome your questions!"*
