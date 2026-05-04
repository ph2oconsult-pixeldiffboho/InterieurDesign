import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Layout, Trash2, Plus, Sparkles, CheckCircle, Info, ChevronLeft, RotateCcw } from 'lucide-react';
import { RoomDesignData, RoomType, StyleType } from '../types';
import { ROOM_TYPES, STYLES, ROOM_SPECIFIC_QUESTIONS } from '../constants';

interface RoomWizardProps {
  onComplete: (room: RoomDesignData) => void;
  onBack: () => void;
  onRestart: () => void;
}

export default function RoomWizard({ onComplete, onBack, onRestart }: RoomWizardProps) {
  const [currentRoom, setCurrentRoom] = useState<Partial<RoomDesignData>>({ 
    specificAnswers: {}, 
    existingFurniture: '', 
    style: 'modern' 
  });
  const [step, setStep] = useState<'selection' | 'style' | 'questions'>('selection');

  const addRoom = (type: RoomType) => {
    setCurrentRoom(prev => ({ ...prev, type }));
    setStep('style');
  };

  const saveRoom = () => {
    if (currentRoom?.type && currentRoom?.style) {
      onComplete(currentRoom as RoomDesignData);
    }
  };

  return (
    <div className="min-h-screen p-8 md:p-24 bg-paper">
      <div className="max-w-4xl mx-auto border luxury-border bg-white/40 backdrop-blur-sm p-12 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Background decorative blueprint lines */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.02] pointer-events-none transform translate-x-12 -translate-y-12">
          <Layout className="w-full h-full" />
        </div>

        <button onClick={onBack} className="absolute top-12 left-12 p-3 hover:bg-ink hover:text-white rounded-full transition-all border luxury-border">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button onClick={onRestart} className="absolute top-12 right-12 flex items-center gap-2 text-ink/40 text-xs tracking-widest uppercase hover:text-ink transition-colors">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>

        <div className="mt-12">
          <AnimatePresence mode="wait">
            {step === 'selection' && (
              <motion.div 
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="text-center space-y-4">
                  <span className="text-accent uppercase text-[10px] tracking-[0.4em] font-bold">Spatial Selection</span>
                  <h3 className="text-5xl font-light">Identify the Room</h3>
                  <p className="text-ink/40 font-serif italic text-lg">Which sanctuary are we architecturalizing today?</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {ROOM_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => addRoom(type)}
                      className="p-6 border luxury-border rounded-xl text-left hover:border-accent transition-all group active:scale-95 bg-white/50"
                    >
                      <Plus className="w-4 h-4 text-ink/20 group-hover:text-accent mb-4" />
                      <span className="text-sm font-semibold tracking-wide">{type}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'style' && (
              <motion.div 
                key="style"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="text-center space-y-4">
                  <span className="text-accent uppercase text-[10px] tracking-[0.4em] font-bold">{currentRoom?.type} DESIGN</span>
                  <h3 className="text-5xl font-light">Aesthetic Direction</h3>
                  <p className="text-ink/40 font-serif italic text-lg">Select a curated visual language for this space.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => { setCurrentRoom({ ...currentRoom, style: style.id }); setStep('questions'); }}
                      className={`p-8 border rounded-xl text-left transition-all hover:border-accent group ${currentRoom?.style === style.id ? 'border-accent bg-accent/5' : 'luxury-border bg-white/50'}`}
                    >
                      <h4 className="text-sm font-bold uppercase tracking-widest mb-3 group-hover:text-accent transition-colors">{style.name}</h4>
                      <p className="text-[11px] text-ink/40 leading-relaxed font-serif italic">{style.description}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'questions' && (
              <motion.div 
                key="questions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-16"
              >
                <div className="text-center space-y-4">
                  <span className="text-accent uppercase text-[10px] tracking-[0.4em] font-bold">The Fine Detail</span>
                  <h3 className="text-5xl font-light">Custom Tailoring</h3>
                  <p className="text-ink/40 font-serif italic text-lg">Fine-tuning the {currentRoom?.type} logistics.</p>
                </div>

                <div className="space-y-12 max-w-2xl mx-auto">
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-widest text-ink/40 font-bold">Unmovable Architectural Features</label>
                    <textarea 
                      placeholder="e.g. 2 Windows with radiators (1m tall) under both, 1 Door (north wall), Victorian cornicing, original marble fireplace..."
                      className="w-full bg-transparent border-b luxury-border py-4 focus:outline-none focus:border-accent transition-colors placeholder:text-ink/10 h-24 resize-none text-xl font-serif italic"
                      value={currentRoom?.architecturalFeatures || ''}
                      onChange={(e) => setCurrentRoom({ ...currentRoom, architecturalFeatures: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-widest text-ink/40 font-bold">Existing Furniture & Sentimental Items</label>
                    <textarea 
                      placeholder="e.g. A heritage 19th C dining table we wish to restore and keep..."
                      className="w-full bg-transparent border-b luxury-border py-4 focus:outline-none focus:border-accent transition-colors placeholder:text-ink/10 h-24 resize-none text-xl font-serif italic"
                      value={currentRoom?.existingFurniture || ''}
                      onChange={(e) => setCurrentRoom({ ...currentRoom, existingFurniture: e.target.value })}
                    />
                  </div>

                  {currentRoom?.type && ROOM_SPECIFIC_QUESTIONS[currentRoom.type]?.map(q => (
                    <div key={q.id} className="space-y-6">
                      <label className="block text-[10px] uppercase tracking-widest text-ink/40 font-bold">{q.label}</label>
                      {q.type === 'text' ? (
                        <input 
                          type="text"
                          className="w-full bg-transparent border-b luxury-border py-4 focus:outline-none focus:border-accent transition-colors placeholder:text-ink/10 text-xl font-serif italic"
                          onChange={(e) => setCurrentRoom({ 
                            ...currentRoom, 
                            specificAnswers: { ...currentRoom.specificAnswers, [q.id]: e.target.value } 
                          })}
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options?.map(opt => (
                            <button
                              key={opt}
                              onClick={() => setCurrentRoom({ 
                                ...currentRoom, 
                                specificAnswers: { ...currentRoom.specificAnswers, [q.id]: opt } 
                              })}
                              className={`px-6 py-4 text-xs text-left border rounded-lg transition-all ${
                                currentRoom.specificAnswers?.[q.id] === opt 
                                ? 'bg-ink text-white border-ink shadow-lg scale-105' 
                                : 'luxury-border hover:border-accent bg-white/50'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-8">
                  <button 
                    onClick={saveRoom}
                    className="w-full max-w-2xl mx-auto py-6 bg-accent text-white text-xs tracking-widest uppercase hover:bg-ink transition-all flex items-center justify-center gap-4 shadow-xl"
                  >
                    <Sparkles className="w-4 h-4" /> Commission Design Study
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
