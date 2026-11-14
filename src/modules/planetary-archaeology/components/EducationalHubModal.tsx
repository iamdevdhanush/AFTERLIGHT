import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  Scale,
  Award,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  GLOSSARY_TERMS,
  MISSION_COMPARISONS,
  KNOWLEDGE_QUIZ_QUESTIONS,
} from '../data/educationalData';
import { GlossaryTerm, MissionComparison, QuizQuestion } from '../types/storytelling';

export interface EducationalHubProps {
  onClose: () => void;
  initialTab?: 'glossary' | 'comparisons' | 'quiz';
}

export const EducationalHubModal: React.FC<EducationalHubProps> = ({
  onClose,
  initialTab = 'glossary',
}) => {
  const [activeTab, setActiveTab] = useState<'glossary' | 'comparisons' | 'quiz'>(initialTab);

  // Glossary State
  const [glossarySearch, setGlossarySearch] = useState('');
  const [glossaryCategory, setGlossaryCategory] = useState<string>('all');

  // Comparison State
  const [selectedComparisonId, setSelectedComparisonId] = useState<string>(
    MISSION_COMPARISONS[0].id
  );

  // Quiz State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});

  // Filtered Glossary
  const filteredGlossary = useMemo(() => {
    return GLOSSARY_TERMS.filter((item) => {
      const matchesSearch =
        item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
        item.definition.toLowerCase().includes(glossarySearch.toLowerCase());
      const matchesCat =
        glossaryCategory === 'all' || item.category === glossaryCategory;
      return matchesSearch && matchesCat;
    });
  }, [glossarySearch, glossaryCategory]);

  const activeComparison = useMemo(() => {
    return (
      MISSION_COMPARISONS.find((c) => c.id === selectedComparisonId) ||
      MISSION_COMPARISONS[0]
    );
  }, [selectedComparisonId]);

  // Quiz Handlers
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submittedQuestions[questionId]) return; // locked after submission
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleCheckAnswer = (questionId: string) => {
    if (selectedAnswers[questionId] === undefined) return;
    setSubmittedQuestions((prev) => ({ ...prev, [questionId]: true }));
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setSubmittedQuestions({});
  };

  const totalQuestions = KNOWLEDGE_QUIZ_QUESTIONS.length;
  const answeredCount = Object.keys(submittedQuestions).length;
  const correctCount = Object.entries(submittedQuestions).filter(([qId, submitted]) => {
    if (!submitted) return false;
    const q = KNOWLEDGE_QUIZ_QUESTIONS.find((item) => item.id === qId);
    return q && selectedAnswers[qId] === q.correctAnswerIndex;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none font-sans">
      <div className="w-full max-w-5xl h-[88vh] bg-[#0A0C13] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <header className="h-16 px-6 border-b border-white/10 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-semibold text-white">
              PLANETARY ARCHAEOLOGY ACADEMY & GLOSSARY
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
            <button
              onClick={() => setActiveTab('glossary')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono tracking-wider uppercase transition-all ${
                activeTab === 'glossary'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>GLOSSARY ({GLOSSARY_TERMS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('comparisons')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono tracking-wider uppercase transition-all ${
                activeTab === 'comparisons'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>MISSION COMPARISONS</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono tracking-wider uppercase transition-all ${
                activeTab === 'quiz'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>KNOWLEDGE CHALLENGE</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* ================================================================= */}
          {/* TAB 1: GLOSSARY */}
          {/* ================================================================= */}
          {activeTab === 'glossary' && (
            <div className="space-y-6">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search terms, concepts, instruments..."
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>

                <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
                  {['all', 'geology', 'spacecraft', 'rocketry', 'physics'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setGlossaryCategory(cat)}
                      className={`px-3 py-1 rounded text-xs font-mono tracking-wider uppercase transition-all shrink-0 ${
                        glossaryCategory === cat
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-white bg-black/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glossary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGlossary.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-serif text-white">{item.term}</h3>
                          {item.phonetic && (
                            <span className="text-xs font-mono text-slate-400">
                              /{item.phonetic}/
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90">
                          {item.category} • {item.planetRelevant.toUpperCase()} RELEVANT
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {item.definition}
                    </p>

                    <div className="pt-2 border-t border-white/5 text-[11px] font-sans text-amber-200/80 bg-amber-500/5 p-2.5 rounded border border-amber-500/10">
                      <span className="font-semibold text-amber-400 font-mono text-[10px] block uppercase">
                        MISSION EXAMPLE
                      </span>
                      {item.example}
                    </div>
                  </div>
                ))}
              </div>

              {filteredGlossary.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-mono text-xs">
                  No terminology matched your search criteria.
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: MISSION COMPARISONS */}
          {/* ================================================================= */}
          {activeTab === 'comparisons' && (
            <div className="space-y-6">
              {/* Comparison Selector */}
              <div className="flex items-center space-x-3 bg-white/5 p-2 rounded-xl border border-white/10">
                {MISSION_COMPARISONS.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => setSelectedComparisonId(comp.id)}
                    className={`flex-1 py-2 px-4 rounded-lg text-xs font-mono tracking-wider uppercase transition-all ${
                      selectedComparisonId === comp.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {comp.title}
                  </button>
                ))}
              </div>

              {/* Comparison Header */}
              <div className="space-y-1">
                <h2 className="text-2xl font-serif text-white">{activeComparison.title}</h2>
                <p className="text-xs font-mono text-amber-400">{activeComparison.subtitle}</p>
              </div>

              {/* Side-by-Side Comparison Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mission A */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  <div className="border-b border-white/10 pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
                      MISSION SPECIFICATION A
                    </span>
                    <h3 className="text-xl font-serif text-amber-300 font-medium">
                      {activeComparison.missionA.name}
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Mass at Destination</span>
                      <div className="text-white">{activeComparison.missionA.massKg}</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Power Source</span>
                      <div className="text-white">{activeComparison.missionA.power}</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Surface Duration</span>
                      <div className="text-white">{activeComparison.missionA.duration}</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Distance Traversed</span>
                      <div className="text-white font-semibold text-amber-200">
                        {activeComparison.missionA.distanceTraveled}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Primary Scientific Discovery</span>
                      <div className="text-slate-300 font-sans">{activeComparison.missionA.primaryDiscovery}</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Remaining Planetary Hardware</span>
                      <div className="text-slate-300 font-sans">{activeComparison.missionA.remainingHardware}</div>
                    </div>
                  </div>
                </div>

                {/* Mission B */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  <div className="border-b border-white/10 pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
                      MISSION SPECIFICATION B
                    </span>
                    <h3 className="text-xl font-serif text-sky-300 font-medium">
                      {activeComparison.missionB.name}
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Mass at Destination</span>
                      <div className="text-white">{activeComparison.missionB.massKg}</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Power Source</span>
                      <div className="text-white">{activeComparison.missionB.power}</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Surface Duration</span>
                      <div className="text-white">{activeComparison.missionB.duration}</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Distance Traversed</span>
                      <div className="text-white font-semibold text-sky-200">
                        {activeComparison.missionB.distanceTraveled}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Primary Scientific Discovery</span>
                      <div className="text-slate-300 font-sans">{activeComparison.missionB.primaryDiscovery}</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase">Remaining Planetary Hardware</span>
                      <div className="text-slate-300 font-sans">{activeComparison.missionB.remainingHardware}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparative Engineering Analysis */}
              <div className="p-6 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>ARCHIVAL ENGINEERING EVOLUTION ANALYSIS</span>
                </div>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans">
                  {activeComparison.analysis}
                </p>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: KNOWLEDGE CHALLENGE QUIZ */}
          {/* ================================================================= */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {/* Quiz Progress & Score Card */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
                    INTERACTIVE PLANETARY ARCHAEOLOGY CHALLENGE
                  </span>
                  <div className="text-sm font-serif text-white">
                    Test your knowledge of Apollo and Mars rover engineering
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="font-mono text-xs text-right">
                    <span className="text-slate-400">SCORE: </span>
                    <span className="text-amber-400 font-bold text-sm">
                      {correctCount} / {totalQuestions}
                    </span>
                    <span className="text-slate-400 text-[10px] block">
                      {answeredCount} of {totalQuestions} answered
                    </span>
                  </div>

                  <button
                    onClick={resetQuiz}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-mono text-xs border border-white/10 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESET</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {KNOWLEDGE_QUIZ_QUESTIONS.map((q, idx) => {
                  const isSubmitted = !!submittedQuestions[q.id];
                  const selectedIdx = selectedAnswers[q.id];
                  const isCorrect = selectedIdx === q.correctAnswerIndex;

                  return (
                    <div
                      key={q.id}
                      className={`p-6 rounded-xl border transition-all space-y-4 ${
                        isSubmitted
                          ? isCorrect
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : 'bg-rose-950/20 border-rose-500/40'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                            QUESTION {idx + 1} OF {totalQuestions} • {q.missionContext}
                          </span>
                          <h3 className="text-base font-serif text-white">{q.question}</h3>
                        </div>

                        {isSubmitted && (
                          <div className="flex items-center space-x-1 font-mono text-xs font-semibold shrink-0 ml-4">
                            {isCorrect ? (
                              <span className="text-emerald-400 flex items-center space-x-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>CORRECT</span>
                              </span>
                            ) : (
                              <span className="text-rose-400 flex items-center space-x-1">
                                <XCircle className="w-4 h-4" />
                                <span>INCORRECT</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selectedIdx === optIdx;
                          let optionClasses =
                            'p-3 rounded-lg border text-xs font-sans text-left transition-all flex items-start space-x-3 w-full ';

                          if (isSubmitted) {
                            if (optIdx === q.correctAnswerIndex) {
                              optionClasses +=
                                'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-medium';
                            } else if (isOptionSelected) {
                              optionClasses +=
                                'bg-rose-500/20 border-rose-500/60 text-rose-200 line-through';
                            } else {
                              optionClasses +=
                                'bg-white/5 border-white/5 text-slate-400 opacity-60';
                            }
                          } else {
                            if (isOptionSelected) {
                              optionClasses +=
                                'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-sm';
                            } else {
                              optionClasses +=
                                'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/15';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              disabled={isSubmitted}
                              className={optionClasses}
                            >
                              <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Actions & Explanation */}
                      {!isSubmitted && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => handleCheckAnswer(q.id)}
                            disabled={selectedIdx === undefined}
                            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-mono text-xs font-semibold tracking-wider uppercase transition-all"
                          >
                            VERIFY ANSWER
                          </button>
                        </div>
                      )}

                      {isSubmitted && (
                        <div className="p-3.5 rounded-lg bg-black/40 border border-white/10 text-xs leading-relaxed space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block font-semibold">
                            SCIENTIFIC EXPLANATION
                          </span>
                          <p className="text-slate-300 font-sans">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
