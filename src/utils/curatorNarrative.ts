import { CharacterPose } from '../types';

export interface NarrationPhrase {
  id: number;
  text: string;
  startChar: number;
  endChar: number;
  pose: CharacterPose;
  pauseAfterMs: number;
}

/**
 * Intelligent context-aware pose selector based on semantic keywords,
 * storytelling progression, and narrative intent.
 */
export function determinePoseForPhrase(
  phrase: string,
  index: number,
  total: number,
  isComponent: boolean = false
): CharacterPose {
  const p = phrase.toLowerCase();

  // If introducing or inspecting a component, direct attention to it
  if (isComponent && index === 0) {
    return 'pointing_sideways';
  }

  // Concluding pose for final phrases or legacy statements
  if (
    index >= Math.max(1, total - 2) ||
    p.includes('today') ||
    p.includes('remains') ||
    p.includes('legacy') ||
    p.includes('enduring') ||
    p.includes('still reflect') ||
    p.includes('conclude') ||
    p.includes('final') ||
    p.includes('in the end') ||
    p.includes('forever') ||
    p.includes('symbol of endurance') ||
    p.includes('monument')
  ) {
    return 'concluding';
  }

  // Pointing sideways: directing visitor attention to specific artifact / hardware
  if (
    p.includes("you're looking at") ||
    p.includes('look closely') ||
    p.includes('look at') ||
    p.includes('here is') ||
    p.includes('this is') ||
    p.includes('these instruments') ||
    p.includes('standing before you') ||
    p.includes('deployed') ||
    p.includes('left behind') ||
    p.includes('array') ||
    p.includes('lander') ||
    p.includes('antenna') ||
    p.includes('chassis') ||
    p.includes('camera') ||
    p.includes('rover') ||
    p.includes('station')
  ) {
    return 'pointing_sideways';
  }

  // Thinking: questions, reflective moments, design challenges
  if (
    p.includes('?') ||
    p.includes('why') ||
    p.includes('how') ||
    p.includes('purpose') ||
    p.includes('wondered') ||
    p.includes('whether') ||
    p.includes('question') ||
    p.includes('challenge') ||
    p.includes('imagine') ||
    p.includes('remarkable thing') ||
    p.includes('designed to survive')
  ) {
    return 'thinking';
  }

  // Excited: discoveries, milestones, achievements
  if (
    p.includes('!') ||
    p.includes('proved') ||
    p.includes('discovered') ||
    p.includes('breakthrough') ||
    p.includes('astonishing') ||
    p.includes('incredible') ||
    p.includes('unattended') ||
    p.includes('valuable') ||
    p.includes('thriving') ||
    p.includes('unlocked') ||
    p.includes('record') ||
    p.includes('summit') ||
    p.includes('first time')
  ) {
    return 'excited';
  }

  // Pointing up: critical facts, quantitative measurements, mission specs
  if (
    p.includes('twelve thousand') ||
    p.includes('eight years') ||
    p.includes('fourteen years') ||
    p.includes('5,111') ||
    p.includes('forty-five kilometers') ||
    p.includes('nuclear') ||
    p.includes('snap-27') ||
    p.includes('measured') ||
    p.includes('first') ||
    p.includes('plutonium') ||
    p.includes('kilometers') ||
    p.includes('degrees') ||
    p.includes('1967') ||
    p.includes('1969') ||
    p.includes('1971') ||
    p.includes('1972') ||
    p.includes('1977') ||
    p.includes('1997') ||
    p.includes('2004') ||
    p.includes('2018') ||
    p.includes('2022')
  ) {
    return 'pointing_up';
  }

  // Default storytelling explanation
  return 'explaining';
}

/**
 * Calculates a natural documentary pause duration based on ending punctuation.
 */
function calculatePauseDuration(text: string): number {
  const trimmed = text.trim();
  if (trimmed.endsWith('...') || trimmed.endsWith('…')) return 520;
  if (trimmed.endsWith('?')) return 480;
  if (trimmed.endsWith('!')) return 420;
  if (trimmed.endsWith(';') || trimmed.endsWith('—')) return 360;
  if (trimmed.endsWith('.')) return 340;
  if (trimmed.endsWith(',')) return 240;
  return 280;
}

/**
 * Splits a full narration script into discrete, rhythmically paced storytelling phrases
 * tailored for natural documentary voice delivery and real-time speech bubble synchronization.
 */
export function parseScriptIntoPhrases(
  script: string,
  isComponent: boolean = false
): NarrationPhrase[] {
  if (!script || !script.trim()) return [];

  // Match sentences, ellipses boundaries, and major thoughts
  // Handles ellipses '...', em dashes '—', semicolons ';', and standard sentence terminators
  const rawSegments = script
    .replace(/\.\.\./g, '…')
    .match(/[^.!?…;—]+[.!?…;—]+(?:\s+|$)|[^.!?…;—]+$/g) || [script];

  const phrases: NarrationPhrase[] = [];
  let cumulative = 0;

  for (let i = 0; i < rawSegments.length; i++) {
    // Restore ellipses
    const raw = rawSegments[i].replace(/…/g, '...');
    const trimmed = raw.trim();
    if (!trimmed) {
      cumulative += rawSegments[i].length;
      continue;
    }

    // If an individual segment is still quite long (> 95 characters), split on natural clause boundaries
    if (trimmed.length > 95 && (trimmed.includes(', ') || trimmed.includes(' - '))) {
      const clauses = trimmed.split(/,\s+(?=[A-Z]|and\s|which\s|while\s|transmitting\s|proved\s|measuring\s|leaving\s|finding\s|allowing\s)/);
      let clauseOffset = 0;

      for (let cIdx = 0; cIdx < clauses.length; cIdx++) {
        const clause = clauses[cIdx];
        const cTrimmed = clause.trim();
        if (cTrimmed) {
          const matchIdx = raw.indexOf(cTrimmed, clauseOffset);
          const start = cumulative + (matchIdx >= 0 ? matchIdx : clauseOffset);
          const end = start + cTrimmed.length;
          clauseOffset = (matchIdx >= 0 ? matchIdx : clauseOffset) + cTrimmed.length;

          // Preserve punctuation for spoken cadence
          const formattedText = cIdx < clauses.length - 1 && !/[.,;?!—]$/.test(cTrimmed)
            ? `${cTrimmed},`
            : cTrimmed;

          phrases.push({
            id: phrases.length,
            text: formattedText,
            startChar: start,
            endChar: end,
            pose: determinePoseForPhrase(cTrimmed, phrases.length, rawSegments.length, isComponent),
            pauseAfterMs: calculatePauseDuration(formattedText),
          });
        }
      }
      cumulative += rawSegments[i].length;
    } else {
      const matchIdx = raw.indexOf(trimmed);
      const start = cumulative + (matchIdx >= 0 ? matchIdx : 0);
      const end = start + trimmed.length;
      cumulative += rawSegments[i].length;

      phrases.push({
        id: phrases.length,
        text: trimmed,
        startChar: start,
        endChar: end,
        pose: determinePoseForPhrase(trimmed, phrases.length, rawSegments.length, isComponent),
        pauseAfterMs: calculatePauseDuration(trimmed),
      });
    }
  }

  // Final fallback
  if (phrases.length === 0 && script.trim()) {
    phrases.push({
      id: 0,
      text: script.trim(),
      startChar: 0,
      endChar: script.length,
      pose: 'explaining',
      pauseAfterMs: 350,
    });
  }

  return phrases;
}
