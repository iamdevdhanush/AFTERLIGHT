import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, BookOpen, ShieldCheck } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { ARTIFACTS } from '../../data/artifacts';

export const AskArchiveModal: React.FC = () => {
  const isAiGuideOpen = useExperienceStore((s) => s.isAiGuideOpen);
  const toggleAiGuide = useExperienceStore((s) => s.toggleAiGuide);
  const selectedArtifactId = useExperienceStore((s) => s.selectedArtifactId);
  const currentDestination = useExperienceStore((s) => s.currentDestination);

  // Default to Opportunity if none selected
  const activeArtifactId = selectedArtifactId || (currentDestination === 'mars' ? 'opportunity' : currentDestination === 'moon' ? 'apollo11_eagle' : 'voyager1');
  const artifact = ARTIFACTS[activeArtifactId] || ARTIFACTS.opportunity;

  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<{ text: string; source: string } | null>(null);
  const [customQuery, setCustomQuery] = useState('');

  const handleSelectQuestion = (q: string, a: string, src: string) => {
    setActiveQuestion(q);
    setActiveAnswer({ text: a, source: src });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    const lower = customQuery.toLowerCase();
    // Search within artifact's verified Q&A or narrative
    const matched = artifact.curatedQnA.find((item) =>
      item.question.toLowerCase().includes(lower) ||
      lower.includes(item.question.toLowerCase().split(' ')[0]) ||
      lower.includes('why') ||
      lower.includes('stop') ||
      lower.includes('water')
    );

    if (matched) {
      setActiveQuestion(customQuery);
      setActiveAnswer({ text: matched.answer, source: matched.source });
    } else {
      setActiveQuestion(customQuery);
      setActiveAnswer({
        text: `According to the ${artifact.mission} archive, ${artifact.name} was ${artifact.brief}. Its primary mission concluded with ${artifact.operationalDuration} of operations at ${artifact.locationName}. For full telemetry records, consult the NASA Planetary Data System.`,
        source: `NASA / JPL Mission Archives (${artifact.callsign})`,
      });
    }
    setCustomQuery('');
  };

  if (!isAiGuideOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3 }}
          className="bg-space-800 border border-starlight/15 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl text-starlight"
        >
          {/* Header */}
          <div className="p-6 border-b border-starlight/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-space-700/80 border border-gold/30">
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <div>
                <span className="font-mono text-xs tracking-wider text-gold block uppercase font-medium">
                  VERIFIED MISSION GUIDE
                </span>
                <h3 className="font-serif text-2xl text-starlight">
                  Ask the Archive: {artifact.name}
                </h3>
              </div>
            </div>

            <button
              onClick={() => toggleAiGuide(false)}
              className="p-2 text-dust hover:text-starlight hover:bg-space-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Questions & Answers */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            <div className="space-y-2">
              <span className="font-mono text-[10px] tracking-widest text-dust/60 uppercase">
                RECOMMENDED ARCHIVAL INQUIRIES
              </span>
              <div className="flex flex-col space-y-2">
                {artifact.curatedQnA.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectQuestion(item.question, item.answer, item.source)}
                    className={`text-left p-3.5 border transition-all text-xs font-sans ${
                      activeQuestion === item.question
                        ? 'border-gold bg-space-900 text-starlight'
                        : 'border-starlight/10 bg-space-800/60 text-dust/90 hover:border-starlight/30 hover:text-starlight'
                    }`}
                  >
                    {item.question}
                  </button>
                ))}
              </div>
            </div>

            {/* Answer Box */}
            {activeAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-space-900/90 border-l-2 border-gold space-y-3"
              >
                <div className="flex items-center space-x-2 text-[10px] font-mono text-gold tracking-ultra uppercase">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>MISSION DEBRIEF RECORD</span>
                </div>
                <p className="font-sans text-sm text-starlight/95 leading-relaxed font-light">
                  {activeAnswer.text}
                </p>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-dust/60 pt-2 border-t border-starlight/5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold/70" />
                  <span>CITATION: {activeAnswer.source}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleCustomSubmit}
            className="p-4 border-t border-starlight/10 bg-space-900/60 flex items-center space-x-3"
          >
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder={`Ask about ${artifact.name}'s mission or science...`}
              className="flex-1 bg-space-800 border border-starlight/15 px-4 py-2.5 text-xs text-starlight font-sans placeholder-dust/40 focus:outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-starlight text-void hover:bg-gold transition-colors font-mono text-xs uppercase font-medium flex items-center space-x-2"
            >
              <span>INQUIRE</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

