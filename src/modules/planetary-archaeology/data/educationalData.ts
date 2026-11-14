import { GlossaryTerm, MissionComparison, QuizQuestion } from '../types/storytelling';

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Regolith',
    phonetic: 'REG-uh-lith',
    category: 'geology',
    definition:
      'A blanket of unconsolidated, fragmented rock, mineral grains, and glass shards covering solid bedrock. On the Moon, regolith is formed by billions of years of meteorite and micrometeorite impacts without water or wind erosion, resulting in razor-sharp, abrasive dust.',
    example: 'Apollo 11 astronauts noted that lunar regolith clung to their space suits due to electrostatic charge and sharp angular micro-shards.',
    planetRelevant: 'both',
  },
  {
    term: 'Albedo',
    phonetic: 'al-BEE-doh',
    category: 'physics',
    definition:
      'The fraction of incident solar electromagnetic radiation reflected by a planetary surface or object. The Moon has a low average visual albedo of approximately 0.12 (reflecting only 12% of sunlight, similar to weathered asphalt).',
    example: 'Lunar maria have a much lower albedo (~0.07) than the brighter, highland anorthosite crust (~0.18).',
    planetRelevant: 'both',
  },
  {
    term: 'ALSEP',
    phonetic: 'AL-sep',
    category: 'spacecraft',
    definition:
      'Apollo Lunar Surface Experiments Package. A modular suite of scientific instruments powered by radioisotope thermoelectric generators (RTGs) deployed by Apollo 12, 14, 15, 16, and 17 astronauts to study lunar seismology, heat flow, magnetic fields, and solar wind.',
    example: 'ALSEP stations continued transmitting data back to Earth until NASA shut off the receiving stations on September 30, 1977 due to budget constraints.',
    planetRelevant: 'moon',
  },
  {
    term: 'RTG',
    phonetic: 'R-T-G',
    category: 'spacecraft',
    definition:
      'Radioisotope Thermoelectric Generator. An electrical generator that converts the heat released by the natural radioactive decay of Plutonium-238 into electricity using thermocouples (Seebeck effect). RTGs provide reliable power in deep space and during the long 14-day lunar night.',
    example: 'The SNAP-27 RTG powered Apollo ALSEP stations with over 70 Watts of continuous electrical power in the pitch-black lunar night.',
    planetRelevant: 'both',
  },
  {
    term: 'Rocker-Bogie',
    phonetic: 'ROK-er BOH-gee',
    category: 'spacecraft',
    definition:
      'A suspension mechanism consisting of two rocker arms connected by a differential bar, with bogie sub-assemblies on each side. It allows six-wheeled rovers to climb obstacles larger than their wheel diameter without tilting the chassis excessively or losing ground traction.',
    example: 'NASA rovers Sojourner, Spirit, Opportunity, Curiosity, and Perseverance all rely on the rocker-bogie suspension to conquer rocky Martian terrain.',
    planetRelevant: 'mars',
  },
  {
    term: 'S-IVB',
    phonetic: 'S-four-B',
    category: 'rocketry',
    definition:
      'The third stage of the Saturn V rocket (and second stage of Saturn IB). Powered by a single restartable J-2 liquid hydrogen/liquid oxygen engine producing 230,000 lbf of thrust, it performed Trans-Lunar Injection (TLI) to propel Apollo crews toward the Moon.',
    example: 'From Apollo 13 to 17, spent S-IVB stages were deliberately crashed into the Moon as calibrated seismic energy sources for ALSEP seismometers.',
    planetRelevant: 'moon',
  },
  {
    term: 'Sinuous Rille',
    phonetic: 'SIN-yoo-us RIL',
    category: 'geology',
    definition:
      'Meandering channel-like valleys on the Moon carved by ancient, turbulent rivers of extremely hot, low-viscosity basaltic lava during effusive volcanic eruptions billions of years ago.',
    example: 'Apollo 15 explored Hadley Rille, a 1.5-kilometer-wide, 300-meter-deep sinuous rille nestled against the Apennine Mountains.',
    planetRelevant: 'moon',
  },
  {
    term: 'MMRTG',
    phonetic: 'M-M-R-T-G',
    category: 'spacecraft',
    definition:
      'Multi-Mission Radioisotope Thermoelectric Generator. A modern RTG design containing 4.8 kg of plutonium dioxide pellets that provides ~110 Watts of electrical power and ~2,000 Watts of thermal energy to keep rover electronics warm.',
    example: 'Curiosity and Perseverance use MMRTG power units, allowing them to operate at night and through violent Martian dust storms that blinded Opportunity.',
    planetRelevant: 'mars',
  },
  {
    term: 'Sky Crane',
    phonetic: 'SKY KRAYN',
    category: 'spacecraft',
    definition:
      'A rocket-powered descent stage that hovers above the Martian surface using throttleable hydrazine thrusters while lowering a rover to the ground on 7.5-meter nylon tethers before cutting cables and flying away to crash land.',
    example: 'The Sky Crane maneuver landed the 1-tonne Curiosity in 2012 and Perseverance in 2021 with zero parachute dust contamination of their wheels.',
    planetRelevant: 'mars',
  },
  {
    term: 'Cryogenic',
    phonetic: 'kry-oh-JEN-ik',
    category: 'rocketry',
    definition:
      'Relating to substances kept at extremely low temperatures (below -150 °C / 123 K). Rocket propulsion frequently uses cryogenic liquid oxygen (LOX, -183 °C) and liquid hydrogen (LH2, -253 °C) to maximize specific impulse ($I_{sp}$).',
    example: 'The Saturn V S-II and S-IVB stages burned cryogenic liquid hydrogen and liquid oxygen, requiring advanced insulated foam insulation.',
    planetRelevant: 'both',
  },
  {
    term: 'Maria',
    phonetic: 'MAH-ree-uh',
    category: 'geology',
    definition:
      'Large, dark, basaltic plains on the Moon formed by ancient volcanic eruptions that flooded giant asteroid impact basins between 3.1 and 3.9 billion years ago. Early astronomers mistook them for seas (Latin: maria).',
    example: 'Apollo 11 landed in southern Mare Tranquillitatis ("Sea of Tranquility"), an ancient titanium-rich basaltic plain.',
    planetRelevant: 'moon',
  },
  {
    term: 'Breccia',
    phonetic: 'BRECH-ee-uh',
    category: 'geology',
    definition:
      'A rock composed of broken, angular mineral fragments or rock shards cemented together by a fine-grained matrix. On the Moon, impact breccias formed when catastrophic meteorite strikes shock-melted and fused pulverized surface crust.',
    example: 'Apollo 16 collected pristine highland impact breccias that helped date the Late Heavy Bombardment period in Solar System history.',
    planetRelevant: 'both',
  },
  {
    term: 'Noachian',
    phonetic: 'no-AY-kee-an',
    category: 'geology',
    definition:
      'The earliest geological epoch of Mars, lasting from the formation of the planet ~4.1 to ~3.7 billion years ago. Marked by heavy impact cratering, active volcanism, a thicker atmosphere, and extensive liquid water on the surface.',
    example: 'Endeavour Crater, explored by Opportunity, exposes ancient Noachian bedrock containing clay minerals formed in neutral-pH groundwater.',
    planetRelevant: 'mars',
  },
  {
    term: 'In Situ',
    phonetic: 'in SEE-too',
    category: 'physics',
    definition:
      'A Latin phrase meaning "in its original place". In planetary exploration, in situ analysis refers to examining soil, rock, or atmosphere directly on the planetary surface without returning samples to Earth.',
    example: 'Opportunity used its alpha particle X-ray spectrometer for in situ chemical assays of the iron meteorite "Heat Shield Rock".',
    planetRelevant: 'both',
  },
  {
    term: 'PSEP',
    phonetic: 'P-S-E-P',
    category: 'spacecraft',
    definition:
      'Passive Seismic Experiment Package. The early geophysical station deployed by Apollo 11 astronauts Neil Armstrong and Buzz Aldrin. It detected natural moonquakes, meteoroid impacts, and astronaut footfalls during their 2.5-hour EVA.',
    example: 'PSEP recorded the vibrations of Eagle’s ascent stage firing into orbit, providing the first seismic data from another planetary body.',
    planetRelevant: 'moon',
  },
  {
    term: 'LRRR',
    phonetic: 'L-R-cube',
    category: 'spacecraft',
    definition:
      'Laser Ranging Retroreflector. An array of corner-cube quartz optical prisms designed to reflect laser pulses sent from Earth back along the exact same path. Unlike electronics, it requires zero electrical power and has operated continuously since 1969.',
    example: 'LRRR measurements proved the Moon’s core is partially molten and that the Moon recedes from Earth at 3.82 centimeters per year.',
    planetRelevant: 'moon',
  },
];

