const { parseScriptIntoPhrases } = require('./curator_test_helper.cjs');

const script = "Welcome! You're looking at the Apollo Lunar Surface Experiments Package, commonly known as ALSEP. NASA astronauts deployed these scientific instruments across several Apollo landing sites between 1969 and 1972. Their purpose was to turn the Moon into a long-term scientific laboratory. Powered by nuclear SNAP-27 radioisotope thermoelectric generators, each package operated independently of the spacecraft, transmitting continuous environmental data back to Earth. They measured moonquakes, magnetic fields and heat flowing from beneath the lunar surface. Even after the astronauts returned to Earth, these instruments continued collecting valuable scientific data. Together, they logged more than twelve thousand moonquakes, proved the Moon has a partially molten core, and functioned across eight years of unattended lunar nights. When NASA turned off telemetry in September 1977, the stations remained on the surface. Today, five ALSEP arrays remain on the Moon, and their passive laser retroreflector mirrors still reflect laser beams from Earth telescopes.";

// Let's test phrase index calculation
const phrases = [];
const rawSentences = script.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [script];
let cumulative = 0;
for (const s of rawSentences) {
  const trimmed = s.trim();
  const start = cumulative + s.indexOf(trimmed);
  const end = start + trimmed.length;
  cumulative += s.length;
  phrases.push({ text: trimmed, startChar: start, endChar: end });
}

console.log('Total phrases:', phrases.length);
phrases.forEach((p, i) => console.log(i, `[${p.startChar}-${p.endChar}]`, p.text.slice(0, 30)));

[0, 10, 50, 120, 250, 400, 600, 800, 1000].forEach(charIdx => {
  const foundIdx = phrases.findIndex(
    (p, i) => charIdx >= p.startChar && (i === phrases.length - 1 || charIdx < phrases[i + 1].startChar)
  );
  console.log(`charIdx ${charIdx} -> phrase ${foundIdx}: "${phrases[foundIdx]?.text.slice(0, 25)}"`);
});

