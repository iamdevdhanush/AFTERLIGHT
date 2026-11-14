import { PlanetaryBody, PlanetaryLayerSpec, ImageryLayerType } from '../types/planetary';

/**
 * Technical Specifications for NASA Solar System Treks (Moon Trek and Mars Trek)
 * 
 * Standards: OGC Web Map Tile Service (WMTS) 1.0.0 RESTful Specification
 * Projections:
 *   - EQ: Equirectangular (Global, cylindrical equidistant, standard planetocentric degrees)
 *   - NP: North Polar Stereographic
 *   - SP: South Polar Stereographic
 * 
 * Tile Matrix Set: default028mm
 * Tile Dimensions: 256 x 256 pixels
 * Tile Matrix (Zoom levels): Level 0 (2x1 tiles), Level 1 (4x2 tiles), up to Level 8+
 * CORS Header: Access-Control-Allow-Origin: * (confirmed for image tiles)
 * 
 * Data Sources:
 * - NASA Lunar Reconnaissance Orbiter (LRO) LROC & LOLA
 * - NASA Mars Global Surveyor (MGS) MOLA
 * - NASA Mars Reconnaissance Orbiter (MRO) CTX & HiRISE
 * - USGS Astrogeology Science Center
 */

export const PLANETARY_LAYERS: Record<PlanetaryBody, Record<ImageryLayerType, PlanetaryLayerSpec>> = {
  moon: {
    visible: {
      id: 'moon-visible-lroc',
      name: 'LROC WAC Global Morphology Mosaic',
      type: 'visible',
      provider: 'NASA Moon Trek',
      instrument: 'LROC',
      description: 'Global 100m/pixel morphology mosaic acquired by the Lunar Reconnaissance Orbiter Camera (LROC) Wide Angle Camera (WAC) under low-Sun illumination, highlighting fine surface regolith texture, impact crater rims, and volcanic mare boundaries.',
      resolution: '100 m/pixel (Global 303 PPD)',
      localTextureUrl: '/textures/moon/lroc_color_2k.jpg',
      localDemUrl: '/textures/moon/ldem_3_8bit.jpg',
      wmtsEndpoint: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/',
      wmtsLayerName: 'LRO_WAC_Mosaic_Global_303ppd_v02',
      hasElevationData: true,
      citation: 'NASA / GSFC / Arizona State University (LROC Team)',
    },
    elevation: {
      id: 'moon-elevation-lola',
      name: 'LOLA Color Shaded Relief Topography',
      type: 'elevation',
      provider: 'NASA Moon Trek',
      instrument: 'LOLA',
      description: 'Global elevation model from the Lunar Orbiter Laser Altimeter (LOLA) with hypsometric color tinting. Depicts the profound depth of the South Pole–Aitken Basin (-9 km) through the highest peaks of the farside highlands (+10.7 km).',
      resolution: '118 m/pixel (128 PPD)',
      localTextureUrl: '/textures/moon/ldem_3_8bit.jpg',
      localDemUrl: '/textures/moon/ldem_3_8bit.jpg',
      wmtsEndpoint: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_ClrShade_Global_118m/1.0.0/',
      wmtsLayerName: 'LRO_LOLA_ClrShade_Global_118m',
      hasElevationData: true,
      citation: 'NASA Goddard Space Flight Center / LOLA Science Team',
    },
    shaded_relief: {
      id: 'moon-dem-relief',
      name: 'LOLA Grayscale Surface DEM Slope & Relief',
      type: 'shaded_relief',
      provider: 'NASA SVS',
      instrument: 'LOLA',
      description: 'Direct 8-bit digital elevation model from LOLA altimetry, capturing crater wall gradients, central peaks, and rille structures without photometric albedo bias.',
      resolution: '118 m/pixel (LOLA DEM)',
      localTextureUrl: '/textures/moon/ldem_3_8bit.jpg',
      localDemUrl: '/textures/moon/ldem_3_8bit.jpg',
      wmtsEndpoint: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_Global_DEM_118m/1.0.0/',
      wmtsLayerName: 'LRO_LOLA_Global_DEM_118m',
      hasElevationData: true,
      citation: 'NASA SVS CGI Moon Kit / LRO LOLA Team',
    },
  },
  mars: {
    visible: {
      id: 'mars-visible-viking',
      name: 'Mars Viking MDIM 2.1 Color Mosaic',
      type: 'visible',
      provider: 'NASA Mars Trek',
      instrument: 'Viking MDIM',
      description: 'Controlled color-balanced mosaic synthesized from thousands of Viking Orbiter images, calibrated by MOLA topography to yield photometrically accurate surface albedo from the polar ice caps to the dark basaltic lowlands.',
      resolution: '232 m/pixel (MDIM 2.1)',
      localTextureUrl: '/textures/mars/mars_color_2k.jpg',
      localDemUrl: '/textures/mars/mars_mola_dem_1024.jpg',
      wmtsEndpoint: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/',
      wmtsLayerName: 'Mars_Viking_MDIM21_ClrMosaic_global_232m',
      hasElevationData: true,
      citation: 'USGS Astrogeology Science Center / NASA Planetary Geology Program',
    },
    elevation: {
      id: 'mars-elevation-mola',
      name: 'MGS MOLA Color Shaded Topographic Relief',
      type: 'elevation',
      provider: 'NASA Mars Trek',
      instrument: 'MOLA',
      description: 'Laser altimetry elevation map from Mars Global Surveyor MOLA. Dramatically portrays the Martian hemispheric dichotomy, the 21-km caldera of Olympus Mons, and the 7-km depths of Valles Marineris and Hellas Planitia.',
      resolution: '463 m/pixel (MOLA MEGDR)',
      localTextureUrl: '/textures/mars/mars_mola_dem_1024.jpg',
      localDemUrl: '/textures/mars/mars_mola_dem_1024.jpg',
      wmtsEndpoint: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/',
      wmtsLayerName: 'Mars_MGS_MOLA_ClrShade_merge_global_463m',
      hasElevationData: true,
      citation: 'NASA / GSFC / MGS MOLA Science Team',
    },
    shaded_relief: {
      id: 'mars-dem-relief',
      name: 'USGS MOLA Global Relief & Crustal Thickness',
      type: 'shaded_relief',
      provider: 'USGS Astrogeology',
      instrument: 'MOLA',
      description: 'High-precision shaded relief model derived from MOLA MEGDR altimeter points, eliminating solar shading distortion to reveal pure planetary geology and fault scarps.',
      resolution: '463 m/pixel',
      localTextureUrl: '/textures/mars/mars_mola_dem_1024.jpg',
      localDemUrl: '/textures/mars/mars_mola_dem_1024.jpg',
      hasElevationData: true,
      citation: 'USGS Astrogeology / NASA PDS Geosciences Node',
    },
  },
};

