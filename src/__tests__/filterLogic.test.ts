import { describe, it, expect } from 'vitest';
import { MOON_SITES, MARS_SITES, ALL_PLANETARY_SITES, getSitesForPlanet } from '../modules/planetary-archaeology/data/planetarySites';
import { HardwareFilterOptions } from '../modules/planetary-archaeology/types/planetary';

describe('Planetary Archaeology Filtering Logic', () => {
  it('loads distinct datasets for Moon and Mars', () => {
    const moonSites = getSitesForPlanet('moon');
    const marsSites = getSitesForPlanet('mars');
    expect(moonSites.length).toBeGreaterThan(15);
    expect(marsSites.length).toBeGreaterThan(10);
    expect(ALL_PLANETARY_SITES.length).toBe(moonSites.length + marsSites.length);
  });

  it('filters by category correctly', () => {
    const rovers = ALL_PLANETARY_SITES.filter((s) => s.category === 'rover');
    expect(rovers.length).toBeGreaterThan(0);
    rovers.forEach((r) => {
      expect(r.category).toBe('rover');
    });
  });

  it('filters by location confidence level', () => {
    const confirmed = ALL_PLANETARY_SITES.filter((s) => s.locationConfidence === 'confirmed');
    expect(confirmed.length).toBeGreaterThan(0);
    confirmed.forEach((c) => {
      expect(c.locationConfidence).toBe('confirmed');
      expect(c.confidenceReason).toBeDefined();
    });
  });

  it('filters by launch year range', () => {
    const apolloEra = ALL_PLANETARY_SITES.filter((s) => s.year >= 1968 && s.year <= 1972);
    expect(apolloEra.length).toBeGreaterThan(0);
    apolloEra.forEach((s) => {
      expect(s.year).toBeGreaterThanOrEqual(1968);
      expect(s.year).toBeLessThanOrEqual(1972);
    });
  });

  it('every site contains valid official citation sources', () => {
    ALL_PLANETARY_SITES.forEach((site) => {
      expect(site.officialSources.length).toBeGreaterThan(0);
      site.officialSources.forEach((src) => {
        expect(src.title).toBeTruthy();
        expect(src.organization).toBeTruthy();
        expect(src.url.startsWith('http')).toBe(true);
      });
    });
  });
});
