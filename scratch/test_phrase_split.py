import re

script = "Welcome! You're looking at the Apollo Lunar Surface Experiments Package, commonly known as ALSEP. NASA astronauts deployed these scientific instruments across several Apollo landing sites between 1969 and 1972. Their purpose was to turn the Moon into a long-term scientific laboratory. Powered by nuclear SNAP-27 radioisotope thermoelectric generators, each package operated independently of the spacecraft, transmitting continuous environmental data back to Earth. They measured moonquakes, magnetic fields and heat flowing from beneath the lunar surface. Even after the astronauts returned to Earth, these instruments continued collecting valuable scientific data. Together, they logged more than twelve thousand moonquakes, proved the Moon has a partially molten core, and functioned across eight years of unattended lunar nights. When NASA turned off telemetry in September 1977, the stations remained on the surface. Today, five ALSEP arrays remain on the Moon, and their passive laser retroreflector mirrors still reflect laser beams from Earth telescopes."

def split_into_phrases(text):
    # Split on sentence boundaries and natural punctuation pauses
    raw_sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    phrases = []
    for s in raw_sentences:
        s = s.strip()
        if not s:
            continue
        # If very long (>95 chars), split at semicolon or comma + space
        if len(s) > 95 and (';' in s or ', ' in s):
            parts = re.split(r'(?<=;)\s+|,\s+(?=[A-Z]|and\s|transmitting\s|proved\s)', s)
            for p in parts:
                p = p.strip()
                if p:
                    phrases.append(p)
        else:
            phrases.append(s)
    return phrases

def determine_pose(phrase, index, total):
    p = phrase.lower()
    # Concluding if near end or conclusion keywords
    if index >= total - 2 or any(k in p for k in ['today', 'remains', 'enduring', 'legacy', 'still reflect', 'conclude']):
        return 'concluding'
    # Pointing sideways if directing attention
    if any(k in p for k in ["you're looking at", "here is", "this is", "these instruments", "look at", "deployed", "left behind", "array"]):
        return 'pointing_sideways'
    # Thinking if question, wonder, reason
    if any(k in p for k in ['why', 'how', 'purpose', 'designed', 'wondered', 'whether', 'question']):
        return 'thinking'
    # Excited if milestone, achievement, exclamation
    if any(k in p for k in ['proved', 'discovered', 'valuable', 'incredible', 'astonishing', 'unattended', '!']):
        return 'excited'
    # Pointing up if key numbers, facts, nuclear, critical specs
    if any(k in p for k in ['twelve thousand', 'eight years', 'snap-27', 'nuclear', 'measured', 'first', '1969', '1972', '1977']):
        return 'pointing_up'
    return 'explaining'

phrases = split_into_phrases(script)
for i, phrase in enumerate(phrases):
    pose = determine_pose(phrase, i, len(phrases))
    print(f'{i+1}. [{pose}]: "{phrase}"')

