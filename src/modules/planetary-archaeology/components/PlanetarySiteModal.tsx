import React from 'react';
import { ExternalLink, MapPin, X, Mountain, ShieldCheck, AlertTriangle, HelpCircle, Compass, Calendar, Award } from 'lucide-react';
import { PlanetarySite, LocationConfidence } from '../types/planetary';

interface PlanetarySiteModalProps {
  site: PlanetarySite;
  onClose: () => void;
  onInspectTerrain: () => void;
  onReframeCamera: () => void;
}

const CONFIDENCE_BADGES: Record<
  LocationConfidence,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  confirmed: {
    label: 'CONFIRMED LOCATION',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    icon: ShieldCheck,
  },
  approximate: {
    label: 'APPROXIMATE LOCATION',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    icon: AlertTriangle,
  },
  estimated: {
    label: 'ESTIMATED TRAJECTORY',
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/40',
    icon: AlertTriangle,
  },
  unknown: {
    label: 'UNKNOWN POSITION',
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/40',
    icon: HelpCircle,
  },
};

export const PlanetarySiteModal: React.FC<PlanetarySiteModalProps> = ({
  site,
  onClose,
  onInspectTerrain,
  onReframeCamera,
}) => {
  const conf = CONFIDENCE_BADGES[site.locationConfidence];
  const ConfIcon = conf.icon;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] z-50 bg-[#090D14]/95 backdrop-blur-xl border-l border-[#1F2C3F] p-6 sm:p-8 flex flex-col justify-between shadow-2xl overflow-y-auto animate-slide-left">
      {/* Top Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#63F0C8]" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#63F0C8] font-semibold">
              PLANETARY ARCHAEOLOGY RECORD
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confidence Badge */}
        <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded border ${conf.bg} ${conf.border}`}>
          <ConfIcon className={`w-3.5 h-3.5 ${conf.text}`} />
          <span className={`font-mono text-[11px] font-bold tracking-wider uppercase ${conf.text}`}>
            {conf.label}
          </span>
          {site.coordinatesPrecisionMeters && (
            <span className="text-[10px] font-mono text-stone-400">
              (±{site.coordinatesPrecisionMeters}m)
            </span>
          )}
        </div>

        {/* Title & Mission */}
        <div className="space-y-1">
          <span className="font-mono text-xs text-stone-400 uppercase tracking-widest block">
            {site.mission} · {site.operator}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-bone leading-tight">
            {site.name}
          </h2>
          <span className="font-mono text-xs text-stone-300 block">
            {site.hardwareType}
          </span>
        </div>

        {/* Precision Coordinates Grid */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-black/40 rounded-lg border border-white/5 font-mono text-xs">
          <div>
            <span className="text-stone-400 text-[10px] tracking-wider uppercase block">LATITUDE</span>
            <span className="text-white font-medium text-sm">{site.latitudeFormatted}</span>
            <span className="text-stone-400 text-[10px] block">({site.latitude.toFixed(5)}°)</span>
          </div>
          <div>
            <span className="text-stone-400 text-[10px] tracking-wider uppercase block">LONGITUDE</span>
            <span className="text-white font-medium text-sm">{site.longitudeFormatted}</span>
            <span className="text-stone-400 text-[10px] block">({site.longitude.toFixed(5)}°)</span>
          </div>
          <div>
            <span className="text-stone-400 text-[10px] tracking-wider uppercase block">SURFACE ELEVATION</span>
            <span className="text-[#63F0C8] font-medium text-sm">
              {site.elevationMeters > 0 ? `+${site.elevationMeters.toLocaleString()}` : site.elevationMeters.toLocaleString()} m
            </span>
            <span className="text-stone-400 text-[10px] block">Datum: Mean Sphere</span>
          </div>
          <div>
            <span className="text-stone-400 text-[10px] tracking-wider uppercase block">LANDING DATE</span>
            <span className="text-white font-medium text-sm">{site.landingDate}</span>
            <span className="text-stone-400 text-[10px] block">Launch: {site.launchDate}</span>
          </div>
        </div>

        {/* Verification Methodology */}
        <div className="space-y-1.5 p-3 rounded bg-[#131B27]/80 border border-[#223147] text-xs">
          <span className="font-mono text-[10px] tracking-wider uppercase text-emerald-400 font-semibold block">
            VERIFICATION METHODOLOGY
          </span>
          <p className="text-stone-300 leading-relaxed font-sans font-light">
            {site.confidenceReason}
          </p>
        </div>

        {/* Archaeological Significance */}
        <div className="space-y-1.5 text-xs font-sans">
          <span className="font-mono text-[10px] tracking-wider uppercase text-stone-400 font-semibold block">
            HISTORICAL SIGNIFICANCE
          </span>
          <p className="text-stone-300 leading-relaxed font-light">
            {site.significance}
          </p>
        </div>

        {/* Geological Context */}
        <div className="space-y-1.5 text-xs font-sans">
          <span className="font-mono text-[10px] tracking-wider uppercase text-stone-400 font-semibold block">
            GEOLOGICAL CONTEXT ({site.regionalFeature})
          </span>
          <p className="text-stone-300 leading-relaxed font-light">
            {site.geologicalContext}
          </p>
        </div>

        {/* Official NASA & Scientific Citations */}
        <div className="space-y-2 pt-2 border-t border-[#1C2636]">
          <span className="font-mono text-[10px] tracking-wider uppercase text-[#63F0C8] font-semibold block">
            OFFICIAL NASA & RECONNAISSANCE CITATIONS
          </span>
          <div className="space-y-1.5">
            {site.officialSources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between p-2 rounded bg-black/30 hover:bg-white/5 border border-white/5 hover:border-white/20 transition-all text-[11px]"
              >
                <div>
                  <span className="text-stone-200 group-hover:text-white font-medium block">
                    {source.title}
                  </span>
                  <span className="text-stone-400 text-[10px] block mt-0.5">
                    {source.organization} {source.catalogId ? `· ${source.catalogId}` : ''}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#63F0C8] transition-colors ml-2 mt-0.5 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="pt-6 border-t border-[#1C2636] flex items-center space-x-3">
        <button
          type="button"
          onClick={onReframeCamera}
          className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded font-mono text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center space-x-2"
        >
          <Compass className="w-4 h-4 text-[#63F0C8]" />
          <span>RE-CENTER SITE</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="py-3 px-5 bg-[#63F0C8] hover:bg-[#85F5D4] text-[#080B10] rounded font-mono text-xs uppercase tracking-wider font-bold transition-all"
        >
          DONE
        </button>
      </div>
    </div>
  );
};
