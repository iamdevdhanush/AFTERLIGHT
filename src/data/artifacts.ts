import { ArtifactData } from '../types';

export const ARTIFACTS: Record<string, ArtifactData> = {
  // =========================================================================
  // THE MOON EXHIBITION (01 - 04)
  // =========================================================================

  apollo11_eagle: {
    id: 'apollo11_eagle',
    name: 'APOLLO 11 EAGLE DESCENT STAGE',
    callsign: 'LM-5 Descent Stage (Tranquility Base)',
    mission: 'Apollo 11',
    year: '1969',
    destination: 'moon',
    category: 'Hardware Component',
    modelType: 'Crewed Lunar Module Lower Landing Stage',
    landingDate: '20 July 1969',
    declarationDate: 'Permanent Heritage Site',
    operationalDuration: '21 hours, 36 minutes surface stay',
    status: 'abandoned',
    statusLabel: 'Abandoned Hardware — Intact at Tranquility Base',
    locationName: 'Mare Tranquillitatis (Sea of Tranquility)',
    heroImage: '/images/apollo11_surface.jpg',
    heroCaption:
      'Buzz Aldrin working beside the scientific equipment bay of Apollo 11 Lunar Module Eagle at Tranquility Base, July 20, 1969 (NASA AS11-40-5921).',
    heroNasaId: 'AS11-40-5921',
    galleryImages: [
      {
        src: '/images/apollo11_surface.jpg',
        caption: 'Lunar Module Eagle descent stage standing on Mare Tranquillitatis (AS11-40-5921).',
        nasaId: 'AS11-40-5921',
      },
      {
        src: '/images/exhibits/eagle_plaque.jpg',
        caption: 'Stainless-steel commemorative plaque mounted to Eagle’s forward landing strut (AS11-40-5899).',
        nasaId: 'AS11-40-5899',
      },
      {
        src: '/images/exhibits/apollo_boot.jpg',
        caption: 'Soil mechanics documentation photograph of a crew bootprint pressed into undisturbed lunar regolith (AS11-40-5877).',
        nasaId: 'AS11-40-5877',
      },
    ],
    has3DModel: true,
    coordinates: {
      latitude: '0.67408° N',
      longitude: '23.47297° E',
      elevation: '−1,500 m',
      planetaryRegion: 'Mare Tranquillitatis, The Moon',
      worldPosition: [0, 0, 0],
    },
    brief: 'The launch platform that remained behind.',
    shortDescription:
      'The octagonal lower stage that lowered Eagle onto Mare Tranquillitatis and anchored humanity’s first lunar liftoff.',
    tagline:
      'Built strictly for airless spaceflight, Eagle’s gold-wrapped lower stage absorbed touchdown and served as the stationary launch pad when the upper ascent stage returned to orbit.',
    guide: {
      explanation:
        "This is the descent stage of the Apollo 11 Lunar Module Eagle. It carried Neil Armstrong and Buzz Aldrin to the Moon's surface on July 20, 1969. After the astronauts returned to lunar orbit using the ascent stage, this lower section remained on the Moon.",
      purpose:
        'Controlled powered deceleration from lunar orbit to touchdown, housing descent propellants, thermal blankets, landing gear, and surface storage bays, then acting as the launch platform for the ascent stage.',
      missionUsed: 'NASA Apollo 11 (LM-5), July 1969.',
      whyLeftBehind:
        'The Lunar Module operated in two stages to conserve mass: once surface exploration concluded, the ascent stage fired off the top of the descent stage, leaving the heavier lower section behind.',
      presentStatus:
        'Non-operational and permanently preserved intact on Mare Tranquillitatis; its ascent stage separated into lunar orbit after rendezvous with Columbia and later impacted elsewhere on the Moon.',
      spokenIntro:
        'Welcome to the Apollo 11 exhibition. Standing before you is the lower descent stage of the Lunar Module Eagle.',
      voiceScript:
        "This is the descent stage of the Apollo 11 Lunar Module Eagle, which carried Neil Armstrong and Buzz Aldrin to the Moon's surface on July 20th, 1969. Engineered strictly for the vacuum of space, its primary purpose was to decelerate the spacecraft from lunar orbit and achieve a safe, powered touchdown. It housed throttleable rocket engines, hypergolic propellants, and outrigger landing legs with crushable honeycomb shock absorbers. During surface operations, it served as humanity's first lunar habitat and science station. Once exploration concluded, the upper ascent stage fired directly off this lower chassis to carry the astronauts back to orbit. The descent stage remained behind as their stationary launch pad. Today, it stands intact at Tranquility Base as a permanent historical monument, guarded by silence in the lunar dust.",
      keyFacts: [
        'Landed at Mare Tranquillitatis on July 20, 1969',
        'Served as the launch platform for Neil Armstrong and Buzz Aldrin',
        'Permanently preserved in situ at Tranquility Base',
      ],
    },
    components: [
      {
        id: 'eagle-chassis',
        name: 'Octagonal Descent Stage Chassis',
        category: 'Hardware Component',
        remainsOnSite: true,
        siteNote: 'Remains standing upright at Tranquility Base.',
        description:
          'Lightweight aluminum cruciform and octagonal structure wrapped in gold-tinted Kapton thermal foil, housing four spherical propellant tanks and the Quadrant storage bays.',
        guideExplanation:
          'This central octagonal body holds the empty fuel and oxidizer tanks along with the gold-coated Kapton foil that shielded electronics from 120°C sunlight.',
        voiceScript:
          "You are inspecting the octagonal chassis of Eagle's descent stage. Wrapped in shimmering gold Kapton and Mylar blankets, this aluminum frame housed four giant propellant tanks and shielded delicate guidance systems against extreme lunar temperature swings.",
        hotspot: { x: 50, y: 52 },
      },
      {
        id: 'eagle-legs',
        name: 'Four Landing Gear Struts',
        category: 'Landing Equipment',
        remainsOnSite: true,
        siteNote: 'All four struts remain grounded in the basalt regolith.',
        description:
          'Outrigger aluminum struts incorporating crushable honeycomb cartridges engineered to absorb vertical and lateral touchdown shock without rebounding.',
        guideExplanation:
          'Each telescoping strut uses internal crushable aluminum honeycomb designed to deform once on contact, preventing the spacecraft from tipping on sloped craters.',
        voiceScript:
          'These four outrigger struts absorbed the kinetic shock of touchdown. Inside each telescoping aluminum cylinder was a crushable honeycomb cartridge that compressed on impact, stabilizing Eagle on the uneven lunar surface.',
        hotspot: { x: 26, y: 68 },
      },
      {
        id: 'eagle-footpads',
        name: 'Circular Landing Footpads',
        category: 'Landing Equipment',
        remainsOnSite: true,
        siteNote: 'Resting lightly in shallow regolith depressions.',
        description:
          'Spun-aluminum 0.91-meter concave dishes attached to ball-joint swivels to distribute 15 metric tons of Earth-weight load safely across loose lunar dust.',
        guideExplanation:
          'Because engineers did not know how deeply spacecraft would sink into lunar soil, wide aluminum dish footpads spread the lander’s weight across loose dust.',
        voiceScript:
          "These thirty-seven-inch spun-aluminum dish footpads distributed Eagle's weight safely across powdery regolith, sinking only a few centimeters into the lunar dust during humanity's historic landing.",
        hotspot: { x: 74, y: 84 },
      },
      {
        id: 'eagle-ladder',
        name: 'Nine-Rung Egress Ladder & Plaque',
        category: 'Hardware Component',
        remainsOnSite: true,
        siteNote: 'Mounted to the forward landing strut facing north.',
        description:
          'Tubular aluminum ladder descending from the forward porch, carrying the etched stainless-steel plaque inscribed for Tranquility Base.',
        guideExplanation:
          'Neil Armstrong climbed down these nine rungs before stepping onto the surface. The stainless plaque bolted between rungs bears the date July 1969 A.D.',
        voiceScript:
          'Neil Armstrong climbed down these nine ladder rungs before taking his giant leap for mankind. Bolted between the lower rungs is the stainless-steel commemorative plaque inscribed: We came in peace for all mankind.',
        hotspot: { x: 64, y: 56 },
      },
      {
        id: 'eagle-dps',
        name: 'TRW Descent Propulsion Engine',
        category: 'Landing Equipment',
        remainsOnSite: true,
        siteNote: 'Centered beneath the octagonal stage.',
        description:
          'The first deeply throttleable crewed rocket engine (10% to 100% thrust), burning Aerozine 50 and nitrogen tetroxide for precision hovering.',
        guideExplanation:
          'Armstrong manually throttled this single gimbaled engine during the final minutes to skim past West Crater’s boulders with under 25 seconds of usable fuel.',
        voiceScript:
          'Centered beneath the lander is the Descent Propulsion Engine. The first deeply throttleable rocket engine built for space, it allowed Neil Armstrong to manually hover and navigate past boulder fields with under thirty seconds of fuel remaining.',
        hotspot: { x: 50, y: 78 },
      },
      {
        id: 'eagle-ascent-note',
        name: 'Upper Ascent Stage (Separated)',
        category: 'Complete Spacecraft',
        remainsOnSite: false,
        siteNote: 'Departed Tranquility Base on 21 July 1969; later impacted elsewhere on the Moon.',
        description:
          'Pressurized crew cabin that lifted off from atop the descent stage to dock with Command Module Columbia in lunar orbit.',
        guideExplanation:
          'Important distinction: only the lower descent stage sits at Tranquility Base today. The crew cabin separated on July 21 and later crashed into an unmapped site on the Moon.',
        voiceScript:
          'Notice that the upper crew cabin is absent. The ascent stage served as the crew compartment and fired off this lower stage to rendezvous with Michael Collins aboard Columbia, leaving only the descent stage standing at Tranquility Base.',
      },
    ],
    specs: {
      mass: '2,034 kg dry descent stage mass',
      powerSource: 'Silver-zinc internal batteries (1,600 Ah)',
      communication: 'S-band steerable antenna on ascent stage; VHF telemetry during descent',
      primaryInstruments: [
        'Descent Propulsion System (DPS) throttleable engine',
        'Lunar Surface Scientific Equipment Bay (MESA)',
        'EASEP stowage compartment (PSEP & LRRR deployed separately nearby)',
      ],
    },
    storyChapters: [
      {
        id: 'apollo-ch-1',
        chapterNumber: '01',
        chapterTitle: 'THE MACHINE FOR VACUUM',
        headline: 'Engineered Without Sky or Air.',
        narrative:
          'Designed by Grumman Aerospace specifically for spaceflight beyond Earth’s atmosphere, the Lunar Module abandoned wings, heat shields, and aerodynamic smoothness. Its aluminum truss and thin Kapton blankets saved every possible gram so a two-stage craft could descend under rocket thrust and lift back off from the Moon.',
        historicalContext:
          'The descent stage carried the heavy propellant tanks, landing legs, radar antenna, and storage bays; the ascent stage above carried only the pressurized cockpit and a smaller return engine.',
        archivalImage: '/images/apollo11_surface.jpg',
        imageCaption: 'Apollo 11 Lunar Module Eagle parked on Mare Tranquillitatis (NASA AS11-40-5921).',
        keyMetric: { label: 'Dry Descent Mass', value: '2,034 kg' },
        audioFrequency: 220,
      },
      {
        id: 'apollo-ch-2',
        chapterNumber: '02',
        chapterTitle: 'THE DESCENT',
        headline: 'Low Fuel Over West Crater.',
        narrative:
          'On July 20, 1969, Eagle’s descent engine ignited for powered braking above Mare Tranquillitatis. Guidance computer 1202 alarms interrupted the cockpit while automated steering aimed straight toward boulders around West Crater. Taking semi-manual attitude control, Neil Armstrong skimmed horizontally until settling Eagle softly down at 20:17:40 UTC.',
        historicalContext:
          'Residual propellant sensors indicated roughly 25 seconds of usable hovering time before a mandatory abort threshold.',
        archivalImage: '/images/exhibits/apollo_boot.jpg',
        imageCaption: 'Crew bootprint documenting regolith compaction beside Eagle (NASA AS11-40-5877).',
        keyMetric: { label: 'Touchdown Time', value: '20:17 UTC • July 20, 1969' },
        audioFrequency: 293.66,
      },
      {
        id: 'apollo-ch-3',
        chapterNumber: '03',
        chapterTitle: 'THE LEGACY AT TRANQUILITY BASE',
        headline: 'Silently Anchored for Millennia.',
        narrative:
          'After the astronauts collected 21.55 kg of lunar basalt separately on foot and deployed the EASEP experiments nearby, the ascent stage fired off the top deck of the descent stage at 17:54 UTC on July 21. Blast pressure flattened the distant flag and scattered fine dust, leaving the octagonal lower frame standing undisturbed.',
        historicalContext:
          'Lunar Reconnaissance Orbiter overhead photography decades later clearly resolves Eagle’s descent stage shadow beside astronaut footpaths.',
        archivalImage: '/images/exhibits/eagle_plaque.jpg',
        imageCaption: 'The Tranquility Base commemorative plaque attached to Eagle’s forward strut (NASA AS11-40-5899).',
        keyMetric: { label: 'Status', value: 'Protected Heritage Hardware' },
        audioFrequency: 440,
      },
    ],
    legacy: {
      physicalCondition:
        'Structurally intact octagonal descent stage resting upright on all four footpads, surrounded by bootprints and EASEP instruments.',
      currentMilestone:
        'Recognized under international and U.S. space heritage guidelines protecting the Tranquility Base landing site.',
      scientificImpact: [
        'Validated variable-thrust cryogenic-free hypergolic rocket landing on an uncharted extraterrestrial body.',
        'Provided mechanical shelter and power connections during surface equipment preparation for Apollo 11’s EVA crew.',
        'Enabled direct verification of lunar bearing strength across basaltic mare regolith.',
      ],
      whatRemainsToday:
        'The gold-blanketed octagonal descent stage, four landing legs and footpads, egress ladder with plaque, and empty propellant bay—minus the departed ascent cabin.',
      sources: [
        {
          title: 'NASA Apollo Lunar Surface Journal: Apollo 11 Operations & Hardware',
          organization: 'NASA History Division',
          url: 'https://www.nasa.gov/history/alsj/a11/a11.html',
          catalogId: 'NSSDC-ID: 1969-059C',
        },
        {
          title: 'Lunar Reconnaissance Orbiter Camera: Apollo 11 Tranquility Base Overflight',
          organization: 'NASA / GSFC / ASU',
          url: 'https://www.lroc.asu.edu/featured_sites/view_site/1',
          catalogId: 'LROC-A11-SITE',
        },
      ],
    },
    curatedQnA: [],
  },

  apollo_lrv: {
    id: 'apollo_lrv',
    name: 'APOLLO LUNAR ROVING VEHICLE',
    callsign: 'LRV-1, LRV-2 & LRV-3 (Apollo 15, 16, 17)',
    mission: 'Apollo 15, 16 & 17',
    year: '1971',
    destination: 'moon',
    category: 'Complete Spacecraft',
    modelType: 'Crewed Electric Lunar Surface Vehicle',
    landingDate: '31 July 1971 (First Deployment, Apollo 15)',
    declarationDate: 'Three Vehicles Parked on the Moon',
    operationalDuration: '3–4.5 hours driving per mission (90.5 km combined)',
    distanceTraveled: '27.9 km (A15) · 26.7 km (A16) · 35.9 km (A17)',
    status: 'inactive',
    statusLabel: 'Inactive — Three Vehicles Parked at Apollo 15, 16 & 17 Sites',
    locationName: 'Hadley-Apennine, Descartes Highlands & Taurus-Littrow',
    heroImage: '/images/exhibits/apollo_lrv.jpg',
    heroCaption:
      'Astronaut James Irwin beside Apollo 15 Lunar Roving Vehicle-1 near Hadley Rille and Mons Hadley Delta, August 1971 (NASA AS15-86-11603).',
    heroNasaId: 'AS15-86-11603',
    has3DModel: false,
    coordinates: {
      latitude: '26.1322° N (LRV-1 Site)',
      longitude: '3.6339° E',
      elevation: 'Hadley-Apennine Basin',
      planetaryRegion: 'Hadley-Apennine / Descartes / Taurus-Littrow',
      worldPosition: [0, 0, 0],
    },
    brief: 'Electric mobility that turned hours on foot into mountain expeditions.',
    shortDescription:
      'Battery-powered electric vehicles folded into Lunar Module bays that carried astronauts up to 7.6 km from camp.',
    tagline:
      'Weighing 210 kg on Earth yet carrying over twice its own mass in astronauts and rocks, three Lunar Roving Vehicles extended Apollo geology across rugged valleys and rilles.',
    guide: {
      explanation:
        'Three Lunar Roving Vehicles were deployed on Apollo 15, 16, and 17. Built by Boeing and Delco Electronics, each vehicle unfolded from the side of the Lunar Module descent stage and ran cleanly in vacuum using four independent hub electric motors.',
      purpose:
        'Transport two astronauts, cameras, tools, and collected rock samples across kilometers of lunar terrain—expanding the geological reach of later J-missions.',
      missionUsed: 'Apollo 15 (1971), Apollo 16 (1972), and Apollo 17 (1972).',
      whyLeftBehind:
        'Ascent stages lacked the payload capacity to return surface vehicles, and astronauts parked each rover roughly 100 meters east of its Lunar Module so Earth controllers could aim the rover’s TV camera to broadcast ascent liftoff.',
      presentStatus:
        'All three LRVs remain inactive and parked at their final observation points in Hadley-Apennine, Descartes, and Taurus-Littrow.',
      spokenIntro:
        'Welcome! You are exploring the Apollo Lunar Roving Vehicle, the celebrated electric vehicle that transformed lunar geology.',
      voiceScript:
        "The Lunar Roving Vehicle was an electric, four-wheeled exploration vehicle deployed during Apollo missions 15, 16, and 17. Its purpose was to dramatically extend the traverse range of astronauts across rugged lunar valleys and mountains. Developed by Boeing and General Motors, each rover featured an articulated aluminum chassis, spun-steel mesh tires with titanium chevrons, and independent electric drive motors on all four wheels. It enabled crews to travel up to thirty-six kilometers on a single mission, carrying geology tools, television systems, and hundreds of kilograms of lunar core samples. Because the rovers were too heavy to return in the Apollo ascent stage, all three vehicles were intentionally parked at safe distances from the landers to televise liftoff back to Earth. Today, three complete rovers remain parked on the Moon at Hadley Rille, the Descartes Highlands, and the Taurus-Littrow valley.",
      keyFacts: [
        'Deployed on Apollo 15, 16, and 17 J-series missions',
        'Powered by four independent 0.25-horsepower electric drive motors',
        'All three rovers remain intact at their final lunar parking sites',
      ],
    },
    components: [
      {
        id: 'lrv-wheels',
        name: 'Woven Spring-Wire Mesh Wheels (×4)',
        category: 'Hardware Component',
        remainsOnSite: true,
        siteNote: 'All twelve wheels across LRV-1, -2, and -3 remain on the Moon.',
        description:
          'Elastic 81 cm hoops woven from zinc-coated spring steel piano wire and ringed with titanium chevron treads to prevent tire blowouts or sinking in regolith.',
        guideExplanation:
          'Rubber pneumatic tires would burst or turn brittle in lunar vacuum. Woven steel wire flexed softly over boulders while titanium cleats gripped fine dust.',
        voiceScript:
          'Unlike rubber tires which would burst in vacuum or turn brittle in the cold lunar night, these wheels were hand-woven from zinc-coated piano wire. Chevron titanium treads provided traction across soft regolith without sinking.',
        hotspot: { x: 74, y: 64 },
      },
      {
        id: 'lrv-batteries',
        name: 'Dual 36V Silver-Zinc Batteries',
        category: 'Hardware Component',
        remainsOnSite: true,
        siteNote: 'Discharged inside forward chassis compartments.',
        description:
          'Two non-rechargeable 121-amp-hour potassium hydroxide batteries powering four 0.25-horsepower DC hub motors and Earth telemetry.',
        guideExplanation:
          'Each rover ran solely on two non-rechargeable silver-zinc batteries engineered for 92 km of range—no solar panels were fitted.',
        voiceScript:
          'Housed in the forward chassis, dual non-rechargeable silver-zinc batteries delivered 36 volts of direct current to four quarter-horsepower hub motors, supplying power without bulky solar arrays.',
        hotspot: { x: 52, y: 62 },
      },
      {
        id: 'lrv-antenna',
        name: 'Gold Mesh High-Gain S-Band Antenna',
        category: 'Hardware Component',
        remainsOnSite: true,
        siteNote: 'Mounted on forward mast pointing toward Earth.',
        description:
          'Collapsible parabolic umbrella dish folded from gold-plated molybdenum wire mesh to beam live color video directly from the Moon.',
        guideExplanation:
          'Astronauts aimed this umbrella dish toward Earth whenever parked so Mission Control could receive live geological commentary and video.',
        voiceScript:
          'This collapsible umbrella dish was woven from gold-plated molybdenum wire mesh. At each science stop, astronauts manually aligned its sight glass with Earth to transmit crystal-clear color television directly to Houston.',
        hotspot: { x: 44, y: 38 },
      },
      {
        id: 'lrv-lcru',
        name: 'Ground-Commanded TV Camera (LCRU)',
        category: 'Scientific Instrument',
        remainsOnSite: true,
        siteNote: 'Aimed toward Lunar Module ascent tracks at parking site.',
        description:
          'Steerable color television camera controlled remotely via radio command from Houston—capturing Apollo 17’s famous ascent liftoff.',
        guideExplanation:
          'After astronauts boarded the Lunar Module, controller Ed Fendell in Houston piloted this camera remotely to follow the ascent stage upward into lunar sky.',
        voiceScript:
          'Operated remotely from Mission Control in Houston with a four-second radio lag, this RCA color camera panned and tilted to broadcast astronaut explorations and captured the famous liftoff of the Lunar Module ascent stages.',
        hotspot: { x: 62, y: 46 },
      },
    ],
    specs: {
      mass: '210 kg uncrewed Earth mass (34 kg lunar weight)',
      powerSource: 'Dual 36V silver-zinc non-rechargeable batteries (4 × 0.25 hp motors)',
      communication: 'Lunar Communications Relay Unit (LCRU) S-band dish',
      primaryInstruments: [
        'T-handle drive controller & directional dead-reckoning gyro',
        'Westinghouse Color Lunar Television Camera',
        '16 mm data acquisition movie camera & geological tool rack',
      ],
    },
    storyChapters: [
      {
        id: 'lrv-ch-1',
        chapterNumber: '01',
        chapterTitle: 'FOLDED INSIDE QUADRANTS',
        headline: 'Packed Into a Triangular Bay.',
        narrative:
          'To fit inside Quadrant 1 of the Lunar Module descent stage, Boeing engineers hinged the rover’s 3-meter aluminum chassis twice in the middle and folded all four wheels inward. On the Moon, a single astronaut pulled nylon deployment tapes to lower and snap the LRV onto the dust in less than twenty minutes.',
        historicalContext:
          'First driven by David Scott on July 31, 1971 beside Hadley Rille during Apollo 15.',
        archivalImage: '/images/exhibits/apollo_lrv.jpg',
        imageCaption: 'Apollo 15 LRV-1 fully deployed beside Mons Hadley Delta (NASA AS15-86-11603).',
        keyMetric: { label: 'Max Speed Recorded', value: '18 km/h (Apollo 17)' },
      },
      {
        id: 'lrv-ch-2',
        chapterNumber: '02',
        chapterTitle: 'PARKS FOR LIFTOFF',
        headline: 'Final Transmission From Taurus-Littrow.',
        narrative:
          'On all three J-missions, crews parked the LRV roughly 100 meters east of the Lunar Module before entering the cabin. From Earth, flight controllers remotely tilted the vehicle’s camera upward to record the gold ascent stage erupting off its lower frame, leaving the empty rover standing intact beside tire tracks.',
        historicalContext:
          'Apollo 17 astronauts Cernan and Schmitt famously repaired a broken rear fender on LRV-3 using laminated lunar maps and grey duct tape.',
        archivalImage: '/images/exhibits/apollo_lrv.jpg',
        imageCaption: 'Wire-mesh wheels and fender clearance at Hadley-Apennine (NASA AS15-86-11603).',
        keyMetric: { label: 'Combined Traverse', value: '90.5 km Across 3 Vehicles' },
      },
    ],
    legacy: {
      physicalCondition:
        'Three complete vehicles resting parked on dust-covered lunar soil, verified in LROC overhead imagery.',
      currentMilestone: 'Longest unrefueled electric surface exploration fleet of the 20th century.',
      scientificImpact: [
        'Enabled astronauts to reach deep rilles, volcanic vents, and distant highlands yielding genesis rocks and orange pyroclastic glass.',
        'Demonstrated four-wheel electric hub propulsion and wire-mesh mobility in hard vacuum.',
      ],
      whatRemainsToday:
        'LRV-1 (Hadley), LRV-2 (Descartes), and LRV-3 (Taurus-Littrow), parked facing their respective Lunar Module descent stages.',
      sources: [
        {
          title: 'NASA Technical Note: Apollo Lunar Roving Vehicle Operations Handbook',
          organization: 'NASA Marshall Space Flight Center',
          url: 'https://www.nasa.gov/history/alsj/LRV_OpsHandbook.html',
          catalogId: 'TM-X-LRV-1971',
        },
      ],
    },
    curatedQnA: [],
  },

  surveyor3: {
    id: 'surveyor3',
    name: 'SURVEYOR 3',
    callsign: 'Surveyor III Spacecraft',
    mission: 'Surveyor Program / Apollo 12 Site',
    year: '1967',
    destination: 'moon',
    category: 'Complete Spacecraft',
    modelType: 'Uncrewed Lunar Soft-Lander',
    landingDate: '20 April 1967',
    declarationDate: 'Visited by Apollo 12 Crew (19 Nov 1969)',
    operationalDuration: '14 days (First Lunar Day telemetry)',
    status: 'inactive',
    statusLabel: 'Inactive — Frame Remains; Camera & Scoop Returned to Earth',
    locationName: 'Oceanus Procellarum (Surveyor Crater)',
    heroImage: '/images/exhibits/surveyor3.jpg',
    heroCaption:
      'Apollo 12 astronaut Alan Bean beside Surveyor 3 inside Oceanus Procellarum, with Lunar Module Intrepid visible on the crater rim in the background, November 1969 (NASA AS12-48-7134).',
    heroNasaId: 'AS12-48-7134',
    has3DModel: false,
    coordinates: {
      latitude: '3.016° S',
      longitude: '23.418° W',
      elevation: 'Inside 200 m Crater Slope',
      planetaryRegion: 'Oceanus Procellarum, The Moon',
      worldPosition: [0, 0, 0],
    },
    brief: 'A robotic scout visited by humans two years later.',
    shortDescription:
      'A 1967 robotic lander whose dust-darkened frame was inspected and partially sampled by Apollo 12 astronauts in 1969.',
    tagline:
      'Surveyor 3 bounced twice into a shallow crater in Oceanus Procellarum—and remained intact until Apollo 12 landed just 163 meters away to examine how two and a half lunar years had aged Earth hardware.',
    guide: {
      explanation:
        'Surveyor 3 was a robotic lander that touched down inside a crater in Oceanus Procellarum in April 1967. Two and a half years later, Apollo 12 astronauts Pete Conrad and Alan Bean precision-landed nearby on foot to inspect it and study how the harsh lunar vacuum altered spacecraft metals and optics.',
      purpose:
        'Demonstrate pinpoint automated radar-guided lunar landing, capture panoramic photography, and test soil strength using an extendable surface sampler claw.',
      missionUsed: 'NASA Surveyor 3 (1967), later inspected on site by Apollo 12 (1969).',
      whyLeftBehind:
        'Surveyor 3 was a one-way robotic probe designed without ascent capability; Apollo 12 astronauts deliberately detached only its TV camera and sampler scoop to return to Earth.',
      presentStatus:
        'Inactive lander tripod frame remains tilted inside Surveyor Crater; its television camera and soil scoop now reside on Earth at the Smithsonian National Air and Space Museum.',
      spokenIntro:
        'Welcome. This is Surveyor 3, an uncrewed robotic lander that proved spacecraft could survive landing in lunar dust.',
      voiceScript:
        "Surveyor 3 was an automated robotic lander launched by NASA in April 1967 to explore Oceanus Procellarum, the Ocean of Storms. Its mission was to test soft-landing dynamics and sample the mechanical properties of lunar regolith prior to the Apollo crewed landings. Equipped with a high-resolution scanning television camera and a motorized surface sampler scoop, Surveyor 3 dug four trenches into the soil, proving the lunar surface had adequate bearing strength to support a human lander. Thirty-one months later, Apollo 12 astronauts Pete Conrad and Alan Bean landed within one hundred and sixty-three meters of Surveyor 3, inspecting the hardware and retrieving its camera and scoop to analyze the effects of long-term cosmic radiation. Surveyor 3 remains seated on the slope of Surveyor Crater, an enduring robotic pioneer that paved the way for human boots on the Moon.",
      keyFacts: [
        'Soft-landed in Oceanus Procellarum in April 1967',
        'Dug four exploratory soil trenches with a remote scoop',
        'Inspected and sampled in person by Apollo 12 astronauts in 1969',
      ],
    },
    components: [
      {
        id: 'surv3-frame',
        name: 'Tubular Aluminum Tripod Frame',
        category: 'Hardware Component',
        remainsOnSite: true,
        siteNote: 'Remains resting at a 12-degree tilt inside Surveyor Crater.',
        description:
          'Lightweight open-truss spaceframe originally painted white; astronauts observed it had darkened to tan-brown from solar radiation and dust blasting during Apollo 12’s touchdown.',
        guideExplanation:
          'This tubular frame stayed anchored inside the crater. Even its paint noticeably tanned after 31 months of unfiltered solar ultraviolet exposure and Apollo 12 exhaust dust.',
        voiceScript:
          'This tubular aluminum tripod frame remains resting at a twelve-degree tilt inside Surveyor Crater. Astronauts observed that its white thermal paint had turned tan-brown after thirty-one months of harsh solar ultraviolet exposure.',
      },
      {
        id: 'surv3-camera',
        name: 'Mirror-Scan Television Camera (Removed)',
        category: 'Scientific Instrument',
        remainsOnSite: false,
        siteNote: 'Detached by Apollo 12 crew on 19 Nov 1969; displayed at Smithsonian NASM.',
        description:
          '200/600-line vidicon camera that beamed 6,315 images during 1967 before freezing; returned to Earth so engineers could test micrometeorite impacts and vacuum fatigue.',
        guideExplanation:
          'Note: Surveyor 3’s famous TV camera is NOT on the Moon today—Pete Conrad and Alan Bean unbolted it with cable cutters and brought it home aboard Intrepid.',
        voiceScript:
          'Notice that the television camera is no longer attached. Pete Conrad and Alan Bean cut its electrical cables and unbolted the housing, carrying it back to Earth for microbiological and materials analysis.',
      },
      {
        id: 'surv3-scoop',
        name: 'Soil Mechanics Surface Sampler (Removed)',
        category: 'Scientific Instrument',
        remainsOnSite: false,
        siteNote: 'Detached and returned by Apollo 12 crew.',
        description:
          'Pantograph robotic arm and scoop that dug four test trenches in 1967, proving lunar soil could bear human astronauts and heavy Lunar Modules.',
        guideExplanation:
          'This telescoping digging claw gave NASA confidence that lunar soil would not swallow Apollo astronauts; Apollo 12 brought the scoop arm home for metallurgical inspection.',
        voiceScript:
          'This motorized pantograph arm and scoop dug four trenches into Oceanus Procellarum, proving lunar dust could bear the weight of heavy spacecraft. Apollo 12 brought the scoop back to Earth for metallurgical study.',
      },
      {
        id: 'surv3-solar',
        name: 'Planar Antenna & Solar Mast',
        category: 'Hardware Component',
        remainsOnSite: true,
        siteNote: 'Still mounted upright atop Surveyor 3’s mast.',
        description:
          'Dual-axis steerable solar array and flat high-gain planar antenna perched atop the central mast.',
        guideExplanation:
          'The tall flat solar wing and planar communications panel remain perched atop Surveyor 3’s tripod frame in Oceanus Procellarum.',
        voiceScript:
          'Perched atop the central mast are the planar high-gain communications antenna and solar array, which tracked the Sun across fourteen Earth days of blistering heat before the freezing lunar night set in.',
      },
    ],
    specs: {
      mass: '302 kg landed mass',
      powerSource: 'Single steerable solar array panel + silver-zinc battery',
      communication: 'Planar high-gain S-band array & two omnidirectional antennas',
      primaryInstruments: [
        '6,315-frame Survey Television Camera (returned by Apollo 12)',
        'Soil Mechanics Surface Sampler Claw (returned by Apollo 12)',
        'Three strain-gauged honeycomb footpads (on site)',
      ],
    },
    storyChapters: [
      {
        id: 'surv3-ch-1',
        chapterNumber: '01',
        chapterTitle: 'TWO BOUNCES IN PROCELLARUM',
        headline: 'Engine Cutoff Error Before Touchdown.',
        narrative:
          'On April 20, 1967, deceptive reflections from bright rocks confused Surveyor 3’s descent radar, preventing vernier engines from cutting off on initial contact. The probe hopped upward twice across the inner wall of a 200-meter crater before coming to rest safely upright after remote command cutoff.',
        historicalContext:
          'Across two weeks of operation, it dug four trenches and captured dramatic views including a solar eclipse by Earth.',
        archivalImage: '/images/exhibits/surveyor3.jpg',
        imageCaption: 'Surveyor 3 resting on the inner wall of Surveyor Crater (NASA AS12-48-7134).',
        keyMetric: { label: 'Surface Images', value: '6,315 Transmitted' },
      },
      {
        id: 'surv3-ch-2',
        chapterNumber: '02',
        chapterTitle: 'THE RETURN VISIT',
        headline: 'Intrepid Lands 163 Meters Away.',
        narrative:
          'To test pinpoint lunar landing accuracy before future highland missions, Apollo 12 targeted Surveyor 3’s exact crater. On November 19, 1969, Pete Conrad and Alan Bean walked down the slope, photographed Intrepid silhouetted behind their 1967 predecessor, and retrieved hardware components for materials-science laboratories on Earth.',
        historicalContext:
          'Remains the only time in spaceflight history that humans walked up to an uncrewed lander from an earlier mission on another world.',
        archivalImage: '/images/exhibits/surveyor3.jpg',
        imageCaption: 'Alan Bean inspecting Surveyor 3 with Apollo 12 Intrepid on the horizon (NASA AS12-48-7134).',
        keyMetric: { label: 'Apollo 12 Distance', value: '163 Meters Away' },
      },
    ],
    legacy: {
      physicalCondition:
        'Tubular aluminum chassis, footpads, crushable blocks, and upper mast remain intact inside Surveyor Crater.',
      currentMilestone: 'Only uncrewed planetary probe ever inspected and sampled in person by astronauts.',
      scientificImpact: [
        'Proved lunar surface bearing strength could safely support crewed Lunar Modules.',
        'Returned components revealed critical data on long-term thermal cycling, vacuum welding, and solar radiation effects.',
      ],
      whatRemainsToday:
        'Surveyor 3 tripod lander body, mast, and planar arrays remain in Surveyor Crater; TV camera and sampler scoop are archived in museums on Earth.',
      sources: [
        {
          title: 'NASA NSSDCA Master Catalog: Surveyor 3',
          organization: 'NASA Space Science Data Coordinated Archive',
          url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A',
          catalogId: 'NSSDC-ID: 1967-035A',
        },
      ],
    },
    curatedQnA: [],
  },

  apollo_alsep: {
    id: 'apollo_alsep',
    name: 'APOLLO ALSEP EXPERIMENTS',
    callsign: 'ALSEP Stations (Apollo 12, 14, 15, 16, 17)',
    mission: 'Apollo 12 – 17',
    year: '1969',
    destination: 'moon',
    category: 'Scientific Instrument',
    modelType: 'Nuclear-Powered Geophysical Observatory Network',
    landingDate: '19 November 1969 (First ALSEP Network Node)',
    declarationDate: 'Telemetry Shut Down 30 September 1977',
    operationalDuration: 'Up to 8 years continuous (Apollo 12–17 network)',
    status: 'inactive',
    statusLabel: 'Inactive Electronics — Passive Laser Mirrors Still Tracked',
    locationName: 'Five Lunar Sites (Procellarum, Fra Mauro, Hadley, Descartes, Littrow)',
    heroImage: '/images/exhibits/apollo_alsep.jpg',
    heroCaption:
      'Apollo 12 ALSEP geophysical array deployed in Oceanus Procellarum showing Central Station, Solar Wind Spectrometer, and passive seismometer thermal shroud (NASA AS12-47-6918).',
    heroNasaId: 'AS12-47-6918',
    has3DModel: false,
    coordinates: {
      latitude: '3.009° S (Apollo 12 ALSEP)',
      longitude: '23.425° W',
      elevation: 'Oceanus Procellarum',
      planetaryRegion: 'Five Geophysical Nodes Across Lunar Near Side',
      worldPosition: [0, 0, 0],
    },
    brief: 'A silent geophysical network that listened to the Moon’s interior.',
    shortDescription:
      'Five nuclear-powered instrument arrays that transmitted moonquake, magnetometer, and solar wind measurements for nearly eight years.',
    tagline:
      'Wired across lunar dust like silver and copper ribbons, the Apollo Lunar Surface Experiments Packages transformed brief human visits into a multi-year planetary observatory.',
    guide: {
      explanation:
        'Deployed by Apollo 12, 14, 15, 16, and 17 crews about 100 meters away from their landers, each ALSEP station carried seismometers, magnetometers, and heat-flow probes linked to a central telemetry hub powered by plutonium radioisotope generators.',
      purpose:
        'Measure deep moonquakes, crustal thickness, magnetic anomalies, sparse lunar atmosphere composition, and internal heat escaping the Moon long after astronauts departed.',
      missionUsed: 'Apollo 12, 14, 15, 16, and 17 (building upon Apollo 11’s simpler EASEP kit).',
      whyLeftBehind:
        'ALSEP instruments were designed specifically to remain behind and operate unattended across freezing two-week lunar nights until radio support ended in 1977.',
      presentStatus:
        'Active powered transmitters are shut down; however, optical Laser Ranging Retroreflectors (LRRR) from Apollo 11, 14, and 15 still return Earth laser pulses today.',
      spokenIntro:
        "Welcome! You're looking at the Apollo Lunar Surface Experiments Package, commonly known as ALSEP.",
      voiceScript:
        "Welcome! You're looking at the Apollo Lunar Surface Experiments Package, commonly known as ALSEP. NASA astronauts deployed these scientific instruments across several Apollo landing sites between 1969 and 1972. Their purpose was to turn the Moon into a long-term scientific laboratory. Powered by nuclear SNAP-27 radioisotope thermoelectric generators, each package operated independently of the spacecraft, transmitting continuous environmental data back to Earth. They measured moonquakes, magnetic fields and heat flowing from beneath the lunar surface. Even after the astronauts returned to Earth, these instruments continued collecting valuable scientific data. Together, they logged more than twelve thousand moonquakes, proved the Moon has a partially molten core, and functioned across eight years of unattended lunar nights. When NASA turned off telemetry in September 1977, the stations remained on the surface. Today, five ALSEP arrays remain on the Moon, and their passive laser retroreflector mirrors still reflect laser beams from Earth telescopes.",
      keyFacts: [
        'Continuous scientific network operated from 1969 to 1977',
        'Recorded over 12,000 seismic events, revealing lunar core structure',
        'Five stations remain permanently at Apollo 12, 14, 15, 16, and 17 sites',
      ],
    },
    components: [
      {
        id: 'alsep-central',
        name: 'Central Telemetry Station & Helical Antenna',
        category: 'Scientific Instrument',
        remainsOnSite: true,
        siteNote: 'Five stations remain anchored at their Apollo 12–17 sites.',
        description:
          'Thermal-controlled box collecting data ribbons from surrounding experiments and transmitting continuous S-band telemetry back to NASA tracking stations.',
        guideExplanation:
          'Every sensor wired into this central computer hub via flat Kapton-coated ribbon cables, beaming continuous seismic waves to Earth for up to eight years.',
        voiceScript:
          'This is the Central Telemetry Station. Every peripheral instrument connected into this aluminum hub via flat Kapton-coated ribbon cables, routing seismic signals and temperature telemetry back to NASA ground stations.',
        hotspot: { x: 33, y: 64 },
      },
      {
        id: 'alsep-rtg',
        name: 'SNAP-27 Radioisotope Generator (RTG)',
        category: 'Hardware Component',
        remainsOnSite: true,
        siteNote: 'Fuel capsule remains seated vertically beside each station.',
        description:
          'Plutonium-238 thermoelectric generator producing ~70 watts continuously without sunlight—critical during 14-day−170°C lunar nights.',
        guideExplanation:
          'Unlike Apollo 11’s solar panels, SNAP-27 used heat from Plutonium-238 decay so science never paused during freezing two-week lunar nights.',
        voiceScript:
          'The SNAP-27 generator was fueled by a capsule of Plutonium-238. Producing seventy watts of continuous electrical power from radioactive decay heat, it kept ALSEP alive through two-week minus one-hundred-and-seventy degree lunar nights.',
        hotspot: { x: 26, y: 58 },
      },
      {
        id: 'alsep-pse',
        name: 'Passive Seismic Experiment (PSE)',
        category: 'Scientific Instrument',
        remainsOnSite: true,
        siteNote: 'Protected beneath reflective Mylar thermal skirts.',
        description:
          'Sensitive seismometers that recorded over 12,000 seismic events—revealing deep tidal moonquakes, meteorite strikes, and a small partially molten core.',
        guideExplanation:
          'Spread beneath reflective thermal foil skirts to stop thermal expansion clicks, these seismometers proved the Moon rings like a bell when struck by meteorites.',
        voiceScript:
          'Spread beneath a reflective thermal skirt to prevent metal expansion clicks, this seismometer detected vibrations as faint as a human heartbeat, proving the Moon possesses a layered crust, mantle, and metallic core.',
        hotspot: { x: 30, y: 68 },
      },
      {
        id: 'alsep-lrrr',
        name: 'Laser Ranging Retroreflector (LRRR)',
        category: 'Scientific Instrument',
        remainsOnSite: true,
        siteNote: 'Operational passively at Apollo 11, 14, and 15 sites today.',
        description:
          'Array of precision fused-silica corner cubes that bounce laser pulses directly back to terrestrial telescopes with millimeter precision.',
        guideExplanation:
          'Requiring zero electricity, these glass corner-cube mirrors still tell astronomers that the Moon drifts away from Earth by roughly 3.8 centimeters every year.',
        voiceScript:
          'Requiring zero electrical power, this tray of one hundred fused-silica corner cube prisms reflects laser pulses directly back to Earth observatory telescopes, proving the Moon recedes from Earth by three point eight centimeters each year.',
        hotspot: { x: 34, y: 60 },
      },
    ],
    specs: {
      mass: '~130 kg per full deployed ALSEP suite',
      powerSource: 'SNAP-27 Plutonium-238 RTG (~70 W electrical output)',
      communication: 'Helical S-band antenna connected to Manned Space Flight Network',
      primaryInstruments: [
        'Passive & Active Seismic Experiments',
        'Lunar Surface Magnetometer & Heat Flow Probe',
        'Suprathermal Ion & Cold Cathode Ionization Gauges',
      ],
    },
    storyChapters: [
      {
        id: 'alsep-ch-1',
        chapterNumber: '01',
        chapterTitle: 'WHEN ASTRONAUTS LEFT',
        headline: 'Science Without Crews.',
        narrative:
          'Each Apollo crew spent hours unspooling flat orange Kapton cables across rocky terrain to position seismometers and heat probes safely beyond Lunar Module liftoff blast zones. Powered by plutonium decay heat, the network outlasted the entire Apollo flight era.',
        historicalContext:
          'By Apollo 15, scientists could triangulate seismic waves across multiple widely separated lunar latitudes simultaneously.',
        archivalImage: '/images/exhibits/apollo_alsep.jpg',
        imageCaption: 'Deployed Apollo 12 ALSEP instruments linked by flat telemetry ribbons (NASA AS12-47-6918).',
        keyMetric: { label: 'Continuous Network Run', value: '8 Years (1969–1977)' },
      },
      {
        id: 'alsep-ch-2',
        chapterNumber: '02',
        chapterTitle: 'PASSIVE ETERNITY',
        headline: 'Still Answering Earth Lasers.',
        narrative:
          'Budget constraints caused NASA to switch off ALSEP radio commanding on September 30, 1977. Yet the optical retroreflector mirrors deployed at Apollo 11, 14, and 15 remain actively interrogated by Earth observatories, continuing General Relativity and Earth-Moon tidal studies into the 21st century.',
        historicalContext:
          'Recorded over 12,000 seismic signals, mapping lunar crustal thickness at ~40–60 km.',
        archivalImage: '/images/exhibits/apollo_alsep.jpg',
        imageCaption: 'Apollo 12 surface station bathed in low-angle morning sunlight (NASA AS12-47-6918).',
        keyMetric: { label: 'Seismic Events Logged', value: '12,000+ Signals' },
      },
    ],
    legacy: {
      physicalCondition:
        'Station chassis, SNAP-27 cylinders, cable ribbons, and mirror arrays remain undisturbed at all five Apollo 12–17 landing coordinates.',
      currentMilestone:
        'Laser Ranging Retroreflectors represent the longest continuously used scientific experiments of the Space Age.',
      scientificImpact: [
        'Mapped internal crustal structure, mantle velocity, and deep moonquakes triggered by Earth tidal stress.',
        'Measured Earth-Moon separation drift (~3.8 cm/year) via millimeter-accurate laser ranging.',
      ],
      whatRemainsToday:
        'Five central stations, plutonium generator casks, magnetometers, thermal-shielded seismometers, and passive optical mirrors.',
      sources: [
        {
          title: 'NASA History Series: Apollo Scientific Experiments Final Report',
          organization: 'NASA Lyndon B. Johnson Space Center',
          url: 'https://www.nasa.gov/history/alsj/alsep.html',
          catalogId: 'NASA-SP-368',
        },
      ],
    },
    curatedQnA: [],
  },

  // =========================================================================
  // MARS EXHIBITION (01 - 04)
  // =========================================================================

  sojourner: {
    id: 'sojourner',
    name: 'SOJOURNER',
    callsign: 'Mars Pathfinder Microrover (MFEX)',
    mission: 'Mars Pathfinder',
    year: '1997',
    destination: 'mars',
    category: 'Complete Spacecraft',
    modelType: 'Six-Wheel Solar Robotic Microrover',
    landingDate: '4 July 1997',
    declarationDate: 'Last Signal 27 September 1997',
    operationalDuration: '83 Sols (Designed for 7 Sols)',
    distanceTraveled: '~100 m (Never exceeding 12 m from lander)',
    status: 'inactive',
    statusLabel: 'Inactive — Resting Beside Carl Sagan Memorial Station',
    locationName: 'Ares Vallis Floodplain',
    heroImage: '/images/exhibits/sojourner_yogi.jpg',
    heroCaption:
      'Sojourner using its Alpha Proton X-Ray Spectrometer to analyze rocks in Ares Vallis with wheel ruts pressed into ancient flood soil (NASA PIA01122).',
    heroNasaId: 'PIA01122',
    galleryImages: [
      {
        src: '/images/exhibits/sojourner_yogi.jpg',
        caption: 'Sojourner parked against Martian rocks during Pathfinder operations (NASA PIA01122).',
        nasaId: 'PIA01122',
      },
      {
        src: '/images/exhibits/sojourner_ramp.jpg',
        caption: 'Sojourner perched on the Pathfinder lander petal ramp surrounded by deflated landing airbags (NASA PIA00621).',
        nasaId: 'PIA00621',
      },
    ],
    has3DModel: false,
    coordinates: {
      latitude: '19.13° N',
      longitude: '33.22° W',
      elevation: '−3,682 m',
      planetaryRegion: 'Ares Vallis, Chryse Planitia, Mars',
      worldPosition: [0, 0, 0],
    },
    brief: 'The microwave-sized pioneer that put humanity’s first wheels on Mars.',
    shortDescription:
      'The 10.6 kg Mars Pathfinder microrover that proved autonomous wheeled mobility could inspect rocks beyond Earth.',
    tagline:
      'No larger than a microwave oven, Sojourner rolled down Pathfinder’s petal ramp onto Ares Vallis on July 5, 1997—pioneering the rocker-bogie suspension used by every Mars rover since.',
    guide: {
      explanation:
        'Sojourner was the first rover to drive on another planet. Launched aboard NASA’s Mars Pathfinder in 1996, it touched down cushioned inside giant airbags on July 4, 1997, then roamed around its base lander analyzing rocks along an ancient Martian flood plain.',
      purpose:
        'Demonstrate low-cost autonomous mobility, hazard avoidance via laser striping, and rock chemistry measurement using an onboard Alpha Proton X-Ray Spectrometer.',
      missionUsed: 'NASA Mars Pathfinder (1997).',
      whyLeftBehind:
        'Sojourner depended entirely on the stationary Carl Sagan Memorial Station lander to relay telemetry back to Earth. Once the lander’s battery failed in cold temperatures on September 27, 1997, communication ceased and Sojourner likely circled quietly beside its base until power ended.',
      presentStatus:
        'Non-operational and intact near the Pathfinder lander in Ares Vallis; its cruise entry heat shield and parachute impacted separately further downrange.',
      spokenIntro:
        "Welcome to Mars. You are examining Sojourner, humanity's first successful roving explorer on the Red Planet.",
      voiceScript:
        "Sojourner was a pioneering ten-point-six kilogram microrover that touched down inside Ares Vallis on July 4th, 1997, as part of the Mars Pathfinder mission. Its purpose was to demonstrate that low-cost, semi-autonomous wheeled mobility was possible on an alien world. Built around an ingenious six-wheeled rocker-bogie suspension system and solar arrays, Sojourner carried an Alpha Particle X-ray Spectrometer to analyze the chemical composition of Martian rocks and soil. Designed for a baseline mission of just seven days, the plucky rover survived for eighty-three Martian sols, traveling about one hundred meters and analyzing major rocks like Barnacle Bill and Yogi. It was left on the surface when the Pathfinder base station battery exhausted in late 1997. Sojourner remains resting quietly beside the Pathfinder lander on the boulder-strewn floodplains of Ares Vallis.",
      keyFacts: [
        'First wheeled vehicle on Mars, landed July 4, 1997',
        'Demonstrated rocker-bogie suspension used by all future Mars rovers',
        'Rests intact beside Carl Sagan Memorial Station in Ares Vallis',
      ],
    },
    components: [
      {
        id: 'soj-chassis',
        name: 'Rocker-Bogie Chassis & Top Solar Panel',
        category: 'Complete Spacecraft',
        remainsOnSite: true,
        siteNote: 'Stationary within ~12 m of Pathfinder lander.',
        description:
          'Lightweight articulated titanium suspension keeping all six 13 cm cleated aluminum wheels planted over uneven rocks, topped by a 0.22 m² GaAs solar deck.',
        guideExplanation:
          'This hinged rocker-bogie frame prevented the tiny 10.6 kg rover from overturning over boulders—engineering lineage carried directly onto Spirit, Opportunity, Curiosity, and Perseverance.',
        voiceScript:
          'This hinged rocker-bogie chassis kept all six cleated aluminum wheels firmly planted over jagged rocks without springs, an architectural breakthrough adopted by Spirit, Opportunity, Curiosity, and Perseverance.',
      },
      {
        id: 'soj-apxs',
        name: 'Alpha Proton X-Ray Spectrometer (APXS)',
        category: 'Scientific Instrument',
        remainsOnSite: true,
        siteNote: 'Rear-mounted on Sojourner’s deployable arm.',
        description:
          'Contact sensor that backed up against rocks like Barnacle Bill and Yogi to measure elemental composition across basaltic and silica-rich specimens.',
        guideExplanation:
          'Sojourner backed carefully into boulders so this rear turret sensor could measure their chemical elements over hours of integration.',
        voiceScript:
          'Mounted on a deployable rear arm, the Alpha Proton X-Ray Spectrometer pressed directly against volcanic boulders to reveal high silicon levels, indicating complex volcanic processes on early Mars.',
      },
      {
        id: 'soj-airbags',
        name: 'Pathfinder Lander & Deflated Airbags',
        category: 'Landing Equipment',
        remainsOnSite: true,
        siteNote: 'Central three-petal base platform within meters of Sojourner.',
        description:
          'Tetrahedral lander later renamed Carl Sagan Memorial Station, surrounded by four clustered Vectran airbag lobes that absorbed at least 15 bounces upon landing.',
        guideExplanation:
          'To cut cost, Pathfinder skipped heavy retrorockets at final touchdown: deflated beige airbag cushions still drape around the three triangular lander petals nearby.',
        voiceScript:
          'Surrounding the three-petal Pathfinder lander are deflated Vectran airbags. They cushioned the spacecraft through fifteen violent bounces across the Martian floodplain at over fifty kilometers per hour.',
      },
      {
        id: 'soj-edl',
        name: 'Heat Shield, Backshell & Parachute (Separated)',
        category: 'Landing Equipment',
        remainsOnSite: false,
        siteNote: 'Jettisoned mid-air during entry; located roughly 1 km from landing site.',
        description:
          'Carbon-phenolic atmospheric heat shield and 12.7 m supersonic parachute shed prior to airbag inflation.',
        guideExplanation:
          'Accurate geography check: Pathfinder’s heat shield and parachute fell clear prior to touchdown, resting over a kilometer away rather than beside Sojourner.',
      },
    ],
    specs: {
      mass: '10.6 kg (23 lb) rover mass (lander ~360 kg)',
      powerSource: 'Gallium-arsenide solar panel (~16 W peak) + non-rechargeable LiSOCl2 backup',
      communication: 'UHF 9,600-baud link via Carl Sagan Memorial Station lander',
      primaryInstruments: [
        'Alpha Proton X-Ray Spectrometer (APXS)',
        'Two monochrome forward hazard cameras & rear color camera',
        'Wheel abrasion & materials adherence experiments',
      ],
    },
    storyChapters: [
      {
        id: 'soj-ch-1',
        chapterNumber: '01',
        chapterTitle: 'AIRBAG BOUNCE',
        headline: 'Faster, Better, Cheaper on Ares Vallis.',
        narrative:
          'Designed under JPL’s constrained discovery philosophy, Mars Pathfinder plummeted into the thin atmosphere inside a protective aeroshell, unfurled a parachute, fired three brief solid rockets at 100 meters altitude, and hit Mars cocooned in pressurized airbags—bouncing 15 meters high across the ancient Ares Vallis outflow channel.',
        historicalContext:
          'The landing site confirmed rounded pebbles and imbricated boulders swept together by catastrophic ancient floods.',
        archivalImage: '/images/exhibits/sojourner_ramp.jpg',
        imageCaption: 'Sojourner poised above deflated airbags on Pathfinder’s ramp (NASA PIA00621).',
        keyMetric: { label: 'Rover Weight', value: '10.6 Kilograms' },
      },
      {
        id: 'soj-ch-2',
        chapterNumber: '02',
        chapterTitle: 'EIGHTY-THREE SOLS',
        headline: 'Outliving Design by Twelve Times.',
        narrative:
          'Originally slated for only seven Martian days, Sojourner operated across 83 sols—measuring silica-rich andesite rocks, capturing soil cohesion tests, and testing autonomous pathfinding around hazards until the base station transmitter fell silent in late September 1997.',
        historicalContext:
          'Sojourner’s autonomy algorithms taught future JPL teams how to let rovers avoid Martian hazards between daily command uploads.',
        archivalImage: '/images/exhibits/sojourner_yogi.jpg',
        imageCaption: 'Sojourner wheel ruts pressed into Ares Vallis regolith (NASA PIA01122).',
        keyMetric: { label: 'Design vs Actual', value: '7 Sols → 83 Sols' },
      },
    ],
    legacy: {
      physicalCondition:
        'Stationary in Ares Vallis alongside the Carl Sagan Memorial Station lander and deflated Vectran airbags.',
      currentMilestone: 'Proved autonomous wheeled robotics could survive and navigate Mars.',
      scientificImpact: [
        'Demonstrated ancient catastrophic flooding in Ares Vallis via sedimentary cobbles and conglomerate ridges.',
        'Established the rocker-bogie wheel architecture adopted by all subsequent NASA Mars rovers.',
      ],
      whatRemainsToday:
        'Sojourner microrover, folded lander petals, weather mast, and deflated airbags in Ares Vallis; heat shield & parachute lie separately ~1 km away.',
      sources: [
        {
          title: 'NASA JPL: Mars Pathfinder & Sojourner Rover Mission Overview',
          organization: 'NASA / JPL-Caltech',
          url: 'https://science.nasa.gov/mission/mars-pathfinder/',
          catalogId: 'NSSDC-ID: 1996-068A',
        },
      ],
    },
    curatedQnA: [],
  },

  spirit: {
    id: 'spirit',
    name: 'SPIRIT',
    callsign: 'MER-A (Mars Exploration Rover A)',
    mission: 'Mars Exploration Rover Program',
    year: '2004',
    destination: 'mars',
    category: 'Complete Spacecraft',
    modelType: 'Solar-Powered Robotic Field Geologist',
    landingDate: '4 January 2004',
    declarationDate: '25 May 2011 (Last Signal 22 March 2010)',
    operationalDuration: '6 years, 79 days (2,210 sols)',
    distanceTraveled: '7.73 km (4.80 miles)',
    status: 'inactive',
    statusLabel: 'Inactive — Stationary Platform at Troy, Gusev Crater',
    locationName: 'Gusev Crater (West of Home Plate Plateau)',
    heroImage: '/images/exhibits/mer_cleanroom.jpg',
    heroCaption:
      'Mars Exploration Rover hardware configuration identical to twin geologists Spirit (MER-A) and Opportunity (MER-B) showing stereo Pancam mast, solar deck, and six-wheel rocker-bogie mobility (NASA JPL).',
    heroNasaId: 'PIA04413',
    galleryImages: [
      {
        src: '/images/exhibits/mer_cleanroom.jpg',
        caption: 'Six-wheel MER rover engineering configuration with Pancam mast and robotic arm (NASA JPL).',
        nasaId: 'PIA04413',
      },
      {
        src: '/images/exhibits/spirit_hero.jpg',
        caption: 'Volcanic basalt boulder Adirondack photographed by Spirit in Gusev Crater (NASA PIA05104).',
        nasaId: 'PIA05104',
      },
    ],
    has3DModel: true,
    coordinates: {
      latitude: '14.5718° S',
      longitude: '175.4785° E',
      elevation: '−1,920 m',
      planetaryRegion: 'Gusev Crater, Mars',
      worldPosition: [-16, 0.6, -14],
    },
    brief: 'The rover that dragged a seized wheel into volcanic hot-spring silica.',
    shortDescription:
      'Landed in Gusev Crater, climbed Husband Hill, and exposed 90% pure hydrothermal silica by driving backwards on five working wheels.',
    tagline:
      'After Gusev’s crater floor proved unexpectedly volcanic, Spirit drove kilometers into the Columbia Hills—turning mechanical failure into its defining proof of ancient Martian steam vents.',
    guide: {
      explanation:
        'Spirit (MER-A) landed in Gusev Crater three weeks ahead of its twin Opportunity. Built to drive only 90 Martian sols, it operated for over six years, becoming the first robot to summit a hill on another planet before becoming trapped in soft sulfate sand.',
      purpose:
        'Examine rocks and soils inside Gusev Crater for geological evidence of past liquid water and hydrothermal environments.',
      missionUsed: 'NASA Mars Exploration Rover A (Spirit), launched 2003, landed January 2004.',
      whyLeftBehind:
        'In May 2009, Spirit’s wheels broke through a fragile soil crust at a spot called "Troy," tilting away from the winter Sun. Without enough solar wattage to run survival heaters, Spirit froze during Martian winter after its final contact in March 2010.',
      presentStatus:
        'Non-operational stationary station parked in sulfate sand near Home Plate; its entry lander and airbags rest 7.7 km back across Gusev plains.',
      spokenIntro:
        'Welcome! This is Spirit, Mars Exploration Rover A, an iconic geological investigator that conquered Martian mountains.',
      voiceScript:
        "Spirit was launched by NASA in 2003 and landed in January 2004 inside Gusev Crater, a massive ancient impact basin believed to have once held a lake. Its primary mission was to search for geological evidence of past liquid water. Spirit possessed a suite of high-resolution panoramic cameras, miniature thermal emission spectrometers, and a robotic arm with a rock abrasion tool and Mössbauer spectrometer. Designed for just ninety Martian days, Spirit demonstrated extraordinary resilience, climbing over one hundred vertical meters to the summit of Husband Hill and discovering silica-rich deposits formed by ancient hot springs and hydrothermal vents. In 2009, Spirit became immobilized in a hidden soft-sand trap named Troy. After surviving the harsh Martian winter of 2010, communications ceased. Spirit remains parked in the sands of Gusev Crater as an immortal testament to robotic exploration.",
      keyFacts: [
        'Operated for 6 years across 7.73 kilometers of Martian terrain',
        'Discovered pure silica deposits indicating ancient hydrothermal vents',
        'Stationary resting place at Troy in Gusev Crater',
      ],
    },
    components: [
      {
        id: 'spirit-chassis',
        name: 'MER-A Warm Electronics Box & Solar Wings',
        category: 'Complete Spacecraft',
        remainsOnSite: true,
        siteNote: 'Embedded upright at "Troy" on the western edge of Home Plate.',
        description:
          'Gold-foil insulated core housing flight computers and lithium batteries beneath deployable solar wings generating ~140 W when dust-free.',
        guideExplanation:
          'Trapped in loose sulfates tilted slightly south away from the low winter sun, these solar wings could no longer keep Spirit’s internal heaters alive.',
        voiceScript:
          "This is Spirit's main warm electronics box and solar wing array. Insulated with gold-foil aerogel and resistance heaters, this core kept delicate computers alive through freezing minus-one-hundred-degree Martian nights.",
      },
      {
        id: 'spirit-wheel',
        name: 'Seized Right-Front Wheel Actuator',
        category: 'Hardware Component',
        remainsOnSite: true,
        siteNote: 'Locked in position since March 2006 at Home Plate.',
        description:
          'When this wheel seized in 2006, operators drove Spirit in reverse, using the immobile wheel as a geological trencher that uncovered pure silica.',
        guideExplanation:
          'That broken wheel inadvertently wrote history: dragging backwards tore open bright white soil rich in 90% pure amorphous silica from ancient hot springs.',
        voiceScript:
          'This right-front wheel seized in 2006. Engineers drove Spirit backwards, dragging the locked wheel through the soil. That dragged wheel churned up bright white soil of ninety percent pure silica, proving volcanic hot springs once bubbled on Mars.',
      },
      {
        id: 'spirit-arm',
        name: 'Pancam Mast, APXS & Rock Abrasion Tool',
        category: 'Scientific Instrument',
        remainsOnSite: true,
        siteNote: 'Attached directly to Spirit’s rover frame.',
        description:
          '1.4-meter stereo camera mast paired with a 5-joint robotic turret carrying grinders, spectrometers, and micro-imagers.',
        guideExplanation:
          'These instruments discovered carbonate outcrops at Comanche and confirmed hot-spring silica deposits favorable for ancient microbial life.',
        voiceScript:
          'Perched on the five-joint robotic instrument arm, the Rock Abrasion Tool ground into volcanic rocks while spectrometers measured mineral iron states, proving ancient water had chemically altered the bedrock.',
      },
      {
        id: 'spirit-edl',
        name: 'Columbia Memorial Station Lander & Aeroshell',
        category: 'Landing Equipment',
        remainsOnSite: false,
        siteNote: 'Lander sits ~7.7 km northwest; heat shield and parachute crashed separately.',
        description:
          'Three-petal airbag lander platform left behind when Spirit rolled onto Gusev plains, while its heat shield and backshell struck kilometers away during descent.',
        guideExplanation:
          'Spirit’s landing platform remains kilometers behind at its touchdown site, separate from the heat shield and parachute shed during atmospheric entry.',
      },
    ],
    specs: {
      mass: '185 kg (408 lb) rover mass',
      powerSource: 'Triple-junction GaInP/GaAs solar wings',
      communication: 'Steerable X-band high-gain dish & Odyssey UHF relay',
      primaryInstruments: [
        'Pancam Stereo Cameras & Mini-TES Thermal Spectrometer',
        'Mössbauer Spectrometer & Alpha Particle X-Ray Spectrometer',
        'Rock Abrasion Tool (RAT) & Microscopic Imager',
      ],
    },
    storyChapters: [
      {
        id: 'spirit-ch-1',
        chapterNumber: '01',
        chapterTitle: 'VOLCANIC PLAINS',
        headline: 'First Footprints in Gusev Crater.',
        narrative:
          'Spirit touched down on January 4, 2004 inside the 166 km basin of Gusev Crater. Rather than exposed lake sediments, early traverses revealed dark basaltic lava flows—prompting drivers to steer kilometers southeast toward the older weathered ridges of the Columbia Hills.',
        historicalContext:
          'Over 18 months, Spirit climbed 107 vertical meters to reach the summit of Husband Hill.',
        archivalImage: '/images/exhibits/spirit_hero.jpg',
        imageCaption: 'Basalt boulders and regolith imaged by Spirit in Gusev Crater (NASA PIA05104).',
        keyMetric: { label: 'Vertical Climb', value: '107 m (Husband Hill)' },
      },
      {
        id: 'spirit-ch-2',
        chapterNumber: '02',
        chapterTitle: 'SILICA IN THE SAND',
        headline: 'A Frozen Wheel Finds Hot Springs.',
        narrative:
          'After its right-front wheel locked up in 2006, drivers steered Spirit backwards across Home Plate. The dragging wheel exposed blindingly bright soil—90% pure silica—indicating ancient volcanic steam or hot springs. Stuck permanently in soft sulfate sand at Troy in 2009, Spirit fell silent during Martian winter in March 2010.',
        historicalContext:
          'NASA concluded recovery attempts on May 25, 2011 after more than six years of discovery.',
        archivalImage: '/images/exhibits/mer_cleanroom.jpg',
        imageCaption: 'MER twin-rover hardware layout with Pancam mast and instrument arm (NASA JPL).',
        keyMetric: { label: 'Total Traverse', value: '7.73 Kilometers' },
      },
    ],
    legacy: {
      physicalCondition:
        'Stationary tilted platform embedded in fine sulfate dust at Troy, Gusev Crater.',
      currentMilestone: 'Summited Husband Hill and uncovered definitive hydrothermal silica.',
      scientificImpact: [
        'Discovered 90% pure amorphous silica formed around ancient volcanic steam vents or hot springs.',
        'Detected magnesium-iron carbonate outcrops pointing to neutral-pH water history.',
      ],
      whatRemainsToday:
        'Spirit rover resting in Gusev Crater sand; Columbia Memorial Station lander, heat shield, and parachute lie separately across the crater floor.',
      sources: [
        {
          title: 'NASA Science: Mars Exploration Rover Spirit Mission Archive',
          organization: 'NASA / JPL-Caltech',
          url: 'https://science.nasa.gov/mission/mer-spirit/',
          catalogId: 'NSSDC-ID: 2003-027A',
        },
      ],
    },
    curatedQnA: [],
  },

  opportunity: {
    id: 'opportunity',
    name: 'OPPORTUNITY',
    callsign: 'MER-B (Mars Exploration Rover B)',
    mission: 'Mars Exploration Rover Program',
    year: '2004',
    destination: 'mars',
    category: 'Complete Spacecraft',
    modelType: 'Long-Range Solar Robotic Rover',
    landingDate: '25 January 2004',
    declarationDate: '13 February 2019 (Last Signal 10 June 2018)',
    operationalDuration: '14 years, 138 days (5,111 sols)',
    distanceTraveled: '45.16 km (28.06 miles)',
    status: 'inactive',
    statusLabel: 'Inactive — Resting in Perseverance Valley, Endeavour Crater',
    locationName: 'Perseverance Valley, Endeavour Crater Rim',
    heroImage: '/images/exhibits/opportunity.jpg',
    heroCaption:
      'Close-up of Opportunity’s gold Kapton harness and cleats gripping layered sulfate bedrock along Meridiani Planum (NASA PIA03240).',
    heroNasaId: 'PIA03240',
    galleryImages: [
      {
        src: '/images/exhibits/opportunity.jpg',
        caption: 'Opportunity’s front wheel resting on ancient water-laid Meridiani bedrock (NASA PIA03240).',
        nasaId: 'PIA03240',
      },
      {
        src: '/images/exhibits/opp_heatshield_rock.jpg',
        caption: 'Iron-nickel meteorite "Heat Shield Rock" discovered beside Opportunity’s discarded entry heat shield on Sol 339 (NASA PIA07269).',
        nasaId: 'PIA07269',
      },
    ],
    has3DModel: true,
    coordinates: {
      latitude: '2.34° S',
      longitude: '354.67° E',
      elevation: '−1,440 m',
      planetaryRegion: 'Meridiani Planum, Mars',
      worldPosition: [0, 0.45, 0],
    },
    brief: 'A 90-day mission that drove a marathon across Mars.',
    shortDescription:
      'Traversed 45.16 km over fourteen years across Meridiani Planum, uncovering mineral veins and spherules left by ancient water.',
    tagline:
      'Designed for ninety sols, Opportunity crossed craters, weathered dust storms, inspected its own fallen heat shield, and proved habitable neutral-pH water once flowed beneath Mars.',
    guide: {
      spokenIntro:
        'Welcome to the story of Opportunity, NASA’s longest-running Mars Exploration Rover.',
      voiceScript:
        'Welcome! You are standing before Opportunity, designated MER-B, one of humanity’s greatest planetary explorers. Touching down inside Eagle Crater in Meridiani Planum on January 25th, 2004, Opportunity was engineered for a mere ninety-sol warranty. Instead, it journeyed across Mars for over fourteen years and 5,111 Martian sols. Powered by triple-junction gallium arsenide solar wings and guided by hazard avoidance cameras, Opportunity navigated 45.16 kilometers, setting the off-Earth wheeled distance record. Its robotic arm, equipped with a microscopic imager, alpha particle X-ray spectrometer, and rock abrasion tool, discovered microscopic hematite spherules nicknamed blueberries and gypsum mineral veins, confirming that sustained, drinkable, neutral-pH water once pooled across the Martian surface. Opportunity was left behind in Perseverance Valley on the rim of Endeavour Crater when a cataclysmic, planet-encircling dust storm in June 2018 blocked ninety-nine percent of solar illumination, exhausting its batteries. Today, Opportunity rests silently at an eleven-degree tilt on the crater rim, fully intact and preserved beneath red Martian dust, waiting as a monument to human persistence.',
      explanation:
        'Opportunity landed inside small Eagle Crater on January 25, 2004, directly beside stratified sedimentary rocks. Over 5,111 sols, it drove an unprecedented 45.16 kilometers before a global dust storm cut off sunlight to its solar panels in June 2018.',
      purpose:
        'Search Meridiani Planum for mineral and geological records of past liquid water across craters including Eagle, Endurance, Victoria, and Endeavour.',
      missionUsed: 'NASA Mars Exploration Rover B (Opportunity), 2004–2018.',
      whyLeftBehind:
        'An extreme planet-encircling dust storm in June 2018 blocked 99% of sunlight for months, draining Opportunity’s batteries and preventing recovery heaters from protecting its electronics.',
      presentStatus:
        'Non-operational intact chassis parked at an 11-degree tilt inside Perseverance Valley; its discarded heat shield, backshell, and Challenger Memorial Station lander remain kilometers back near Eagle Crater.',
      keyFacts: [
        'Drove an unprecedented 45.16 km (28.06 mi), the off-Earth wheeled distance record',
        'Survived 5,111 sols (over 14 years), 55 times longer than its 90-sol design baseline',
        'Discovered hematite blueberries and gypsum veins proving ancient neutral-pH water',
        'First spacecraft to inspect its own discarded entry heat shield on another world',
      ],
    },
    components: [
      {
        id: 'opp-rover',
        name: 'MER-B Rover Chassis & Solar Arrays',
        category: 'Complete Spacecraft',
        remainsOnSite: true,
        siteNote: 'Rests in Perseverance Valley on the rim of Endeavour Crater.',
        description:
          'Six-wheel solar geological laboratory holding the off-Earth wheeled distance record of 45.16 km across fourteen years.',
        voiceScript:
          'This is Opportunity’s rover chassis and solar array deck. Equipped with a rocker-bogie mobility suspension, six independently steered aluminum wheels, and triple-junction gallium-arsenide solar wings, it maintained power for fourteen years thanks to periodic atmospheric cleaning gusts.',
        guideExplanation:
          'Dust-cleaning Martian wind gusts periodically swept these solar panels clean, letting Opportunity survive 55 times longer than its original 90-sol guarantee.',
        hotspot: { x: 50, y: 55 },
      },
      {
        id: 'opp-idd',
        name: 'Instrument Arm (RAT, APXS, Mössbauer)',
        category: 'Scientific Instrument',
        remainsOnSite: true,
        siteNote: 'Extended forward toward Perseverance Valley bedrock.',
        description:
          'Five-degree-of-freedom arm that ground weathering rinds off rocks and identified hematite "blueberries" and gypsum veins.',
        voiceScript:
          'Here is the Instrument Deployment Device, a five-degree-of-freedom robotic arm. At the wrist, it carries a Rock Abrasion Tool to grind rock surfaces, a Microscopic Imager, and two spectrometers that detected gypsum veins formed by neutral-pH water.',
        guideExplanation:
          'At Endeavour Crater, this arm measured pure calcium sulfate gypsum veins—proof of neutral-pH, drinkable water passing through ancient fractures.',
        hotspot: { x: 74, y: 68 },
      },
      {
        id: 'opp-heatshield',
        name: 'Discarded Entry Heat Shield Wreckage',
        category: 'Landing Equipment',
        remainsOnSite: false,
        siteNote: 'Impacted ~300 m south of Eagle Crater—visited by Opportunity in Dec 2004, >20 km behind its final location.',
        description:
          'Phenolic ablative heat shield shed after atmospheric entry; fractured on impact onto the plains and remarkably inspected up close by Opportunity on Sol 330.',
        voiceScript:
          'This is the discarded entry heat shield wreckage. Cast off during descent, it struck Meridiani Planum kilometers back. When Opportunity inspected the wreckage on Sol 330, it uncovered Heat Shield Rock, the very first meteorite discovered by a rover on another planet.',
        guideExplanation:
          'Distinct from the rover’s resting spot: Opportunity’s heat shield crashed hundreds of meters from Eagle Crater. When Opportunity drove past it in 2004, it even found a basketball-sized iron meteorite nearby.',
        hotspot: { x: 26, y: 76 },
      },
      {
        id: 'opp-lander',
        name: 'Challenger Memorial Station & Parachute',
        category: 'Landing Equipment',
        remainsOnSite: false,
        siteNote: 'Remains over 20 km northwest inside Eagle Crater and surrounding plains.',
        description:
          'Airbag-cushioned base platform left in Eagle Crater while parachute and backshell came down several hundred meters away.',
        voiceScript:
          'This is Challenger Memorial Station, the tetrahedral airbag lander that cushioned Opportunity’s arrival on Mars. After bounding safely inside Eagle Crater, its petals unfolded to release the rover into the sands of Meridiani.',
        guideExplanation:
          'Named for the fallen Challenger crew, this petal platform bounced inside Eagle Crater on airbags before unfolding to roll Opportunity out onto Martian sand.',
        hotspot: { x: 42, y: 35 },
      },
    ],
    specs: {
      mass: '185 kg (408 lb)',
      powerSource: 'Triple-junction GaInP/GaAs solar wings (~140 W peak)',
      communication: 'X-band high-gain dish + UHF orbiter relay',
      primaryInstruments: [
        'Pancam, Navcam & Hazcam Imaging Suites',
        'Mini-TES, Mössbauer & APXS Spectrometers',
        'Rock Abrasion Tool (RAT) & Microscopic Imager',
      ],
    },
    storyChapters: [
      {
        id: 'opp-ch-1',
        chapterNumber: '01',
        chapterTitle: 'HOLE-IN-ONE AT EAGLE CRATER',
        headline: 'Resting Beside Exposed Bedrock.',
        narrative:
          'Encased inside inflated airbags on January 25, 2004, Opportunity bounced across Meridiani Planum and rolled squarely into a 22-meter impact depression—Eagle Crater. Its first panoramas revealed layered sedimentary bedrock inches from its front wheels.',
        historicalContext:
          'Microscopic analysis immediately detected spherical hematite concretions formed by water saturating porous sediments.',
        archivalImage: '/images/exhibits/opportunity.jpg',
        imageCaption: 'Opportunity’s gold cables and wheels gripping Meridiani sulfate rocks (NASA PIA03240).',
        keyMetric: { label: 'Mission Run', value: '5,111 Sols (14+ Years)' },
        audioFrequency: 220,
      },
      {
        id: 'opp-ch-2',
        chapterNumber: '02',
        chapterTitle: 'DISCOVERIES & METEORITES',
        headline: 'Inspecting Its Own Fallen Heat Shield.',
        narrative:
          'After exploring Endurance Crater, Opportunity turned south across endless ripples—stopping to study the twisted wreckage of its own atmospheric heat shield and identifying the first meteorite discovered on another planet ("Heat Shield Rock"). Years later along Endeavour Crater’s rim, gypsum veins proved neutral-pH water had flowed there.',
        historicalContext:
          'Total odometer distance reached 45.16 kilometers before the June 2018 global dust storm darkened Mars.',
        archivalImage: '/images/exhibits/opp_heatshield_rock.jpg',
        imageCaption: 'Heat Shield Rock, an iron meteorite discovered beside Opportunity’s shed heat shield (NASA PIA07269).',
        keyMetric: { label: 'Distance Driven', value: '45.16 Kilometers' },
        audioFrequency: 440,
      },
    ],
    legacy: {
      physicalCondition:
        'Dust-covered but intact chassis tilted at 11° inside Perseverance Valley facing Endeavour Crater.',
      currentMilestone: 'Holder of the 45.16 km off-Earth rover traverse benchmark across 5,111 sols.',
      scientificImpact: [
        'Proved sustained acidic and neutral-pH liquid water existed in Mars’s ancient past.',
        'Inspected its own discarded heat shield and identified the first extraterrestrial meteorite discovered by a rover.',
      ],
      whatRemainsToday:
        'Opportunity rover rests at Perseverance Valley; Challenger Memorial Station lander, heat shield, and parachute lie over 20 km back near Eagle Crater.',
      sources: [
        {
          title: 'NASA JPL: Mars Exploration Rover Opportunity Mission Archive',
          organization: 'NASA / JPL-Caltech',
          url: 'https://science.nasa.gov/mission/mer-opportunity/',
          catalogId: 'NSSDC-ID: 2003-032A',
        },
      ],
    },
    curatedQnA: [],
  },

  insight: {
    id: 'insight',
    name: 'INSIGHT',
    callsign: 'InSight Geophysical Lander',
    mission: 'Discovery Program (Mars Interior Exploration)',
    year: '2018',
    destination: 'mars',
    category: 'Complete Spacecraft',
    modelType: 'Stationary Seismic & Heat-Flow Mars Lander',
    landingDate: '26 November 2018',
    declarationDate: 'Mission Ended 21 December 2022',
    operationalDuration: '4 years, 24 days (1,444 sols)',
    status: 'inactive',
    statusLabel: 'Inactive — Stationary on Elysium Planitia',
    locationName: 'Elysium Planitia',
    heroImage: '/images/exhibits/insight_selfie.jpg',
    heroCaption:
      'InSight’s first complete selfie on Elysium Planitia displaying circular solar wings, copper-domed SEIS seismometer on deck prior to deployment, and robotic arm (NASA PIA22876).',
    heroNasaId: 'PIA22876',
    galleryImages: [
      {
        src: '/images/exhibits/insight_selfie.jpg',
        caption: 'InSight full lander selfie on Elysium Planitia, December 2018 (NASA PIA22876).',
        nasaId: 'PIA22876',
      },
      {
        src: '/images/exhibits/insight_seis.jpg',
        caption: 'InSight’s robotic grapple placing the copper-cased SEIS seismometer directly onto Martian soil (NASA PIA22977).',
        nasaId: 'PIA22977',
      },
      {
        src: '/images/exhibits/insight_deck.jpg',
        caption: 'Instrument deck integration at Lockheed Martin cleanroom prior to launch (NASA PIA21847).',
        nasaId: 'PIA21847',
      },
    ],
    has3DModel: false,
    coordinates: {
      latitude: '4.502° N',
      longitude: '135.623° E',
      elevation: '−2,660 m',
      planetaryRegion: 'Elysium Planitia, Mars',
      worldPosition: [0, 0, 0],
    },
    brief: 'The first robot built to take Mars’s vital signs from within.',
    shortDescription:
      'A stationary geophysical station that placed the first seismometer onto Martian regolith and mapped the planet’s liquid core.',
    tagline:
      'Unlike mobile rovers, InSight stayed rooted on Elysium Planitia—listening through a ultra-sensitive seismometer to over 1,300 marsquakes and meteor impacts echoing through the Martian core.',
    guide: {
      spokenIntro:
        'Welcome! You are examining InSight, NASA’s stationary geophysical observatory on Mars.',
      voiceScript:
        'Welcome! You are examining InSight, humanity’s premier geophysical observatory on Mars, resting on Elysium Planitia. Launched under NASA’s Discovery Program, InSight touched down on November 26th, 2018, not to roam the landscape, but to listen intently to the planet’s heartbeat. Powered by twin 2.15-meter circular solar arrays, InSight deployed a 1.8-meter robotic arm to lift scientific instruments off its deck and set them directly onto the Martian soil. Its ultra-sensitive French seismometer, SEIS, captured 1,319 marsquakes and meteor strikes, allowing scientists to map the Martian crust, mantle, and measure its liquid iron-alloy core radius at approximately 1,830 kilometers. InSight remained behind because seismic measurements required absolute mechanical stillness. Over four years, fine atmospheric dust gradually enveloped its solar panels, diminishing electrical output until the final transmission on December 15th, 2022. Today, InSight rests intact on Elysium Planitia, an eternal listening post preserved in the quiet solitude of Mars.',
      explanation:
        'InSight was a stationary geophysical lander that touched down on Elysium Planitia in November 2018. Using a 1.8-meter robotic arm, it lifted a copper-shielded seismometer directly off its deck and set it onto the ground to measure Mars’s crust, mantle, and core.',
      purpose:
        'Measure internal seismic waves, interior heat flow, and planetary spin wobble to understand how rocky planets like Mars formed four billion years ago.',
      missionUsed: 'NASA InSight (Interior Exploration using Seismic Investigations, Geodesy and Heat Transport).',
      whyLeftBehind:
        'InSight lacked wheels by design because seismic listening requires stationary grounding. Over four years, accumulated Martian dust coated both circular solar panels until power dropped below battery threshold in December 2022.',
      presentStatus:
        'Dust-blanketed lander, deployed SEIS seismometer, and heat probe housing remain stationary on Elysium Planitia; its heat shield and parachute rest ~600–800 meters away.',
      keyFacts: [
        'Detected 1,319 marsquakes and meteoroid impacts echoing through Mars',
        'First mission to place a seismometer directly on the surface of another planet',
        'Measured Mars’s liquid metallic core with a radius of approximately 1,830 km',
        'Reused proven Phoenix lander pulsed descent propulsion system',
      ],
    },
    components: [
      {
        id: 'ins-lander',
        name: 'Cruise Lander Deck & Dual Circular Solar Wings',
        category: 'Complete Spacecraft',
        remainsOnSite: true,
        siteNote: 'Standing stationary on three landing legs at Elysium Planitia.',
        description:
          'Three-legged Phoenix-heritage lander powered by dual 2.15 m decagonal solar panels and twelve pulsed retro-rocket thrusters used during powered landing.',
        voiceScript:
          'This is the InSight lander deck and dual circular solar arrays. Supported by three shock-absorbing legs, twelve pulsed hydrazine retro-rockets brought InSight to a soft touchdown without airbags, providing a vibration-free base for planetary listening.',
        guideExplanation:
          'InSight reused the proven three-leg powered descent design from Mars Phoenix, using twelve downward pulsing engines to touch down gently without bouncing.',
      },
      {
        id: 'ins-seis',
        name: 'SEIS Seismometer & Wind/Thermal Shield',
        category: 'Scientific Instrument',
        remainsOnSite: true,
        siteNote: 'Resting on Martian sand ~1.6 m south of the lander.',
        description:
          'Vacuum-sealed ultra-sensitive seismometer shielded from wind gusts beneath a domed white cover, detecting 1,319 marsquakes and meteor strikes.',
        voiceScript:
          'This is SEIS, the Seismic Experiment for Interior Structure. Covered by a protective aerodynamic and thermal wind shield, this ultra-sensitive instrument recorded 1,319 seismic events, mapping the liquid iron core and crustal layering of Mars.',
        guideExplanation:
          'InSight’s robotic arm picked this seismometer off the deck and set it directly onto Mars, revealing a crust 24–72 km thick and a liquid iron-alloy core.',
      },
      {
        id: 'ins-hp3',
        name: 'HP3 Heat Flow Probe ("The Mole")',
        category: 'Scientific Instrument',
        remainsOnSite: true,
        siteNote: 'Partially buried in regolith beside SEIS.',
        description:
          'Self-hammering thermal probe designed to burrow underground; unexpected cohesive duricrust halted deep descent despite creative robotic-arm soil tamping.',
        voiceScript:
          'This is the HP3 Heat Flow and Physical Properties Package, known as The Mole. Designed to burrow five meters underground to record planetary core heat release, it revealed critical geotechnical friction properties of Martian duricrust.',
        guideExplanation:
          'Although cohesive Martian sand prevented "The Mole" from hammering five meters deep, operations yielded valuable upper-soil mechanics telemetry.',
      },
      {
        id: 'ins-edl',
        name: 'Heat Shield, Backshell & Parachute (Separated)',
        category: 'Landing Equipment',
        remainsOnSite: false,
        siteNote: 'Shed mid-descent; imaged by Mars Reconnaissance Orbiter ~600–800 m away.',
        description:
          '2.64-meter thermal aeroshell and supersonic parachute discarded prior to InSight’s final powered leg-descent burn.',
        voiceScript:
          'These are the separated heat shield, backshell, and supersonic parachute. Jettisoned during atmospheric entry, they descended independently and rest safely hundreds of meters away across the plains of Elysium Planitia.',
        guideExplanation:
          'Orbital HiRISE cameras spotted InSight’s white parachute and dark heat shield several hundred meters away across Elysium Planitia, well clear of the seismometer.',
      },
    ],
    specs: {
      mass: '358 kg landed mass',
      powerSource: 'Dual 2.15 m circular Ultraflex solar arrays',
      communication: 'X-band direct-to-Earth + UHF orbiter relay + MarCO CubeSat flyby relay',
      primaryInstruments: [
        'SEIS (Seismic Experiment for Interior Structure — CNES/IPGP)',
        'HP3 (Heat Flow & Physical Properties Package — DLR)',
        'RISE (Rotation and Interior Structure Experiment)',
      ],
    },
    storyChapters: [
      {
        id: 'ins-ch-1',
        chapterNumber: '01',
        chapterTitle: 'LISTENING TO ANOTHER WORLD',
        headline: 'Setting a Seismometer Upon the Ground.',
        narrative:
          'On November 26, 2018, InSight touched down smoothly atop Elysium Planitia under retro-rocket thrust. Never before had a spacecraft deployed a dedicated robotic arm solely to pick instruments off its own deck and rest them carefully onto Martian soil.',
        historicalContext:
          'Twin briefcase-sized MarCO CubeSats relayed real-time entry and landing telemetry directly back to JPL during arrival.',
        archivalImage: '/images/exhibits/insight_seis.jpg',
        imageCaption: 'InSight robotic arm lowering SEIS onto Elysium Planitia soil (NASA PIA22977).',
        keyMetric: { label: 'Marsquakes Detected', value: '1,319 Events' },
      },
      {
        id: 'ins-ch-2',
        chapterNumber: '02',
        chapterTitle: 'INSIDE THE RED PLANET',
        headline: 'Measuring a Liquid Core.',
        narrative:
          'Before thick Martian dust eventually silenced its circular arrays on December 15, 2022, InSight captured faint seismic echoes bouncing off Mars’s core—establishing the planet’s core radius (~1,830 km) as liquid iron enriched with lighter elements.',
        historicalContext:
          'On December 21, 2022, NASA formally declared InSight’s mission complete after two missed contact attempts.',
        archivalImage: '/images/exhibits/insight_selfie.jpg',
        imageCaption: 'Full self-portrait of InSight stationary on Elysium Planitia (NASA PIA22876).',
        keyMetric: { label: 'Measured Core Radius', value: '~1,830 Kilometers' },
      },
    ],
    legacy: {
      physicalCondition:
        'Stationary three-leg deck heavily coated in red dust on Elysium Planitia, flanked by SEIS dome and HP3 housing.',
      currentMilestone: 'First complete seismic measurement of Mars’s crust, mantle, and liquid core.',
      scientificImpact: [
        'Recorded 1,319 marsquakes including distant magnitude-4.7 tremors and fresh meteoroid impact craters.',
        'Defined crustal thickness, liquid iron core diameter, and daily atmospheric pressure infrasound.',
      ],
      whatRemainsToday:
        'InSight deck, solar wings, Wind/Thermal Shield covering SEIS, and HP3 support assembly on Elysium Planitia; heat shield and parachute rest ~600–800 m away.',
      sources: [
        {
          title: 'NASA Science: Mars InSight Lander Mission Archive',
          organization: 'NASA / JPL-Caltech',
          url: 'https://science.nasa.gov/mission/insight/',
          catalogId: 'NSSDC-ID: 2018-042A',
        },
      ],
    },
    curatedQnA: [],
  },

  // =========================================================================
  // DEEP SPACE EXHIBITION
  // =========================================================================

  voyager1: {
    id: 'voyager1',
    name: 'VOYAGER 1',
    callsign: 'Voyager 1 (Interstellar Mission)',
    mission: 'Voyager Interstellar Mission',
    year: '1977',
    destination: 'deep_space',
    category: 'Complete Spacecraft',
    modelType: 'Interstellar Robotic Probe',
    landingDate: 'Launched 5 September 1977',
    declarationDate: 'Operational in Interstellar Medium',
    operationalDuration: '47+ Years Active Operations',
    distanceTraveled: '24+ Billion Kilometers (163+ AU)',
    status: 'travelling',
    statusLabel: 'Operational — Sailing Interstellar Space',
    locationName: 'Interstellar Space (Constellation Ophiuchus)',
    heroImage: '/images/exhibits/voyager_model.png',
    heroCaption:
      'Voyager spacecraft configuration featuring 3.7-meter high-gain dish antenna, RTG nuclear boom, and 13-meter magnetometer truss (NASA JPL).',
    heroNasaId: 'PIA22915',
    galleryImages: [
      {
        src: '/images/exhibits/voyager_model.png',
        caption: 'Voyager interstellar probe configuration (NASA JPL).',
      },
      {
        src: '/images/exhibits/voyager.jpg',
        caption: 'Instrument placement across Voyager’s scan platform and antenna booms (NASA PIA22915).',
        nasaId: 'PIA22915',
      },
    ],
    has3DModel: true,
    coordinates: {
      latitude: '+12° 08′ (Declination)',
      longitude: '17h 15m (Right Ascension)',
      elevation: '163+ AU from Sun',
      planetaryRegion: 'Local Interstellar Cloud',
      worldPosition: [0, 0, 0],
    },
    brief: 'The farthest human creation in the universe.',
    shortDescription:
      'Launched in 1977, Voyager 1 crossed the heliopause in 2012 and continues transmitting from interstellar space.',
    tagline:
      'Operating more than 22 light-hours from Earth on dwindling plutonium power, Voyager 1 sails between the stars carrying our Golden Record across cosmic time.',
    guide: {
      spokenIntro:
        'Welcome! You are looking at Voyager 1, the most distant emissary in human history.',
      voiceScript:
        'Welcome! You are looking at Voyager 1, the most distant physical emissary of human civilization. Launched on September 5th, 1977, Voyager 1 embarked on a grand tour of the outer planets, utilizing gravity assists at Jupiter and Saturn before crossing the heliopause into interstellar space in August 2012. Generating electricity from three multi-hundred-watt Plutonium-238 radioisotope thermoelectric generators, Voyager 1 broadcasts back across more than twenty-four billion kilometers using a 3.7-meter high-gain parabolic antenna. It revealed active volcanism on Jupiter’s moon Io, intricate ring dynamics at Saturn, and captured the profound Pale Blue Dot photograph of Earth. Voyager 1 was never designed to return; moving at seventeen kilometers per second on a hyperbolic trajectory, it will traverse the Milky Way for eons. Mounted to its bus is the Golden Record, carrying the sounds, images, and greetings of Earth for any cosmic travelers who might encounter our silent herald.',
      explanation:
        'Voyager 1 is humanity’s farthest spacecraft. After swinging past Jupiter in 1979 and Saturn in 1980, it angled upward out of the planetary plane and crossed the heliopause in August 2012 into true interstellar space.',
      purpose:
        'Explore the outer giant planets and measure charged particles, magnetic fields, and plasma waves beyond the Sun’s protective magnetic bubble.',
      missionUsed: 'NASA Voyager Interstellar Mission (1977–Present).',
      whyLeftBehind:
        'Voyager 1 moves at ~17 km/s on an unbound hyperbolic escape trajectory out of our Solar System—it will never return to Earth.',
      presentStatus:
        'Operational and still communicating via Deep Space Network dishes using dwindling Plutonium-238 radioisotope power.',
      keyFacts: [
        'Humanity’s farthest operational spacecraft, over 24 billion kilometers (163 AU) from Earth',
        'First human object to cross the heliopause and enter interstellar space (August 2012)',
        'Travels at ~17 km/s (38,000 mph) on an unbound escape trajectory out of the Solar System',
        'Carries the Golden Record with greetings in 55 languages and sounds of Earth',
      ],
    },
    components: [
      {
        id: 'voy-dish',
        name: '3.7-Meter High-Gain Parabolic Dish',
        category: 'Hardware Component',
        remainsOnSite: true,
        siteNote: 'Continuously pointed back toward Earth from >163 AU.',
        description:
          'White fiberglass honeycomb dish broadcasting weak 23-watt X-band telemetry across 24 billion kilometers.',
        voiceScript:
          'This is Voyager’s 3.7-meter high-gain parabolic antenna. Made of lightweight honeycomb fiberglass, it continuously directs a focused radio beam back toward Earth, transmitting data over twenty-four billion kilometers on just twenty-three watts of power.',
        guideExplanation:
          'Even from beyond the Solar System, Voyager keeps this single white dish aligned tightly toward our distant Sun to reach Deep Space Network antennas.',
        hotspot: { x: 50, y: 35 },
      },
      {
        id: 'voy-rtg',
        name: 'Three MHW-RTG Plutonium Generators',
        category: 'Hardware Component',
        remainsOnSite: true,
        siteNote: 'Mounted on aft outrigger boom away from sensors.',
        description:
          'Nuclear decay power units originally outputting ~470 W at launch, steadily declining each year.',
        voiceScript:
          'These are the three Multi-Hundred-Watt Radioisotope Thermoelectric Generators. Powered by decaying Plutonium-238 spheres, their thermal heat is converted into electricity, sustaining Voyager’s systems deep in the interstellar void where sunlight is virtually nonexistent.',
        guideExplanation:
          'Too far from the Sun for solar arrays, Voyager relies on decaying Plutonium-238 spheres whose fading thermal wattage dictates remaining mission lifespan.',
        hotspot: { x: 26, y: 68 },
      },
      {
        id: 'voy-record',
        name: 'The Voyager Golden Record',
        category: 'Hardware Component',
        remainsOnSite: true,
        siteNote: 'Mounted inside gold-anodized aluminum protective jacket on core bus.',
        description:
          '12-inch gold-plated copper phonograph disc carrying 115 images, greetings in 55 languages, and music curated for potential cosmic travelers.',
        voiceScript:
          'This is the Voyager Golden Record. Encased in a gold-anodized aluminum cover with symbolic instructions, this 12-inch gold-plated copper phonograph record carries our music, greetings, and cosmic coordinates across billions of years of space.',
        guideExplanation:
          'Protected behind an etched uranium-238 clock cover and stylus instructions, the Golden Record endures for billions of years in interstellar vacuum.',
        hotspot: { x: 65, y: 62 },
      },
    ],
    specs: {
      mass: '722 kg dry spacecraft mass',
      powerSource: 'Three Plutonium-238 Multi-Hundred-Watt RTGs',
      communication: '3.7 m High-Gain parabolic X/S-band dish (23 W transmitter)',
      primaryInstruments: [
        'Cosmic Ray & Low-Energy Charged Particle Subsystems',
        '13-Meter Fluxgate Magnetometer Boom',
        'Plasma Wave Subsystem & Golden Record',
      ],
    },
    storyChapters: [
      {
        id: 'voy-ch-1',
        chapterNumber: '01',
        chapterTitle: 'THE GRAND TOUR',
        headline: 'Every 175 Years.',
        narrative:
          'Exploiting a once-in-175-year planetary alignment, Voyager 1 used Jupiter and Saturn as gravitational slingshots—discovering sulfur volcanoes on Io, hazy Titan chemistry, and capturing the iconic 1990 Pale Blue Dot portrait before turning silently toward the stars.',
        historicalContext:
          'Radio signals traveling at lightspeed take over 22 hours each way to reach Earth today.',
        archivalImage: '/images/exhibits/voyager_model.png',
        imageCaption: 'Voyager high-gain dish and instrument booms (NASA JPL).',
        keyMetric: { label: 'Speed Relative to Sun', value: '17 km/s (38,000 mph)' },
      },
    ],
    legacy: {
      physicalCondition: 'Fully intact, flying through interstellar plasma at ~17 km/s.',
      currentMilestone: 'Farthest human-built spacecraft operating in history.',
      scientificImpact: [
        'First spacecraft to directly sample the interstellar medium outside the heliopause.',
        'Discovered active volcanism on Io and intricate ring dynamics around Saturn.',
      ],
      whatRemainsToday:
        'Complete Voyager 1 spacecraft sailing through the constellation Ophiuchus.',
      sources: [
        {
          title: 'NASA JPL: Voyager Interstellar Mission Telemetry & Archive',
          organization: 'NASA / JPL-Caltech',
          url: 'https://voyager.jpl.nasa.gov/',
          catalogId: 'NSSDC-ID: 1977-084A',
        },
      ],
    },
    curatedQnA: [],
  },
};

export const EXHIBITION_COLLECTIONS: Record<string, string[]> = {
  moon: ['apollo11_eagle', 'apollo_lrv', 'surveyor3', 'apollo_alsep'],
  mars: ['sojourner', 'spirit', 'opportunity', 'insight'],
  deep_space: ['voyager1'],
};
