/**
 * AFTERLIGHT — Signal & Stone Design Tokens
 * 
 * Foundational Palette:
 * - Obsidian: #111416 (Deep foundational dark surface)
 * - Meteorite: #343A39 (Industrial stone surface border & structure)
 * - Archive Bone: #EEE7D9 (Warm neutral editorial typography)
 * 
 * Accents:
 * - Signal Vermilion: #F05A38 (Primary interactive accent & Mars)
 * - Lunar Lichen: #B9C96A (Scientific discovery & Moon)
 * - Oxidized Teal: #28645F (Deep space context & scientific metadata)
 */

export const TOKENS = {
  colors: {
    // Primary Foundational
    obsidian: '#111416',
    meteorite: '#343A39',
    archiveBone: '#EEE7D9',

    // Surfaces
    surface: '#1B2020',
    surfaceRaised: '#252B29',
    surfaceBorder: '#343A39',

    // Neutrals
    textPrimary: '#EEE7D9',
    textSecondary: '#B8B3A8',
    textMuted: '#85877F',

    // Accents
    signalVermilion: '#F05A38',
    lunarLichen: '#B9C96A',
    oxidizedTeal: '#28645F',
  },
  destinations: {
    moon: {
      id: 'moon',
      name: 'THE MOON',
      accent: '#B9C96A',
      accentMuted: 'rgba(185, 201, 106, 0.18)',
      accentBorder: 'rgba(185, 201, 106, 0.45)',
      character: 'Archaeological · Historical · Mineral',
    },
    mars: {
      id: 'mars',
      name: 'MARS',
      accent: '#F05A38',
      accentMuted: 'rgba(240, 90, 56, 0.18)',
      accentBorder: 'rgba(240, 90, 56, 0.45)',
      character: 'Geological · Exploratory · Adventurous',
    },
    deep_space: {
      id: 'deep_space',
      name: 'DEEP SPACE',
      accent: '#28645F',
      accentMuted: 'rgba(40, 100, 95, 0.25)',
      accentBorder: 'rgba(40, 100, 95, 0.55)',
      character: 'Interstellar · Atmospheric · Isolated',
    },
  },
} as const;

export type DestinationThemeKey = keyof typeof TOKENS.destinations;

export function getDestinationTheme(destId: string) {
  if (destId === 'mars') return TOKENS.destinations.mars;
  if (destId === 'deep_space') return TOKENS.destinations.deep_space;
  return TOKENS.destinations.moon;
}

