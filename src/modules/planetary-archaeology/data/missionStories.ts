import { CompleteMissionStory } from '../types/storytelling';

export const MISSION_STORIES: Record<string, CompleteMissionStory> = {
  // =========================================================================
  // 1. APOLLO 11 — THE FIRST HUMAN TOUCHDOWN ON THE MOON
  // =========================================================================
  apollo11_eagle: {
    id: 'apollo11_eagle',
    missionName: 'Apollo 11',
    spacecraftName: 'Lunar Module Eagle (LM-5)',
    planet: 'moon',
    launchYear: 1969,
    operator: 'NASA',
    heroImage: '/images/apollo11_surface.jpg',
    tagline: 'The First Footsteps on Another World',
    summary:
      'On July 20, 1969, Neil Armstrong and Buzz Aldrin guided the Lunar Module Eagle onto the ancient basalt plains of Mare Tranquillitatis. While humanity celebrated their safe return, Eagle’s golden descent stage remained behind as our species’ first permanent monument on the lunar regolith.',
    hardwareInventory: [
      {
        name: 'LM Eagle Descent Stage (LM-5)',
        type: 'Descent Stage Chassis & 4 Struts',
        condition: 'Intact, resting upright on regolith',
        status: 'Abandoned in situ (Heritage Monument)',
      },
      {
        name: 'Passive Seismic Experiment (PSEP)',
        type: 'Geophysical Science Station',
        condition: 'Intact, solar arrays deployed',
        status: 'Decommissioned (Operated 21 days)',
      },
      {
        name: 'Laser Ranging Retroreflector (LRRR)',
        type: '100 Quartz Corner-Cube Prism Array',
        condition: 'Pristine, 100% optically reflective',
        status: 'Active (Routinely targeted by Earth laser observatories)',
      },
      {
        name: 'Commemorative Stainless Steel Plaque',
        type: 'Inscribed Astronaut Marker',
        condition: 'Mounted to forward landing leg strut',
        status: 'Preserved intact: "We came in peace for all mankind"',
      },
    ],
    chapters: [
      {
        id: 'a11-ch-1',
        chapterNumber: 1,
        title: 'WHY DID NASA LAUNCH IT?',
        subtitle: 'The Cold War Mandate & Lunar Geology',
        headline: 'A Decadal Race to Expand Human Horizon',
        narrativeText: [
          'In May 1961, President John F. Kennedy committed the United States to landing a human on the Moon before the decade concluded. Beyond the intense geopolitical rivalry of the Cold War, the mission aimed to answer fundamental scientific questions: Was the lunar surface made of ancient volcanic lava or pulverized dust deep enough to swallow a spacecraft? Could humans survive and perform rigorous scientific fieldwork outside Earth’s protective magnetic shield?',
          'Prior to Apollo 11, robotic precursor missions (Ranger, Lunar Orbiter, and Surveyor) mapped the surface and proved the ground had load-bearing strength. Now, NASA engineers needed to build the most sophisticated flying machines in human history to land two astronauts on an alien world and return them safely.',
        ],
        keyFacts: [
          { label: 'Primary Goal', value: 'First crewed lunar landing & return' },
          { label: 'Science Objective', value: 'Geological sampling & seismic deployment' },
          { label: 'Selected Landing Target', value: 'Mare Tranquillitatis (Site 2)' },
          { label: 'Crew', value: 'Armstrong (CDR), Aldrin (LMP), Collins (CMP)' },
        ],
        engineeringInsight:
          'NASA chose Mare Tranquillitatis because orbital reconnaissance showed a flat, smooth expanse with relatively low boulder density, maximizing landing safety margins.',
        photoUrl: '/images/apollo11_surface.jpg',
        photoCaption: 'Buzz Aldrin standing on Mare Tranquillitatis with LM Eagle reflected in his gold-coated visor (NASA AS11-40-5903).',
        photoNasaId: 'AS11-40-5903',
        cameraCue: {
          lat: 10.0,
          lon: 15.0,
          altitudeUnits: 6.5,
          focusEntity: 'global',
        },
      },
      {
        id: 'a11-ch-2',
        chapterNumber: 2,
        title: 'THE ROCKET AND LAUNCH',
        subtitle: 'The 363-Foot Saturn V Leviathan',
        headline: '7.5 Million Pounds of Thrust from Pad 39A',
        narrativeText: [
          'On the morning of July 16, 1969, at Kennedy Space Center Launch Complex 39A, the three-stage Saturn V rocket ignited its five colossal F-1 engines. Burning 15 metric tons of kerosene and liquid oxygen per second, the rocket produced 34.5 meganewtons (7.6 million pounds) of thrust.',
          'Stacked atop the third stage (S-IVB) sat the spacecraft assembly: the Command and Service Module (CSM Columbia) and the tucked Lunar Module (LM Eagle). In just eleven minutes, the vehicle reached a 185-kilometer parking orbit around Earth.',
        ],
        keyFacts: [
          { label: 'Launch Date', value: 'July 16, 1969 · 13:32:00 UTC' },
          { label: 'Launch Vehicle', value: 'Saturn V (SA-506)' },
          { label: 'Lift-Off Mass', value: '2,970,000 kg (6.5 million lbs)' },
          { label: 'Translunar Injection Speed', value: '39,000 km/h (Mach 32)' },
        ],
        engineeringInsight:
          'The Saturn V remains the only launch vehicle to carry humans beyond low Earth orbit. Its first stage burned all 2,100 metric tons of propellants in just 160 seconds.',
        photoUrl: '/images/apollo11_surface.jpg',
        photoCaption: 'Apollo 11 lifts off from Launch Pad 39A atop the Saturn V (NASA S69-39962).',
        photoNasaId: 'S69-39962',
        cameraCue: {
          lat: 28.5,
          lon: -80.6,
          altitudeUnits: 7.0,
          focusEntity: 'global',
        },
      },
      {
        id: 'a11-ch-3',
        chapterNumber: 3,
        title: 'THE JOURNEY THROUGH SPACE',
        subtitle: 'Translunar Coast & Lunar Orbit Insertion',
        headline: '384,400 Kilometers across the Trans-Lunar Void',
        narrativeText: [
          'Following Translunar Injection, command module pilot Michael Collins detached Columbia, flipped the spacecraft 180 degrees, and docked nose-to-nose with Eagle to extract it from the spent S-IVB booster. Over three quiet days of translunar coast, the spacecraft executed a "barbecue roll"—a continuous slow rotation along its long axis to distribute solar heating evenly.',
          'On July 19, the spacecraft fired its Service Propulsion System engine behind the lunar farside, entering an elliptical lunar orbit. The next morning, Armstrong and Aldrin crawled through the docking tunnel into Eagle, unfolded its four landing legs, and undocked from Columbia.',
        ],
        keyFacts: [
          { label: 'Transit Duration', value: '75 hours, 50 minutes' },
          { label: 'Translunar Distance', value: '384,400 km' },
          { label: 'Lunar Orbit Altitude', value: '111 km circular orbit' },
          { label: 'Undocking Call', value: '"Eagle has wings!"' },
        ],
        engineeringInsight:
          'The Apollo guidance computer (AGC) weighed only 32 kg and used magnetic core-rope memory with 72 kilobytes of ROM and 4 kilobytes of RAM—pioneering the silicon microchip revolution.',
        photoUrl: '/images/apollo11_surface.jpg',
        photoCaption: 'Lunar Module Eagle in lunar orbit prior to descent (NASA AS11-44-6574).',
        photoNasaId: 'AS11-44-6574',
        cameraCue: {
          lat: 5.0,
          lon: 40.0,
          altitudeUnits: 4.5,
          focusEntity: 'global',
        },
      },
      {
        id: 'a11-ch-4',
        chapterNumber: 4,
        title: 'LANDING AND EXPLORATION',
        subtitle: 'Powered Descent, West Crater & 1202 Alarms',
        headline: '"Houston, Tranquility Base Here. The Eagle Has Landed."',
        narrativeText: [
          'During powered descent, the Lunar Module Guidance Computer triggered multiple 1202 and 1201 program alarm overloads as the rendezvous radar flooded memory buffers. Mission control computer engineer Steve Bales determined the computer was shedding non-critical tasks and called a "GO".',
          'At 150 meters altitude, Armstrong looked out the triangular window and saw the automatic guidance was directing Eagle into a boulder-strewn crater the size of a football stadium (West Crater). Armstrong took semi-manual control, tilted the spacecraft forward to skim over the boulders, and touched down softly with only 25 seconds of descent fuel remaining. Six hours later, Neil Armstrong stepped onto the powdery regolith: "That’s one small step for man, one giant leap for mankind."',
        ],
        keyFacts: [
          { label: 'Touchdown Time', value: 'July 20, 1969 · 20:17:40 UTC' },
          { label: 'Surface Stay', value: '21 hours, 36 minutes' },
          { label: 'EVA Walk Duration', value: '2 hours, 31 minutes' },
          { label: 'Samples Collected', value: '21.55 kg of basalt and breccia' },
        ],
        engineeringInsight:
          'Each landing leg contained crushable honeycomb aluminum cartridges engineered to absorb vertical and lateral touchdown impact energy without bouncing.',
        photoUrl: '/images/apollo11_surface.jpg',
        photoCaption: 'Buzz Aldrin walks past the Lunar Module leg with the gold foil insulation visible (NASA AS11-40-5902).',
        photoNasaId: 'AS11-40-5902',
        cameraCue: {
          lat: 0.67408,
          lon: 23.47297,
          altitudeUnits: 1.1,
          obliqueAngle: 35,
          focusEntity: 'landing',
        },
      },
      {
        id: 'a11-ch-5',
        chapterNumber: 5,
        title: 'WHAT WAS LEFT BEHIND?',
        subtitle: 'The Forensic Inventory of Tranquility Base',
        headline: 'A Stationary Launch Pad and Scientific Monuments',
        narrativeText: [
          'Because every kilogram of weight saved on lunar liftoff reduced propellant requirements exponentially, the Lunar Module was built as a two-stage vehicle. The octagonal lower descent stage served as the launch pad when the ascent stage fired its 15.6 kN engine to return Armstrong and Aldrin to lunar orbit.',
          'Left behind on the basalt plain were the complete lower stage chassis, outrigger landing gear, empty propellant tanks, the Early Apollo Scientific Experiments Package (EASEP), the Laser Ranging Retroreflector (LRRR), seismic instruments, astronaut overshoes, cameras, tools, and the stainless-steel commemorative plaque.',
        ],
        keyFacts: [
          { label: 'Mass Left Behind', value: '2,034 kg of hardware' },
          { label: 'Major Left Component', value: 'Descent Stage (LM-5)' },
          { label: 'Active Instrument', value: 'Laser Ranging Retroreflector' },
          { label: 'Historical Plaque', value: '"July 1969, A.D. We came in peace"' },
        ],
        engineeringInsight:
          'The ascent stage fired directly against the top deck of the descent stage. Deflector blast shields vented supersonic rocket exhaust safely away from the hypergolic fuel tanks.',
        photoUrl: '/images/exhibits/eagle_plaque.jpg',
        photoCaption: 'The stainless steel commemorative plaque mounted on Eagle’s forward strut (NASA AS11-40-5899).',
        photoNasaId: 'AS11-40-5899',
        cameraCue: {
          lat: 0.67408,
          lon: 23.47297,
          altitudeUnits: 0.9,
          obliqueAngle: 42,
          focusEntity: 'hardware',
        },
      },
      {
        id: 'a11-ch-6',
        chapterNumber: 6,
        title: 'WHERE IS IT NOW?',
        subtitle: 'Preserved in the Lunar Vacuum for 55+ Years',
        headline: 'Resting Undisturbed at 0.67408° N, 23.47297° E',
        narrativeText: [
          'With no liquid water, atmosphere, or wind on the Moon, Tranquility Base remains in almost pristine physical condition. The golden Kapton thermal foil has endured over 700 lunar day-night cycles—cycling between +120°C in direct solar sunlight and -130°C in vacuum darkness every 29.5 Earth days.',
          'In 2009 and 2012, NASA’s Lunar Reconnaissance Orbiter (LRO) dipped to just 24 km above the surface, capturing sub-meter imagery of Tranquility Base. In frame M102287763LE, the octagonal descent stage, the dark footpaths trampled by Armstrong and Aldrin, and the bright glint of the LRRR laser reflector are clearly resolved.',
        ],
        keyFacts: [
          { label: 'Coordinates', value: '0.67408° N, 23.47297° E' },
          { label: 'Elevation', value: '-1,520 meters below lunar datum' },
          { label: 'Orbital Recon Frame', value: 'NASA LROC NAC M102287763LE' },
          { label: 'Status Today', value: 'Permanent World Heritage Site' },
        ],
        engineeringInsight:
          'Only micrometeorite bombardment and solar ultraviolet radiation degrade surface plastics over millions of years. Armstrong’s bootprints will remain visible for over 100,000 years.',
        photoUrl: '/images/exhibits/apollo_boot.jpg',
        photoCaption: 'Soil mechanics photograph of an astronaut bootprint pressed into regolith (NASA AS11-40-5877).',
        photoNasaId: 'AS11-40-5877',
        cameraCue: {
          lat: 0.67408,
          lon: 23.47297,
          altitudeUnits: 0.75,
          obliqueAngle: 30,
          focusEntity: 'final',
        },
      },
      {
        id: 'a11-ch-7',
        chapterNumber: 7,
        title: 'THE LEGACY',
        subtitle: 'The Dawn of Planetary Science & Lunar Exploration',
        headline: 'Rewriting Our Understanding of the Solar System',
        narrativeText: [
          'The 21.55 kilograms of lunar rocks returned by Apollo 11 overturned existing theories of Solar System formation. Radiometric dating revealed the mare basalts crystallized 3.7 billion years ago—far older than nearly all terrestrial rocks. Analysis of anorthosite fragments proved the early Moon was once engulfed in a global magma ocean.',
          'Furthermore, the Laser Ranging Retroreflector left on Mare Tranquillitatis is still in active operation today. By bouncing picosecond laser pulses off its quartz corner-cubes from McDonald Observatory and Côte d’Azur, physicists measured that the Moon is spiraling away from Earth at 3.8 cm per year, testing Einstein’s General Theory of Relativity.',
        ],
        keyFacts: [
          { label: 'Lunar Magma Ocean', value: 'Discovered through rock samples' },
          { label: 'Moon Drift Rate', value: '3.8 cm per year outward spiral' },
          { label: 'Scientific Publications', value: 'Over 3,500 peer-reviewed papers' },
          { label: 'Human Heritage', value: 'First human artifact on another world' },
        ],
        engineeringInsight:
          'Tranquility Base demonstrated that humanity can venture beyond our home planet, engineer machines that survive the hostile deep space vacuum, and unlock the cosmological history of our Solar System.',
        photoUrl: '/images/apollo11_surface.jpg',
        photoCaption: 'Earth rises above the airless lunar horizon, captured by the crew of Apollo 11 (NASA AS11-44-6552).',
        photoNasaId: 'AS11-44-6552',
        cameraCue: {
          lat: 5.0,
          lon: 30.0,
          altitudeUnits: 7.5,
          focusEntity: 'global',
        },
      },
    ],
  },

  // =========================================================================
  // 2. OPPORTUNITY ROVER — 14 YEARS ACROSS MARS (MER-B)
  // =========================================================================
  opportunity: {
    id: 'opportunity',
    missionName: 'Mars Exploration Rover B',
    spacecraftName: 'Opportunity Rover (MER-B)',
    planet: 'mars',
    launchYear: 2003,
    operator: 'NASA / JPL',
    heroImage: '/images/exhibits/opportunity.jpg',
    tagline: 'The Rover that Learned to Walk and Never Stopped',
    summary:
      'Engineered for a modest 90-sol design lifespan, the solar-powered Opportunity rover operated across the iron-oxide plains of Meridiani Planum for over 14 years. It proved ancient Mars possessed drinkable liquid groundwater, traversed deep impact craters, and completed the first planetary marathon.',
    hardwareInventory: [
      {
        name: 'Opportunity Rover (MER-B)',
        type: 'Six-Wheeled Rocker-Bogie Mobile Laboratory',
        condition: 'Parked intact on crater rim, solar panels dust-coated',
        status: 'Decommissioned in situ (Final contact Sol 5111)',
      },
      {
        name: 'Challenger Memorial Station',
        type: 'Tetrahedral Airbag Lander Petals',
        condition: 'Deflated airbags and landing petals in Eagle Crater',
        status: 'Intentionally left behind (Touchdown Sol 1)',
      },
      {
        name: 'Ablative Entry Heat Shield Debris',
        type: 'Fractured Phenolic Carbon Aeroshell',
        condition: 'Debris field beside "Heat Shield Rock" meteorite',
        status: 'Discarded on surface (Sol 345 inspection)',
      },
    ],
    chapters: [
      {
        id: 'opp-ch-1',
        chapterNumber: 1,
        title: 'WHY DID NASA LAUNCH IT?',
        subtitle: 'The "Follow the Water" Strategy',
        headline: 'Did Ancient Mars Have Sustained Liquid Water?',
        narrativeText: [
          'In the late 1990s, NASA adopted the overarching planetary science mandate: "Follow the Water". Orbital spectrometers aboard Mars Global Surveyor detected massive concentrations of gray crystalline hematite across the flat equatorial plain of Meridiani Planum. On Earth, gray hematite almost exclusively precipitates in standing bodies of liquid water or hydrothermal hot springs.',
          'NASA designed twin rovers—Spirit (MER-A) and Opportunity (MER-B)—to act as robotic field geologists equipped with microscopic imagers, rock abrasion tools, and spectrometers to examine the rocks up close.',
        ],
        keyFacts: [
          { label: 'Primary Question', value: 'Was liquid water once persistent on Mars?' },
          { label: 'Landing Target', value: 'Meridiani Planum hematite deposit' },
          { label: 'Design Lifespan', value: '90 Martian sols (1,000 meters drive)' },
          { label: 'Sister Rover', value: 'Spirit (MER-A) in Gusev Crater' },
        ],
        engineeringInsight:
          'Scientists nicknamed the rovers "robotic geologists" because their instrument deployment arm held the equivalent of a geologist’s rock hammer, magnifying hand lens, and chemical assay lab.',
        photoUrl: '/images/exhibits/mer_cleanroom.jpg',
        photoCaption: 'Engineers assembling Opportunity in the Spacecraft Assembly Facility cleanroom at JPL (NASA PIA04618).',
        photoNasaId: 'PIA04618',
        cameraCue: {
          lat: 0.0,
          lon: 340.0,
          altitudeUnits: 6.0,
          focusEntity: 'global',
        },
      },
      {
        id: 'opp-ch-2',
        chapterNumber: 2,
        title: 'THE ROCKET AND LAUNCH',
        subtitle: 'Delta II Heavy from Cape Canaveral',
        headline: 'A Sunset Launch on July 7, 2003',
        narrativeText: [
          'Opportunity launched atop a Delta II Heavy (7925H) rocket from Cape Canaveral Air Force Station Launch Complex 17B on July 7, 2003. The Heavy variant utilized nine larger GEM-46 strap-on solid rocket boosters to inject the heavier cruise stage directly into Mars transfer trajectory.',
          'The rover was folded origami-style inside a tetrahedral landing prism, enveloped by multi-layer kevlar airbags, and tucked inside a conical heat shield and backshell.',
        ],
        keyFacts: [
          { label: 'Launch Vehicle', value: 'Boeing Delta II Heavy (7925H-9.5)' },
          { label: 'Launch Date', value: 'July 7, 2003 · 23:18:15 EDT' },
          { label: 'Earth-Mars Distance', value: '456 million kilometers traveled' },
          { label: 'Launch Pad', value: 'CCAFS SLC-17B, Florida' },
        ],
        engineeringInsight:
          'Because the launch took place during a planetary alignment occurring only every 26 months, the launch window was restricted to just 44 minutes each evening.',
        photoUrl: '/images/exhibits/mer_cleanroom.jpg',
        photoCaption: 'Delta II rocket lifts off carrying Opportunity to Mars (NASA KSC-03PD-1801).',
        photoNasaId: 'KSC-03PD-1801',
        cameraCue: {
          lat: 10.0,
          lon: 350.0,
          altitudeUnits: 7.0,
          focusEntity: 'global',
        },
      },
      {
        id: 'opp-ch-3',
        chapterNumber: 3,
        title: 'THE JOURNEY THROUGH SPACE',
        subtitle: '202 Days of Interplanetary Cruise',
        headline: 'Spin-Stabilized Transit to the Red Planet',
        narrativeText: [
          'Over a six-month interplanetary voyage, Opportunity’s cruise stage spun at 2 revolutions per minute to maintain orientation toward Earth and the Sun. Deep Space Network antennae in California, Spain, and Australia tracked minute Doppler shifts in radio telemetry.',
          'Navigators executed three critical trajectory correction maneuvers (TCMs), adjusting thruster firings by millimeters per second to thread the spacecraft through a narrow 10-kilometer atmospheric entry corridor at Mars.',
        ],
        keyFacts: [
          { label: 'Cruise Duration', value: '202 days' },
          { label: 'Cruise Velocity', value: '19,300 km/h (relative to Sun)' },
          { label: 'Trajectory Maneuvers', value: '3 precision burns' },
          { label: 'Entry Corridor Accuracy', value: 'Targeted within 0.1 degrees' },
        ],
        engineeringInsight:
          'During cruise, star scanners and sun sensors provided autonomous attitude updates, allowing onboard computers to compensate for solar radiation pressure drift.',
        photoUrl: '/images/exhibits/opportunity.jpg',
        photoCaption: 'Opportunity rover cruise stage diagram in interplanetary transit (NASA PIA04415).',
        photoNasaId: 'PIA04415',
        cameraCue: {
          lat: -2.0,
          lon: 354.0,
          altitudeUnits: 4.8,
          focusEntity: 'global',
        },
      },
      {
        id: 'opp-ch-4',
        chapterNumber: 4,
        title: 'LANDING AND EXPLORATION',
        subtitle: 'The "Hole-in-One" Bounce into Eagle Crater',
        headline: 'A 45-Kilometer Odyssey Across Basalt Plains and Craters',
        narrativeText: [
          'On January 25, 2004, Opportunity slammed into the Martian atmosphere at 19,000 km/h. Its heat shield decelerated the vehicle to supersonic speeds before parachute deployment, followed by retro-rocket firings and airbag inflation. In an extraordinary planetary coincidence, the bouncing airbag bundle rolled into a 22-meter impact crater (Eagle Crater)—achieving an interplanetary "hole-in-one".',
          'When the lander petals opened, Opportunity’s cameras captured bright layered bedrock just 10 meters away. Over the next 14 years, Opportunity drove 45.16 kilometers, exploring deep impact craters (Endurance, Victoria, Santa Maria, and Endeavour) and discovering hematite spherules, jarosite minerals, and clay strata formed in ancient neutral-pH water.',
        ],
        keyFacts: [
          { label: 'Total Distance Driven', value: '45.16 km (28.06 miles)' },
          { label: 'Total Sols Operated', value: '5,352 Martian sols (14.5 years)' },
          { label: 'Images Returned', value: '217,594 raw science images' },
          { label: 'Marathon Milestone', value: 'Completed 42.195 km on Sol 3948' },
        ],
        engineeringInsight:
          'Opportunity’s rocker-bogie suspension system allowed the rover to drive over rocks twice the diameter of its wheels without body tilting or losing traction.',
        photoUrl: '/images/exhibits/opportunity.jpg',
        photoCaption: 'Panoramic mosaic of Victoria Crater captured by Opportunity’s Pancam (NASA PIA08813).',
        photoNasaId: 'PIA08813',
        cameraCue: {
          lat: -1.9462,
          lon: 354.4734,
          altitudeUnits: 1.2,
          obliqueAngle: 35,
          focusEntity: 'route',
        },
      },
      {
        id: 'opp-ch-5',
        chapterNumber: 5,
        title: 'WHAT WAS LEFT BEHIND?',
        subtitle: 'A Trail of Artifacts Across Meridiani Planum',
        headline: 'Lander Petals, Heat Shield Debris, and Rover Tracks',
        narrativeText: [
          'Throughout its 14-year traverse, Opportunity left behind a trail of historical artifacts across Meridiani Planum. In Eagle Crater sits the Challenger Memorial Station lander base with its deflated airbags. On Sol 345, the rover drove past its own jettisoned heat shield, discovering a basketball-sized iron-nickel meteorite ("Heat Shield Rock") sitting right beside the charred carbon composite.',
          'Along its 45-kilometer path, Opportunity also drilled over 50 circular holes into Martian bedrock using its diamond-tipped Rock Abrasion Tool (RAT), leaving behind permanent millimeter-scale cores for future planetary archaeologists to inspect.',
        ],
        keyFacts: [
          { label: 'Lander Base', value: 'Eagle Crater (Challenger Memorial Station)' },
          { label: 'Jettisoned Heat Shield', value: 'Located at 1.968° S, 354.502° E' },
          { label: 'Meteorite Discovery', value: 'Heat Shield Rock (first meteorite on Mars)' },
          { label: 'Abrasion Drill Sites', value: '52 rock cores ground into bedrock' },
        ],
        engineeringInsight:
          'The rover’s rock abrasion tool ground away 5 millimeters of weathered exterior rock, exposing pristine interior minerals that had been sealed from the atmosphere for billions of years.',
        photoUrl: '/images/exhibits/opp_heatshield_rock.jpg',
        photoCaption: 'Opportunity heat shield wreckage beside Heat Shield Rock (NASA PIA07269).',
        photoNasaId: 'PIA07269',
        cameraCue: {
          lat: -1.968,
          lon: 354.502,
          altitudeUnits: 0.9,
          obliqueAngle: 40,
          focusEntity: 'hardware',
        },
      },
      {
        id: 'opp-ch-6',
        chapterNumber: 6,
        title: 'WHERE IS IT NOW?',
        subtitle: 'Perseverance Valley on the Rim of Endeavour Crater',
        headline: 'Resting at 2.340° S, 354.670° E After the 2018 Dust Storm',
        narrativeText: [
          'In May 2018, an enormous planet-encircling dust storm swept across Mars, blocking sunlight and turning Martian daylight into pitch-black darkness. Opportunity was parked on the upper western rim of Endeavour Crater in a sinuous gully called Perseverance Valley.',
          'With solar panels unable to generate power, the rover entered low-power hibernation on Sol 5,111 (June 10, 2018). Engineers transmitted over a thousand recovery commands via the Deep Space Network. On February 13, 2019, NASA officially declared the mission complete. In September 2018, NASA’s MRO HiRISE camera spotted Opportunity as a tiny metallic dot resting peacefully on the rim of Endeavour Crater.',
        ],
        keyFacts: [
          { label: 'Final Coordinates', value: '2.340° S, 354.670° E' },
          { label: 'Location Name', value: 'Perseverance Valley, Endeavour Crater' },
          { label: 'Elevation', value: '-1,390 meters (MOLA datum)' },
          { label: 'HiRISE Identification', value: 'MRO HiRISE frame ESP_056957_1775' },
        ],
        engineeringInsight:
          'Opportunity survived for over 5,000 sols because natural Martian dust devils periodically blew dust off its solar arrays in spontaneous "cleaning events".',
        photoUrl: '/images/exhibits/opportunity.jpg',
        photoCaption: 'HiRISE orbital image showing Opportunity parked in Perseverance Valley (NASA/JPL/UA HiRISE).',
        photoNasaId: 'ESP_056957_1775',
        cameraCue: {
          lat: -2.34,
          lon: 354.67,
          altitudeUnits: 0.8,
          obliqueAngle: 30,
          focusEntity: 'final',
        },
      },
      {
        id: 'opp-ch-7',
        chapterNumber: 7,
        title: 'THE LEGACY',
        subtitle: 'Proving That Ancient Mars Was a Wet, Habitable World',
        headline: 'Rewriting Martian History and Inspiring Future Rovers',
        narrativeText: [
          'Opportunity transformed Mars from a theoretical cold desert into a dynamic planetary world with a rich hydrological history. Its discovery of hematite blueberries, sulfate-rich sandstones, and smectite clay minerals proved that ancient Mars possessed neutral-pH, habitable water for extended epochs of time.',
          'Its engineering endurance demonstrated that wheeled rovers could navigate dune fields, climb mountain ridges, and survive severe winters on another world. The operational lessons learned on Opportunity laid the technological foundations for NASA’s subsequent nuclear-powered rovers, Curiosity and Perseverance.',
        ],
        keyFacts: [
          { label: 'Historic Record', value: 'Longest off-world distance driven (45.16 km)' },
          { label: 'Key Discovery', value: 'Smectite clays & neutral-pH habitable water' },
          { label: 'Engineering Feat', value: 'Operated 57 times beyond planned design' },
          { label: 'Cultural Impact', value: '"My battery is low and it is getting dark"' },
        ],
        engineeringInsight:
          'Opportunity proved that autonomous hazard avoidance software and visual odometry algorithms could enable a rover to navigate complex Martian terrain safely without waiting for human commands from Earth.',
        photoUrl: '/images/exhibits/opportunity.jpg',
        photoCaption: 'A Martian sunset over Gusev Crater captured by Spirit (NASA PIA07997).',
        photoNasaId: 'PIA07997',
        cameraCue: {
          lat: -2.0,
          lon: 354.0,
          altitudeUnits: 6.5,
          focusEntity: 'global',
        },
      },
    ],
  },
};

export function getMissionStoryById(id: string): CompleteMissionStory | undefined {
  return MISSION_STORIES[id];
}
