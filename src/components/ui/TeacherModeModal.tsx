import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Printer, Copy, Check, GraduationCap, Link as LinkIcon, Code } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';

export const TeacherModeModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { t } = useTranslation();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://afterlight.space';

  const assignmentLinks = [
    {
      title: 'Apollo 11 Tranquility Base — Descent Stage Investigation',
      description: 'Explore the first human landing site on the Moon and analyze why the descent stage remained behind.',
      url: `${baseUrl}/?state=PLANETARY_ARCHAEOLOGY&dest=moon&site=apollo_11`,
    },
    {
      title: 'Mars Exploration Rover Opportunity — 15-Year Traverse',
      description: 'Investigate Opportunity’s 45.16 km traverse across Meridiani Planum to its resting spot in Perseverance Valley.',
      url: `${baseUrl}/?state=PLANETARY_ARCHAEOLOGY&dest=mars&site=opportunity_rover`,
    },
    {
      title: 'Apollo Lunar Module 3D Hardware Inspection Studio',
      description: 'Inspect the exploded subassemblies of Apollo LM Eagle: propulsion, landing gear, and thermal blankets.',
      url: `${baseUrl}/?state=HARDWARE_STUDIO&model=apollo11_eagle`,
    },
    {
      title: 'Perseverance Rover Jezero Crater Sample Depot',
      description: 'Study the robotic sample collection tubes intentionally placed on the surface of Mars for future retrieval.',
      url: `${baseUrl}/?state=PLANETARY_ARCHAEOLOGY&dest=mars&site=perseverance_rover`,
    },
  ];

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleExportQuizCsv = () => {
    const csvContent =
      'Question Number,Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,NASA Source\n' +
      '1,"Why did the Apollo 11 Lunar Module leave its descent stage on the Moon?","It ran out of fuel","To save weight and act as the launch platform for the ascent stage","It was stuck in regolith","It was an intentional solar power station","B","The lower descent stage contained the descent engine and served as the launching platform for the crewed ascent stage to return to lunar orbit.","NASA Apollo 11 Mission Report"\n' +
      '2,"How far did the Opportunity rover travel on Mars before completing its mission?","1.2 km","10.5 km","45.16 km","102.4 km","C","Opportunity exceeded its planned 90-sol mission by 14 years, driving 45.16 km (28.06 miles).","NASA JPL MER Mission Telemetry"\n' +
      '3,"What material wraps the landing struts of the Apollo Lunar Module for thermal protection?","Titanium foil","Lead blankets","Kapton and Mylar multilayer insulation (MLI)","Carbon fiber composite","C","The landing struts and chassis were wrapped in 25-layer Kapton and aluminized Mylar blankets to reflect solar radiation in the lunar vacuum.","NASA Apollo 11 Technical Specs"\n' +
      '4,"Where does the Opportunity rover currently rest on Mars?","Gale Crater","Jezero Crater","Perseverance Valley on Endeavour Crater rim","Olympus Mons caldera","C","Opportunity rests silently on the west rim of Endeavour Crater at Perseverance Valley after the June 2018 dust storm.","NASA JPL Mars Exploration"\n' +
      '5,"What is the primary scientific purpose of the EASEP Laser Ranging Retroreflector (LRRR) left on the Moon?","To take photographs of Earth","To reflect laser beams from Earth to measure the Moon distance to millimeter accuracy","To detect solar wind electrons","To measure Moonquakes","B","The quartz corner-cube prism reflector remains operational and reflects Earth-directed lasers to calculate the Moon recessional rate (~3.8 cm/year).","NASA LROC Science"\n' +
      '6,"Which power source powers the Mars 2020 Perseverance Rover?","Solar panels","Multi-Mission Radioisotope Thermoelectric Generator (MMRTG)","Lithium-ion primary batteries","Hydrogen fuel cell","B","Perseverance relies on an MMRTG containing plutonium-238 decay heat converted into electricity.","NASA JPL Mars 2020 Specs"\n' +
      '7,"What is the location confidence level for the Apollo 11 Lunar Module descent stage?","Unknown","Approximate (±5 km)","Confirmed (physically resolved by LROC NAC to ±0.5 m)","Unverified","C","The descent stage, shadow, footpads, and astronaut footpaths are resolved in LROC NAC frame M102287763LE.","LROC Lunar Reconnaissance Orbiter"\n' +
      '8,"What are the primary instruments on the Pancam Mast Assembly (PMA) of Mars rovers?","Laser altimeter","Multispectral stereo Panoramic Cameras and monochrome Navigation Cameras","Radar sounder","Magnetometer","B","The PMA houses stereo 1024x1024 Pancams with 8-position filter wheels and wide-angle Navcams.","NASA JPL Instruments"\n' +
      '9,"What is humanity’s current status regarding relics intentionally left behind on celestial bodies?","They are collected and recycled","They stand preserved in vacuum/thin atmosphere as historical monuments of exploration","They disintegrate within 1 year","They are banned by the Outer Space Treaty","B","Airless or dry environments preserve hardware indefinitely, creating the emergent field of off-world space archaeology.","NASA Heritage Guidance"\n' +
      '10,"Which mission carried the first crewed Lunar Roving Vehicle (LRV) to the Moon?","Apollo 11","Apollo 13","Apollo 15","Apollo 17","C","Apollo 15 in 1971 introduced the Boeing/GM Lunar Roving Vehicle traversing 27.8 km across Hadley Rille.","NASA Apollo 15 Lunar Surface Journal"\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'afterlight_space_archaeology_quiz.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintWorksheet = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#090D14] border border-amber-500/40 rounded-xl shadow-2xl p-6 md:p-8 space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-serif text-white tracking-wide">
                Teacher & Educator Toolkit
              </h2>
              <p className="text-[11px] font-mono text-amber-400/80">
                NASA Space Apps Challenge Educational Resources & Classroom Deep-Links
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons: Export Quiz & Print Worksheet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleExportQuizCsv}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono uppercase tracking-wider transition-all shadow-md group"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span>{t('export_quiz_csv')}</span>
          </button>

          <button
            onClick={handlePrintWorksheet}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 rounded-lg text-xs font-mono uppercase tracking-wider transition-all shadow-md"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>{t('printable_worksheet')}</span>
          </button>
        </div>

        {/* Shareable Deep-Links for Classroom Assignments */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 block">
            Direct Shareable Assignment Links (Zero Login Required)
          </span>

          <div className="space-y-2">
            {assignmentLinks.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-black/40 border border-white/10 rounded-lg flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-serif text-white font-medium truncate">{item.title}</div>
                  <div className="text-[10px] text-slate-400 font-sans line-clamp-1">{item.description}</div>
                </div>

                <button
                  onClick={() => handleCopy(item.url)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 rounded text-[10px] font-mono shrink-0 transition-colors border border-white/10"
                >
                  {copiedLink === item.url ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Embed Widget Snippet */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 block flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>Embed Widget in School Website or Canvas LMS</span>
          </span>
          <pre className="p-2.5 bg-black/80 rounded border border-white/10 text-[10px] font-mono text-amber-300 overflow-x-auto">
            {`<iframe src="${baseUrl}/?state=destinations&embed=true" width="100%" height="600" frameborder="0" allow="accelerometer; autoplay; fullscreen" title="AFTERLIGHT 3D Museum"></iframe>`}
          </pre>
        </div>

        {/* Report a Scientific Correction */}
        <div className="pt-2 text-center border-t border-white/10">
          <a
            href="https://github.com/shettyadi57/AFTERLIGHT/issues/new?title=Scientific+Data+Correction&body=Please+describe+the+data+correction+and+cite+the+NASA/JPL+source:"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-amber-400/80 hover:text-amber-300 underline"
          >
            {t('report_correction')} ↗
          </a>
        </div>
      </div>
    </div>
  );
};
