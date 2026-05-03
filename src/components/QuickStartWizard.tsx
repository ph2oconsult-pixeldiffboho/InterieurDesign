import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, ChevronLeft, Sparkles, Image as ImageIcon, X, Layout, Plus } from 'lucide-react';
import { RoomDesignData, RoomType, StyleType } from '../types';
import { ROOM_TYPES, STYLES, PROPERTY_PERIODS } from '../constants';
import imageCompression from 'browser-image-compression';

interface QuickStartWizardProps {
  onComplete: (data: RoomDesignData) => void;
  onBack: () => void;
  projectName: string;
  propertyAge: string;
}

export default function QuickStartWizard({ onComplete, onBack, projectName, propertyAge }: QuickStartWizardProps) {
  const [formData, setFormData] = useState<Partial<RoomDesignData>>({
    type: 'Lounge Room',
    style: 'english_townhouse',
    specificAnswers: {},
    existingFurniture: '',
    referenceImages: [],
    technicalBrief: ''
  });
  const [isCompressing, setIsCompressing] = useState(false);

  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setIsCompressing(true);
      const newImages: string[] = [];
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true };

      try {
        for (let i = 0; i < files.length; i++) {
          const compressedFile = await imageCompression(files[i], options);
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(compressedFile);
          });
          newImages.push(dataUrl);
        }
        setFormData(prev => ({ 
          ...prev, 
          referenceImages: [...(prev.referenceImages || []), ...newImages] 
        }));
      } catch (err) {
        console.error('Compression error:', err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referenceImages: prev.referenceImages?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (formData.type && formData.style) {
      onComplete(formData as RoomDesignData);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 bg-paper">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <button onClick={onBack} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-ink/40 hover:text-accent transition-colors">
              <ChevronLeft className="w-3 h-3" /> Back to Project
            </button>
            <div className="space-y-1">
              <h2 className="text-4xl font-light">Pro Technical Brief</h2>
              <p className="text-ink/40 font-serif italic">Studio Quick-Start: {projectName} • {propertyAge}</p>
            </div>
          </div>
          <div className="h-20 w-px bg-ink/10 hidden md:block" />
          <div className="hidden md:block text-right">
            <span className="text-accent uppercase text-[9px] tracking-[0.4em] font-bold">Studio Status</span>
            <p className="text-xs font-mono mt-1">ENGINE_v3.2_READY</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Visual Assets */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-accent" /> Reference Library
              </h3>
              <p className="text-xs text-ink/50 leading-relaxed">
                Upload furniture specs, mood images, or architectural details you want explicitly incorporated.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence>
                {formData.referenceImages?.map((img, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={i} 
                    className="relative aspect-square rounded-xl overflow-hidden border luxury-border group"
                  >
                    <img src={img} alt="Reference" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <label className="aspect-square border-2 border-dashed luxury-border rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-accent transition-all group overflow-hidden relative">
                <input type="file" multiple className="hidden" accept="image/*" onChange={handleMultiFileUpload} />
                {isCompressing ? (
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-6 h-6 text-ink/20 group-hover:text-accent group-active:scale-95 transition-all" />
                    <span className="text-[9px] uppercase tracking-widest font-bold text-ink/30">Add References</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Right Column: Technical Specification */}
          <div className="lg:col-span-7 space-y-12 pl-0 lg:pl-12 border-l luxury-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40">Room Category</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as RoomType })}
                  className="w-full bg-transparent border-b luxury-border py-2 text-lg font-serif italic focus:outline-none focus:border-accent"
                >
                  {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40">Design Language</label>
                <select 
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value as StyleType })}
                  className="w-full bg-transparent border-b luxury-border py-2 text-lg font-serif italic focus:outline-none focus:border-accent"
                >
                  {STYLES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40 flex items-center gap-2">
                <Layout className="w-3 h-3" /> Technical Brief & Structural Cues
              </label>
              <textarea 
                placeholder="Specify requirements for: Lighting logic, Heritage paneling, Built-in cabinetry, Floor materials, or specific spatial constraints..."
                className="w-full bg-white/50 border luxury-border p-6 rounded-2xl h-48 focus:outline-none focus:border-accent transition-all text-sm leading-relaxed font-serif italic"
                value={formData.technicalBrief}
                onChange={(e) => setFormData({ ...formData, technicalBrief: e.target.value })}
              />
              <p className="text-[9px] text-ink/30 italic">
                * Our AI architect will cross-reference this brief with your uploaded floor plan and furniture references.
              </p>
            </div>

            <div className="pt-8">
              <button 
                onClick={handleSubmit}
                disabled={!formData.type || !formData.style || isCompressing}
                className="w-full py-6 bg-ink text-white text-xs tracking-[0.4em] uppercase hover:bg-accent transition-all flex items-center justify-center gap-4 shadow-2xl disabled:opacity-30 group"
              >
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" /> 
                Commission AI Architecture Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