export const MISSION_COMPARISONS: MissionComparison[] = [
  {
    id: 'apollo11_vs_apollo17',
    title: 'Apollo 11 vs. Apollo 17',
    subtitle: 'From First Tentative Steps to Geological Science Laboratory',
    category: 'lunar_evolution',
    missionA: {
      name: 'Apollo 11 (July 1969)',
      year: 1969,
      massKg: '15,103 kg (LM-5)',
      power: 'Silver-Zinc batteries (400 Ah)',
      duration: '21h 36m on lunar surface (EVA: 2h 31m)',
      distanceTraveled: '1,000 meters total walked',
      primaryDiscovery: 'First lunar rocks (3.7 Ga mare basalts), anorthosite proof of magma ocean',
      remainingHardware: 'LM Eagle Descent Stage, PSEP, LRRR array, camera, boots, plaque',
    },
    missionB: {
      name: 'Apollo 17 (December 1972)',
      year: 1972,
      massKg: '16,448 kg (LM-12 Challenger)',
      power: 'SNAP-27 Plutonium RTG + Ag-Zn batteries',
      duration: '74h 59m on lunar surface (EVA: 22h 04m)',
      distanceTraveled: '35.74 km driven on Lunar Roving Vehicle',
      primaryDiscovery: 'Orange volcanic pyroclastic glass beads (Shorty Crater), mantle samples',
      remainingHardware: 'LM Challenger Descent Stage, LRV-003 Rover, ALSEP station, gravimeter',
    },
    analysis:
      'In just 3.5 years, Apollo transformed from a demonstration of landing survival into an advanced field science expedition. Apollo 17 spent over triple the time on the surface, covered 35 times more ground thanks to the Lunar Roving Vehicle, and returned 110.5 kg of geological samples compared to Apollo 11’s 21.55 kg.',
  },
  {
    id: 'opportunity_vs_curiosity_vs_perseverance',
    title: 'Opportunity vs. Curiosity',
    subtitle: 'Solar-Powered Scout vs. Nuclear-Powered Mobile Laboratory',
    category: 'mars_rovers',
    missionA: {
      name: 'Opportunity (MER-B, 2004)',
      year: 2004,
      massKg: '185 kg (Golf-cart size)',
      power: 'Triple-junction GaAs Solar Arrays (140 W peak)',
      duration: '5,352 sols (14 years, 138 days)',
      distanceTraveled: '45.16 km (First off-world marathon)',
      primaryDiscovery: 'Hematite spherules ("blueberries") and sulfate deposits proving ancient standing liquid water',
      remainingHardware: 'Intact rover at Perseverance Valley / Endeavour Crater rim, heat shield, lander egress petals',
    },
    missionB: {
      name: 'Curiosity (MSL, 2012)',
      year: 2012,
      massKg: '899 kg (SUV size)',
      power: 'MMRTG (Plutonium-238, 110 W electrical continuous)',
      duration: '4,200+ sols (Active & operating)',
      distanceTraveled: '32.4 km across Gale Crater',
      primaryDiscovery: 'Ancient long-lived freshwater lake system with bio-essential organic carbon molecules',
      remainingHardware: 'Active on Mount Sharp; descent stage / sky crane wreckage at Gale Crater impact site',
    },
    analysis:
      'While Opportunity was constrained by solar dust deposition and winter darkness (eventually succumbing to a planet-wide dust storm in 2018), Curiosity’s radioisotope power source allows round-the-clock drilling, laser spectroscopy (ChemCam), and onboard chemical laboratories (SAM and CheMin) capable of detecting complex organic molecules.',
  },
];

