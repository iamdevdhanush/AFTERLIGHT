import { CharacterPose } from '../types';

export interface NarrationPhrase {
  id: number;
  text: string;
  startChar: number;
  endChar: number;
  pose: CharacterPose;
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
    p.includes('in the end')
  ) {
    return 'concluding';
  }

  // Pointing sideways: directing visitor attention to specific artifact / hardware
  if (
    p.includes("you're looking at") ||
    p.includes('look at') ||
    p.includes('here is') ||
    p.includes('this is') ||
    p.includes('these instruments') ||
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
    p.includes('unlocked')
  ) {
    return 'excited';
  }

  // Pointing up: critical facts, quantitative measurements, mission specs
  if (
    p.includes('twelve thousand') ||
    p.includes('eight years') ||
    p.includes('nuclear') ||
    p.includes('snap-27') ||
    p.includes('measured') ||
    p.includes('first') ||
    p.includes('plutonium') ||
    p.includes('kilometers') ||
    p.includes('degrees') ||
    p.includes('1969') ||
    p.includes('1971') ||
    p.includes('1972') ||
    p.includes('1977')
  ) {
    return 'pointing_up';
  }

  // Default storytelling explanation
  return 'explaining';
}

/**
 * Splits a full narration script into short, readable phrases
 * with character offsets matching GuideVoiceEngine.
 */
export function parseScriptIntoPhrases(
  script: string,
  isComponent: boolean = false
): NarrationPhrase[] {
  if (!script || !script.trim()) return [];

  const rawSentences = script.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [script];
  const phrases: NarrationPhrase[] = [];
  let cumulative = 0;

  for (let i = 0; i < rawSentences.length; i++) {
    const raw = rawSentences[i];
    const trimmed = raw.trim();
    if (!trimmed) {
      cumulative += raw.length;
      continue;
    }

    // Split long sentences (> 85 characters) at natural grammatical pauses
    if (trimmed.length > 85 && (trimmed.includes(';') || trimmed.includes(', '))) {
      const clauses = trimmed.split(/(?<=;)\s+|,\s+(?=[A-Z]|and\s|transmitting\s|proved\s|measuring\s|linked\s)/);
      let clauseOffset = 0;

      for (const clause of clauses) {
        const cTrimmed = clause.trim();
        if (cTrimmed) {
          const matchIdx = raw.indexOf(cTrimmed, clauseOffset);
          const start = cumulative + (matchIdx >= 0 ? matchIdx : clauseOffset);
          const end = start + cTrimmed.length;
          clauseOffset = (matchIdx >= 0 ? matchIdx : clauseOffset) + cTrimmed.length;

          phrases.push({
            id: phrases.length,
            text: cTrimmed,
            startChar: start,
            endChar: end,
            pose: determinePoseForPhrase(cTrimmed, phrases.length, rawSentences.length, isComponent),
          });
        }
      }
      cumulative += raw.length;
    } else {
      const matchIdx = raw.indexOf(trimmed);
      const start = cumulative + (matchIdx >= 0 ? matchIdx : 0);
      const end = start + trimmed.length;
      cumulative += raw.length;

      phrases.push({
        id: phrases.length,
        text: trimmed,
        startChar: start,
        endChar: end,
        pose: determinePoseForPhrase(trimmed, phrases.length, rawSentences.length, isComponent),
      });
    }
  }

  // Final sanity fallback
  if (phrases.length === 0 && script.trim()) {
    phrases.push({
      id: 0,
      text: script.trim(),
      startChar: 0,
      endChar: script.length,
      pose: 'explaining',
    });
  }

  return phrases;
}

