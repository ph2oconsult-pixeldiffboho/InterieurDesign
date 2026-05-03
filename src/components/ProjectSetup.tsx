import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, ChevronRight, Map, Calendar, ArrowLeft, Sparkles } from 'lucide-react';
import { ProjectData } from '../types';
import { PROPERTY_PERIODS } from '../constants';

import imageCompression from 'browser-image-compression';

interface ProjectSetupProps {
  onComplete: (data: Partial<ProjectData>) => void;
  onQuickStart: (data: Partial<ProjectData>) => void;
  onBack: () => void;
}

export default function ProjectSetup({ onComplete, onQuickStart, onBack }: ProjectSetupProps) {
  const [step, setStep] = useState(1);
  const [isCompressing, setIsCompressing] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    propertyAge: '',
    floorPlanImage: null as string | null,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({ ...formData, floorPlanImage: reader.result as string });
          setIsCompressing(false);
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error('Compression error:', err);
        setIsCompressing(false);
      }
    }
  };

  const next = () => {
    if (step < 3) setStep(step + 1);
    else onComplete(formData);
  };

  const handleProMode = () => {
    onQuickStart(formData);
  };

  const prev = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  return (
    <div className="min-h-screen p-8 md:p-24 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <button onClick={prev} className="flex items-center gap-2 text-ink/40 text-xs tracking-widest uppercase mb-12 hover:text-ink transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back
        </button>

        <div className="flex gap-2 mb-12">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 transition-all duration-500 ${i <= step ? 'bg-accent' : 'bg-ink/10'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-accent uppercase text-[10px] tracking-[0.3em] font-semibold">Phase 01</span>
                <h2 className="text-4xl font-light">Project Identification</h2>
                <p className="text-ink/50 text-sm">Every masterpiece begins with a name.</p>
              </div>
              
              <div className="space-y-4">
                <label className="block text-[10px] uppercase tracking-widest text-ink/40 font-bold">Residency Title</label>
                <input 
                  type="text"
                  placeholder="e.g. The Somerset Estate"
                  className="w-full bg-transparent border-b luxury-border py-4 text-xl focus:outline-none focus:border-accent transition-colors placeholder:text-ink/10"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                />
              </div>

              <button 
                onClick={next}
                disabled={!formData.projectName}
                className="w-full py-5 bg-ink text-white text-xs tracking-widest uppercase hover:bg-accent disabled:opacity-30 transition-all flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-accent uppercase text-[10px] tracking-[0.3em] font-semibold">Phase 02</span>
                <h2 className="text-4xl font-light">Architectural Heritage</h2>
                <p className="text-ink/50 text-sm">The period of the property dictates its spatial DNA.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {PROPERTY_PERIODS.map(period => (
                  <button
                    key={period.id}
                    onClick={() => { setFormData({ ...formData, propertyAge: period.name }); next(); }}
                    className={`p-5 border text-left transition-all hover:border-accent group ${formData.propertyAge === period.name ? 'border-accent bg-accent/5' : 'luxury-border'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-semibold tracking-wide">{period.name}</h4>
                        <p className="text-[10px] text-ink/40 font-serif italic mt-1">{period.description}</p>
                      </div>
                      <Calendar className={`w-4 h-4 mt-1 ${formData.propertyAge === period.name ? 'text-accent' : 'text-ink/10 group-hover:text-accent/50'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-accent uppercase text-[10px] tracking-[0.3em] font-semibold">Phase 03</span>
                <h2 className="text-4xl font-light">Spatial Blueprint</h2>
                <p className="text-ink/50 text-sm">Upload a floor plan image for layout assessment.</p>
              </div>

              <div 
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${formData.floorPlanImage ? 'border-accent bg-accent/5' : 'luxury-border hover:border-accent/50'}`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                {isCompressing ? (
                  <div className="space-y-4">
                    <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-accent uppercase tracking-widest font-bold">Optimizing Blueprint...</p>
                  </div>
                ) : formData.floorPlanImage ? (
                  <div className="space-y-4">
                    <img src={formData.floorPlanImage} alt="Preview" className="h-48 mx-auto object-contain rounded shadow-lg" />
                    <p className="text-xs text-accent uppercase tracking-widest font-bold">Blueprint Detected</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                      <Map className="w-8 h-8 text-accent" />
                    </div>
                    <p className="text-ink/40 text-sm">Drag and drop or click to upload</p>
                    <p className="text-[10px] text-ink/20 uppercase tracking-[0.2em] font-bold">Supports PNG, JPG (Max 5MB)</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button 
                  onClick={next}
                  className="w-full py-5 bg-ink text-white text-xs tracking-[0.3em] uppercase hover:bg-accent transition-all flex items-center justify-center gap-2 group"
                >
                  Standard Portfolio Setup <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleProMode}
                  className="w-full py-5 border-2 border-accent text-accent text-xs tracking-[0.3em] uppercase hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 group italic font-serif"
                >
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" /> 
                  Advanced Pro Technical Brief
                </button>
                <button 
                  onClick={next}
                  className="w-full py-3 text-ink/20 text-[10px] tracking-widest uppercase hover:text-ink transition-colors"
                >
                  Skip spatial upload
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
