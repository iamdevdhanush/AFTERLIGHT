import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ExternalLink, Compass } from 'lucide-react';
import { ALL_PLANETARY_SITES } from '../../modules/planetary-archaeology/data/planetarySites';

export const WebGLFallbackGallery: React.FC<{
  onRetry?: () => void;
}> = ({ onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full min-h-screen bg-[#080B10] text-[#E8E3D9] p-6 md:p-12 overflow-y-auto">
      {/* Fallback Banner */}
      <div className="max-w-4xl mx-auto mb-8 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-sm font-mono uppercase tracking-wider text-amber-300 font-semibold">
            {t('webgl_fallback_notice')}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Your current browser or hardware does not support accelerated 3D WebGL. AFTERLIGHT has automatically switched to the High-Resolution Archival Exhibition format so you can still explore all scientific telemetry, NASA coordinates, and mission stories without limitation.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs font-mono uppercase tracking-wider text-amber-400 hover:text-white underline"
            >
              Retry 3D WebGL Canvas
            </button>
          )}
        </div>
      </div>

      {/* Main Archival Artifacts Grid */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="border-b border-white/10 pb-4">
          <span className="text-xs font-mono tracking-[0.2em] text-amber-400 uppercase">
            NASA Planetary Data System (PDS) Archival Catalogue
          </span>
          <h1 className="text-3xl md:text-4xl font-serif text-white tracking-wide mt-1">
            Abandoned but Not Forgotten: Relics of the Moon & Mars
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ALL_PLANETARY_SITES.slice(0, 18).map((site) => (
            <article
              key={site.id}
              className="bg-black/50 border border-white/10 rounded-lg overflow-hidden flex flex-col hover:border-amber-400/40 transition-colors shadow-lg"
            >
              <div className="h-44 bg-slate-900 relative overflow-hidden">
                <img
                  src={site.photoUrl}
                  alt={site.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if local photo missing
                    (e.target as HTMLImageElement).src = '/images/apollo11_surface.jpg';
                  }}
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono tracking-wider text-amber-400 border border-white/10 uppercase">
                  {site.planet.toUpperCase()} · {site.category.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {site.mission} ({site.year})
                  </span>
                  <h2 className="text-base font-serif text-white leading-snug">
                    {site.name}
                  </h2>
                  <p className="text-xs text-slate-300 font-sans line-clamp-3 leading-relaxed">
                    {site.siteDescription}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10 text-[10px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>COORDINATES:</span>
                    <span className="text-amber-200">
                      {site.latitudeFormatted}, {site.longitudeFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>LOCATION CONFIDENCE:</span>
                    <span className="text-emerald-400 uppercase font-semibold">
                      {site.locationConfidence}
                    </span>
                  </div>

                  {site.officialSources[0] && (
                    <a
                      href={site.officialSources[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-amber-400/90 hover:text-amber-300 pt-1"
                    >
                      <Compass className="w-3 h-3" />
                      <span>{site.officialSources[0].title}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