export const KNOWLEDGE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'quiz-1',
    question: 'Why did the Apollo 11 Lunar Module Eagle land nearly 6 kilometers west of its target ellipse?',
    options: [
      'Unmodeled residual cabin gas pressure vented through the docking tunnel imparted a slight velocity impulse prior to undocking',
      'A navigation computer clock synchronization error of 12 seconds with Mission Control',
      'Severe solar wind turbulence pushed the lightweight spacecraft off course',
      'The descent engine was fired at 110% throttle instead of the planned 40% throttle',
    ],
    correctAnswerIndex: 0,
    explanation:
      'When Eagle and Columbia undocked, cabin air had not been fully evacuated through the tunnel. The residual pressure acted like a miniature cold-gas thruster, nudging Eagle by a few inches per second. Over orbital descent, this tiny delta-V translated into a 4-mile (~6 km) downrange overshoot into boulder-strewn West Crater.',
    missionContext: 'Apollo 11 (July 20, 1969)',
  },
  {
    id: 'quiz-2',
    question: 'What scientific discovery did Opportunity make inside Eagle Crater that proved liquid water once flowed on Mars?',
    options: [
      'Subsurface permafrost ice crystals glittering under microscopic imager LED lights',
      'Millimeter-scale hematite-rich concretions nicknamed "blueberries" embedded in layered sulfate rock',
      'Fossilized microbial mats preserved inside basalt vesicles',
      'Active water vapor geysers venting from fracture rifts along the crater rim',
    ],
    correctAnswerIndex: 1,
    explanation:
      'Opportunity discovered tiny spherical concretions termed "blueberries" weathered out of sulfur-rich bedrock. Mössbauer spectrometer analysis proved they were composed of gray hematite, a mineral that typically precipitates out of acidic groundwater on Earth.',
    missionContext: 'Opportunity Rover (Sol 34–50, Meridiani Planum)',
  },
  {
    id: 'quiz-3',
    question: 'Which piece of Apollo 11 surface equipment continues to return active scientific data to Earth over 55 years later?',
    options: [
      'The Passive Seismic Experiment Package (PSEP)',
      'The Solar Wind Composition foil sheet',
      'The Laser Ranging Retroreflector (LRRR) prism array',
      'The Apollo Lunar Surface Television Camera',
    ],
    correctAnswerIndex: 2,
    explanation:
      'The Laser Ranging Retroreflector (LRRR) consists of 100 fused silica corner-cube prisms that require no electricity. Observatories on Earth fire lasers at Eagle’s landing site and measure the round-trip travel time with picosecond accuracy, confirming the Moon spirals 3.8 cm farther away each year.',
    missionContext: 'Tranquility Base (Mare Tranquillitatis)',
  },
  {
    id: 'quiz-4',
    question: 'What revolutionary landing system allowed NASA to touch down 1-tonne rovers like Curiosity and Perseverance without airbags or landing gear?',
    options: [
      'The Sky Crane rocket-powered descent maneuver',
      'Super-orbital supersonic parachutes deployed all the way to 0 altitude',
      'Giant aerogel inflatable shock cushions',
      'Direct penetrator spearheads dropped from orbit',
    ],
    correctAnswerIndex: 0,
    explanation:
      'The Sky Crane used 8 throttleable hydrazine rocket engines to decelerate and hover 7.5 meters above the surface, lowering the rover on nylon bridle cords and an umbilical data cable, before severing lines and throttling away to crash land safely.',
    missionContext: 'Mars Science Laboratory (MSL) & Mars 2020',
  },
  {
    id: 'quiz-5',
    question: 'Why did Opportunity’s mission finally conclude in June 2018 at Perseverance Valley?',
    options: [
      'Its primary rocker-bogie differential broke while climbing a 32-degree slope',
      'A catastrophic global Martian dust storm blocked solar irradiance, draining its lithium-ion batteries into deep cold',
      'Its high-gain directional antenna mechanical gimbal seized completely',
      'NASA deliberately commanded it to enter permanent sleep mode to free DSN network bandwidth',
    ],
    correctAnswerIndex: 1,
    explanation:
      'A planet-encircling dust storm raised the atmospheric optical depth (tau) to an unprecedented 10.8, cutting sunlight to less than 1% of normal levels. Without solar power, Opportunity’s internal survival heaters could not sustain the electronics against the bitter -100 °C Martian night.',
    missionContext: 'Opportunity Rover (MER-B, Sol 5111)',
  },
  {
    id: 'quiz-6',
    question: 'What was the primary scientific purpose of intentionally crashing Saturn V third stages (S-IVB) and Apollo ascent stages into the Moon?',
    options: [
      'To prevent lunar orbital debris from colliding with future spacecraft',
      'To expose subsurface deep bedrock for orbital spectrometer imaging',
      'To generate known, calibrated artificial impact energy pulses recorded by surface ALSEP seismometers',
      'To test anti-ballistic impact shields in vacuum',
    ],
    correctAnswerIndex: 2,
    explanation:
      'By impacting 14-tonne S-IVB stages into the Moon at over 2.5 km/s, geophysicists knew the exact time, kinetic energy, and impact coordinates. The reverberating seismic waves recorded by ALSEP stations revealed the thickness of the lunar crust (~60 km) and proved the Moon has a fractured, dry interior.',
    missionContext: 'Apollo 13–17 Seismic Network Experiments',
  },
  {
    id: 'quiz-7',
    question: 'What is the Rocker-Bogie suspension system engineered to do on Mars rovers?',
    options: [
      'Store kinetic energy in internal flywheels to jump over crevasses',
      'Maintain equal weight distribution across all 6 wheels while traversing obstacles larger than wheel diameter without springs',
      'Vibrate high-frequency shockwaves to pulverize rocks in front of the rover',
      'Convert vehicle bouncing motion into electrical current to recharge batteries',
    ],
    correctAnswerIndex: 1,
    explanation:
      'The rocker-bogie mechanism uses no springs or axles across the vehicle body. Its differential link divides chassis tilt in half and ensures all 6 drive wheels stay in constant contact with the ground, maintaining steady traction across extreme boulder fields.',
    missionContext: 'NASA JPL Rover Mobility Engineering',
  },
  {
    id: 'quiz-8',
    question: 'What caused the bright orange soil discovered by Harrison Schmitt at Apollo 17’s Shorty Crater?',
    options: [
      'Oxidation of iron meteorites by traces of water vapor',
      'Titanium-rich volcanic glass beads quenched in explosive fire-fountain eruptions 3.64 billion years ago',
      'Decay of radioactive ALSEP fuel remnants',
      'Chemical contamination from the Lunar Module descent engine exhaust plume',
    ],
    correctAnswerIndex: 1,
    explanation:
      'The orange soil consisted of microscopic droplets of amorphous volcanic glass beads rich in titanium. They were formed during ancient lunar explosive volcanism ("fire-fountaining") when volatile gases blasted molten magma into the cold lunar vacuum 3.64 billion years ago.',
    missionContext: 'Apollo 17 (Taurus-Littrow Valley, Station 4)',
  },
];
