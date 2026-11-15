import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Ruler } from 'lucide-react';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../i18n';
import { useExperienceStore } from '../../store/useExperienceStore';

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const unitSystem = useExperienceStore((s) => s.unitSystem);
  const toggleUnitSystem = useExperienceStore((s) => s.toggleUnitSystem);

  const currentCode = (i18n.language?.slice(0, 2) as SupportedLanguage) || 'en';

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex items-center space-x-2 text-[10px] font-mono tracking-wider uppercase select-none pointer-events-auto">
      {/* Language Selector */}
      <div className="relative flex items-center bg-black/60 border border-white/15 rounded px-2 py-1 text-slate-300 hover:text-white hover:border-amber-400/50 transition-colors">
        <Globe className="w-3 h-3 mr-1.5 text-amber-400 shrink-0" />
        <select
          value={currentCode}
          onChange={handleLanguageChange}
          className="bg-transparent text-slate-200 text-[10px] font-mono focus:outline-none cursor-pointer pr-1"
          aria-label={t('language')}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
              {lang.nativeName} ({lang.code.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Unit Metric / Imperial Toggle */}
      <button
        onClick={toggleUnitSystem}
        className="flex items-center bg-black/60 border border-white/15 rounded px-2 py-1 text-slate-300 hover:text-amber-400 hover:border-amber-400/50 transition-colors"
        title="Toggle Metric (km/kg/°C) / Imperial (mi/lb/°F)"
        aria-label="Toggle units"
      >
        <Ruler className="w-3 h-3 mr-1 text-amber-400/80" />
        <span>{unitSystem === 'metric' ? 'KM / KG' : 'MI / LB'}</span>
      </button>
    </div>
  );
};
