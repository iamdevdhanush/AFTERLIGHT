import React from 'react';
import {
  ExternalLink,
  MapPin,
  X,
  Mountain,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Compass,
  Calendar,
  BookOpen,
  Route,
  Activity,
  Image as ImageIcon,
  Tag,
  Cpu,
} from 'lucide-react';
import { PlanetarySite, LocationConfidence, HardwareDisposition, HardwareStatus } from '../types/planetary';
import { CATEGORY_STYLES } from './PlanetaryMarkers';
import { getTraverseById } from '../data/roverTraverses';

interface ArtifactDiscoveryPanelProps {
  site: PlanetarySite;
  onClose: () => void;
  onInspectTerrain: () => void;
  onReframeCamera: () => void;
  onOpenCompleteStory?: (storyId: string) => void;
  onOpenHardwareInspection?: (artifactId: string) => void;
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

const DISPOSITION_LABELS: Record<HardwareDisposition, { label: string; text: string; bg: string }> = {
  operational_on_surface: {
    label: 'Operational on Surface',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
  intentionally_left_behind: {
    label: 'Intentionally Left Behind',
    text: 'text-amber-300',
    bg: 'bg-amber-500/10 border-amber-500/30',
  },
  decommissioned: {
    label: 'Decommissioned In Situ',
    text: 'text-sky-300',
    bg: 'bg-sky-500/10 border-sky-500/30',
  },
  discarded: {
    label: 'Discarded Component',
    text: 'text-stone-300',
    bg: 'bg-stone-500/10 border-stone-500/30',
  },
  impacted: {
    label: 'Impacted / Kinetic Scar',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30',
  },
};

const STATUS_LABELS: Record<HardwareStatus, { label: string; dot: string }> = {
  operational: { label: 'Active', dot: 'bg-emerald-400 animate-pulse' },
  inactive: { label: 'Inactive / Silent', dot: 'bg-amber-400' },
  decommissioned: { label: 'Decommissioned', dot: 'bg-stone-400' },
  destroyed: { label: 'Destroyed on Impact', dot: 'bg-rose-500' },
};

export const ArtifactDiscoveryPanel: React.FC<ArtifactDiscoveryPanelProps> = ({
  site,
  onClose,
  onInspectTerrain,
  onReframeCamera,
  onOpenCompleteStory,
  onOpenHardwareInspection,
}) => {
  const conf = CONFIDENCE_BADGES[site.locationConfidence];
  const ConfIcon = conf.icon;
  const catStyle = CATEGORY_STYLES[site.category] || CATEGORY_STYLES.lander;
  const disp = DISPOSITION_LABELS[site.disposition];
  const stat = STATUS_LABELS[site.status];

  // Associated rover traverse if available
  const traverse = site.traverseId ? getTraverseById(site.traverseId) : null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] z-50 bg-[#080B10]/95 backdrop-blur-2xl border-l border-[#1F2C3F] p-6 sm:p-8 flex flex-col justify-between shadow-2xl overflow-y-auto animate-slide-left select-none pointer-events-auto">
      {/* Top Header */}
      <div className="space-y-4">
        {/* Navigation & Category Tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: catStyle.primary }}
            />
            <span
              className="font-mono text-xs uppercase tracking-[0.2em] font-semibold"
              style={{ color: catStyle.primary }}
            >
              {catStyle.label.toUpperCase()} · {site.planet.toUpperCase()}
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

        {/* Confidence & Disposition Badges */}
        <div className="flex flex-wrap gap-2">
          {/* Location Confidence */}
          <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded border ${conf.bg} ${conf.border}`}>
            <ConfIcon className={`w-3.5 h-3.5 ${conf.text}`} />
            <span className={`font-mono text-[10px] font-bold tracking-wider uppercase ${conf.text}`}>
              {conf.label}
            </span>
            {site.coordinatesPrecisionMeters && (
              <span className="text-[9px] font-mono text-stone-400">
                (±{site.coordinatesPrecisionMeters}m)
              </span>
            )}
          </div>

          {/* Separate Hardware Disposition Badge */}
          <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded border ${disp.bg}`}>
            <Tag className={`w-3 h-3 ${disp.text}`} />
            <span className={`font-mono text-[10px] font-semibold tracking-wider uppercase ${disp.text}`}>
              {disp.label}
            </span>
          </div>

          {/* Operational Status */}
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded border border-white/10 bg-black/40">
            <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
            <span className="font-mono text-[10px] text-stone-300 font-medium uppercase">
              {stat.label}
            </span>
          </div>
        </div>

        {/* Title & Mission */}
        <div className="space-y-1">
          <span className="font-mono text-xs text-stone-400 uppercase tracking-widest block font-medium">
            {site.mission} ({site.year}) · {site.operator}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-bone leading-tight">
            {site.name}
          </h2>
          <span className="font-mono text-xs text-stone-300 block">
            {site.hardwareType}
          </span>
        </div>

        {/* Archival Historical Photograph (Where Available) */}
        {site.photoUrl && (
          <div className="rounded-xl overflow-hidden border border-[#222E42] bg-black/50 space-y-1.5">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
              <img
                src={site.photoUrl}
                alt={site.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-white/10 text-[9px] font-mono text-stone-300 flex items-center space-x-1">
                <ImageIcon className="w-3 h-3 text-[#63F0C8]" />
                <span>NASA ARCHIVAL PHOTOGRAPH</span>
              </div>
            </div>
            {site.photoCaption && (
              <p className="px-3 pb-2.5 text-[11px] font-sans text-stone-400 leading-snug">
                {site.photoCaption}
              </p>
            )}
          </div>
        )}

        {/* Rover Traversal Route Summary (If applicable) */}
        {traverse && (
          <div className="p-3.5 rounded-xl bg-[#101926] border border-[#23354E] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#63F0C8] font-mono text-xs font-bold uppercase tracking-wider">
                <Route className="w-4 h-4" />
                <span>DOCUMENTED ROVER TRAVERSE</span>
              </div>
              <span className="font-mono text-xs font-bold text-white">
                {traverse.totalDistanceKm} km
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-stone-300 pt-1 border-t border-white/5">
              <div>
                <span className="text-stone-500 block text-[9px] uppercase">TOTAL DURATION</span>
                <span>{traverse.totalSols}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[9px] uppercase">KEY WAYPOINTS</span>
                <span>{traverse.waypoints.length} Mapped Stations</span>
              </div>
            </div>

            <p className="text-[11px] font-sans text-stone-300 leading-snug pt-1">
              Traversed along the rim and floor of {site.regionalFeature}; 3D surface route and waypoints are illuminated on the globe.
            </p>
          </div>
        )}

        {/* Verified Coordinates & Altimetry Grid */}
        <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-black/40 rounded-xl border border-white/5 font-mono text-xs">
          <div>
            <span className="text-stone-500 text-[10px] tracking-wider uppercase block">LATITUDE</span>
            <span className="text-white font-medium text-sm">{site.latitudeFormatted}</span>
            <span className="text-stone-500 text-[10px] block">({site.latitude.toFixed(5)}°)</span>
          </div>
          <div>
            <span className="text-stone-500 text-[10px] tracking-wider uppercase block">LONGITUDE</span>
            <span className="text-white font-medium text-sm">{site.longitudeFormatted}</span>
            <span className="text-stone-500 text-[10px] block">({site.longitude.toFixed(5)}°)</span>
          </div>
          <div>
            <span className="text-stone-500 text-[10px] tracking-wider uppercase block">SURFACE ELEVATION</span>
            <span className="text-[#63F0C8] font-medium text-sm">
              {site.elevationMeters > 0 ? `+${site.elevationMeters.toLocaleString()}` : site.elevationMeters.toLocaleString()} m
            </span>
            <span className="text-stone-500 text-[10px] block">LOLA / MOLA Datum</span>
          </div>
          <div>
            <span className="text-stone-500 text-[10px] tracking-wider uppercase block">LANDING DATE</span>
            <span className="text-white font-medium text-sm">{site.landingDate}</span>
            <span className="text-stone-500 text-[10px] block">Launch: {site.launchDate}</span>
          </div>
        </div>

        {/* Location Verification Methodology */}
        <div className="space-y-1.5 p-3 rounded-xl bg-[#131B27]/80 border border-[#223147] text-xs">
          <span className="font-mono text-[10px] tracking-wider uppercase text-emerald-400 font-semibold block">
            LOCATION CONFIDENCE & VERIFICATION METHODOLOGY
          </span>
          <p className="text-stone-300 leading-relaxed font-sans font-light text-[11px]">
            {site.confidenceReason}
          </p>
        </div>

        {/* Archaeological Significance */}
        <div className="space-y-1 text-xs font-sans">
          <span className="font-mono text-[10px] tracking-wider uppercase text-stone-400 font-semibold block">
            ARCHAEOLOGICAL SIGNIFICANCE
          </span>
          <p className="text-stone-300 leading-relaxed font-light text-[12px]">
            {site.significance}
          </p>
        </div>

        {/* Geological Context */}
        <div className="space-y-1 text-xs font-sans">
          <span className="font-mono text-[10px] tracking-wider uppercase text-stone-400 font-semibold block">
            GEOLOGICAL CONTEXT ({site.regionalFeature})
          </span>
          <p className="text-stone-300 leading-relaxed font-light text-[12px]">
            {site.geologicalContext}
          </p>
        </div>

        {/* Official Reconnaissance Sources */}
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
                className="group flex items-start justify-between p-2 rounded-lg bg-black/30 hover:bg-white/5 border border-white/5 hover:border-white/20 transition-all text-[11px]"
              >
                <div>
                  <span className="text-stone-200 group-hover:text-white font-medium block">
                    {source.title}
                  </span>
                  <span className="text-stone-500 text-[10px] block mt-0.5">
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
      <div className="pt-6 border-t border-[#1C2636] space-y-2.5">
        {/* Complete Mission Story Button */}
        {site.linkedArtifactStoryId && onOpenCompleteStory && (
          <button
            type="button"
            onClick={() => onOpenCompleteStory(site.linkedArtifactStoryId!)}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#D99A63] to-[#E28554] hover:brightness-110 text-[#080B10] rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-xl flex items-center justify-center space-x-2.5 group"
          >
            <BookOpen className="w-4 h-4 text-[#080B10] group-hover:scale-110 transition-transform" />
            <span>EXPLORE COMPLETE MISSION STORY</span>
          </button>
        )}

        {/* 3D Hardware Inspection Studio Button */}
        {onOpenHardwareInspection && (
          <button
            type="button"
            onClick={() =>
              onOpenHardwareInspection(
                site.linkedArtifactStoryId ||
                  (site.planet === 'moon' ? 'apollo11_eagle' : 'opportunity')
              )
            }
            className="w-full py-2.5 px-4 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center space-x-2"
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>INSPECT 3D HARDWARE (STUDIO)</span>
          </button>
        )}

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onInspectTerrain}
            className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white rounded-lg font-mono text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center space-x-1.5"
          >
            <Mountain className="w-3.5 h-3.5 text-[#63F0C8]" />
            <span>TERRAIN ALTIMETRY</span>
          </button>

          <button
            type="button"
            onClick={onReframeCamera}
            className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white rounded-lg font-mono text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center space-x-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-[#63F0C8]" />
            <span>RE-CENTER</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-[#63F0C8] hover:bg-[#85F5D4] text-[#080B10] rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