/**
 * Builds standard OGC RESTful WMTS tile URL for a given zoom level, row, and column.
 */
export function buildWmtsTileUrl(
  body: PlanetaryBody,
  layerName: string,
  tileMatrix: number,
  tileRow: number,
  tileCol: number,
  extension: 'jpg' | 'png' = 'jpg'
): string {
  const bodyName = body === 'moon' ? 'Moon' : 'Mars';
  return `https://trek.nasa.gov/tiles/${bodyName}/EQ/${layerName}/1.0.0/default/default028mm/${tileMatrix}/${tileRow}/${tileCol}.${extension}`;
}

/**
 * Calibrated elevation bounds in meters relative to datum.
 */
export const ELEVATION_DATUM_BOUNDS = {
  moon: {
    minMeters: -9127,
    maxMeters: 10786,
    datumRadiusKm: 1737.4,
  },
  mars: {
    minMeters: -8200,
    maxMeters: 21229,
    datumRadiusKm: 3389.5,
  },
};

/**
 * Elevation sampler cache using an in-memory canvas for client-side altimetry queries.
 */
class ElevationSampler {
  private canvases: Partial<Record<PlanetaryBody, HTMLCanvasElement>> = {};
  private contexts: Partial<Record<PlanetaryBody, CanvasRenderingContext2D>> = {};
  private loadingPromises: Partial<Record<PlanetaryBody, Promise<boolean>>> = {};

  public async preloadDem(body: PlanetaryBody, demUrl: string): Promise<boolean> {
    if (this.canvases[body]) return true;
    if (this.loadingPromises[body]) return this.loadingPromises[body]!;

    this.loadingPromises[body] = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 512;
        canvas.height = img.naturalHeight || 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          this.canvases[body] = canvas;
          this.contexts[body] = ctx;
          resolve(true);
        } else {
          resolve(false);
        }
      };
      img.onerror = () => {
        resolve(false);
      };
      img.src = demUrl;
    });

    return this.loadingPromises[body]!;
  }

  /**
   * Samples actual measured surface elevation in meters for a given coordinate.
   */
  public getSampledElevation(body: PlanetaryBody, lat: number, lon: number): number | null {
    const ctx = this.contexts[body];
    const canvas = this.canvases[body];
    if (!ctx || !canvas) return null;

    let normLon = lon;
    while (normLon > 180) normLon -= 360;
    while (normLon < -180) normLon += 360;

    const u = (normLon + 180) / 360;
    const v = (90 - lat) / 180;

    const x = Math.floor(Math.max(0, Math.min(canvas.width - 1, u * canvas.width)));
    const y = Math.floor(Math.max(0, Math.min(canvas.height - 1, v * canvas.height)));

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      // 8-bit grayscale elevation map [0, 255]
      const gray = (pixel[0] * 0.299 + pixel[1] * 0.587 + pixel[2] * 0.114) / 255;
      const bounds = ELEVATION_DATUM_BOUNDS[body];
      const elevation = bounds.minMeters + gray * (bounds.maxMeters - bounds.minMeters);
      return Math.round(elevation);
    } catch {
      return null;
    }
  }
}

export const elevationSampler = new ElevationSampler();
