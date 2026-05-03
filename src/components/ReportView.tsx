import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Download, Package, Palette, Ruler, Sparkles, CheckCircle2, Layout, Plus } from 'lucide-react';
import { ProjectData, RoomDesignData, DesignReport as IDesignReport } from '../types';
import { analyzeRoomLayout, generateRoomRender } from '../services/geminiService';

interface ReportViewProps {
  project: ProjectData;
  room: RoomDesignData;
  onDesignAnother: () => void;
  onRestart: () => void;
}

export default function ReportView({ project, room, onDesignAnother, onRestart }: ReportViewProps) {
  const [report, setReport] = useState<IDesignReport | null>(null);
  const [status, setStatus] = useState<'analyzing' | 'rendering' | 'complete' | 'error'>('analyzing');

  useEffect(() => {
    const load = async () => {
      setStatus('analyzing');
      try {
        const result = await analyzeRoomLayout(project, room);
        setStatus('rendering');
        const renderUrl = await generateRoomRender(result.renderPrompt);
        setReport({ ...result, renderImageUrl: renderUrl });
        setStatus('complete');
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };
    load();
  }, [project, room]);

  const downloadImage = () => {
    if (!report?.renderImageUrl) return;
    const link = document.createElement('a');
    link.href = report.renderImageUrl;
    link.download = `${project.projectName}-${room.type}-Render.png`;
    link.click();
  };

  const exportBOM = () => {
    const data = {
      project: {
        name: project.projectName,
        age: project.propertyAge,
      },
      room: {
        type: room.type,
        style: room.style,
        layout: report?.layoutDescription,
        materials: report?.materialList,
        colors: report?.wallColors,
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.projectName}-${room.type}-Specs.json`;
    link.click();
  };

  if (status === 'analyzing' || status === 'rendering' || !report) {
    const messages = {
      analyzing: "Assessing original architecture and spatial heritage...",
      rendering: "Crafting the 8K atmospheric 3D visualization...",
      error: "Spatial analysis delayed. Re-initializing...",
      complete: "Finalizing architectural specs..."
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-paper p-12">
        <div className="text-center space-y-8 max-w-lg">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
            className="w-20 h-20 border-t-2 border-accent rounded-full mx-auto relative flex items-center justify-center"
          >
            <Sparkles className="w-6 h-6 text-accent animate-pulse" />
          </motion.div>
          <div className="space-y-4">
            <h2 className="text-4xl font-light italic">Designing the {room.type}</h2>
            <p className="text-accent uppercase text-[10px] tracking-[0.4em] font-bold">Studio Engine Phase: {status.toUpperCase()}</p>
          </div>
          <p className="text-ink/40 text-sm leading-relaxed serif-italic px-8">
            "{messages[status]}"
          </p>
          <div className="space-y-3 pt-12">
            <div className="h-[2px] bg-ink/5 rounded-full overflow-hidden w-64 mx-auto">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="h-full bg-accent w-1/2"
              />
            </div>
            <p className="text-[9px] text-ink/20 font-bold uppercase tracking-widest italic tracking-wider">Property: {project.projectName} • {project.propertyAge}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Header */}
      <header className="px-8 py-6 border-b luxury-border flex justify-between items-center sticky top-0 bg-paper/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-light leading-none">Project: <span className="serif-italic">{project.projectName}</span></h1>
          <div className="h-4 w-px bg-ink/10 hidden md:block" />
          <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold hidden md:block">{project.propertyAge}</p>
        </div>
        <div className="flex items-center gap-8">
          <button onClick={onDesignAnother} className="text-[11px] tracking-widest uppercase text-accent hover:text-ink transition-colors font-bold flex items-center gap-2 group">
            <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" /> Design Another Room
          </button>
          <button onClick={onRestart} className="text-[11px] tracking-widest uppercase text-ink/30 hover:text-ink transition-colors font-bold">Exit Studio</button>
        </div>
      </header>

      {/* Room Title */}
      <div className="px-8 py-20 flex flex-col items-center justify-center max-w-7xl mx-auto text-center space-y-4">
        <div className="space-y-0">
          <p className="text-accent uppercase text-xs tracking-[0.6em] font-bold mb-4">{room.style.replace('_', ' ')} • CURATED</p>
          <h2 className="text-8xl font-light">{room.type}</h2>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Render View */}
        <div className="lg:col-span-8 space-y-12">
          <section className="space-y-6">
            <div className="flex justify-between items-end">
              <h3 className="text-xs uppercase tracking-[0.4em] font-bold text-ink/30">Atmospheric Visualization</h3>
              <span className="flex items-center gap-2 text-[10px] text-accent tracking-widest font-bold">
                <Sparkles className="w-3 h-3" /> AI GENERATED CONCEPT
              </span>
            </div>
            <div className="aspect-video bg-ink/5 rounded-2xl overflow-hidden shadow-2xl relative group">
              {report?.renderImageUrl ? (
                <img 
                  src={report.renderImageUrl} 
                  alt="Room Render" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-ink/30 italic">Developing high-fidelity render...</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <button 
                  onClick={downloadImage}
                  className="px-8 py-4 bg-white text-ink text-xs uppercase tracking-widest font-bold flex items-center gap-3 active:scale-95 transition-transform"
                >
                  <Download className="w-4 h-4" /> Download 4K Render
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t luxury-border">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Layout className="w-5 h-5 text-accent" />
                <h3 className="text-[11px] uppercase tracking-widest font-bold">Architectural Layout & Flow</h3>
              </div>
              <div className="relative p-8 border luxury-border bg-white shadow-sm overflow-hidden group">
                {/* Decorative blueprint lines */}
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(#1a1a1a 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <p className="font-serif text-xl leading-relaxed italic text-ink/80 relative z-10">
                  {report?.layoutDescription}
                </p>
                <div className="mt-8 pt-6 border-t border-ink/5 flex items-center justify-between text-[10px] uppercase tracking-tighter font-bold text-ink/30">
                  <span>REF: INTERIEUR-SR-CURATED</span>
                  <span>Spatial Analysis: VERIFIED</span>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-3 text-accent border-b border-accent/20 pb-4">
                <Palette className="w-5 h-5" />
                <h3 className="text-[11px] uppercase tracking-widest font-bold">Bespoke Heritage Palette</h3>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {report?.wallColors.map((color, i) => (
                  <div key={i} className="flex items-center gap-6 group cursor-pointer">
                    <div className="w-20 h-20 shadow-inner border luxury-border transition-all group-hover:scale-105 group-hover:rotate-3" style={{ backgroundColor: color.hex }} />
                    <div className="space-y-1">
                      <h4 className="text-md font-bold uppercase tracking-widest">{color.name}</h4>
                      <p className="text-xs text-ink/40 font-serif italic">{color.brand}</p>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-[9px] font-mono bg-ink/5 px-2 py-0.5 rounded tracking-tighter uppercase">{color.hex}</span>
                        <span className="text-[9px] font-mono bg-ink/5 px-2 py-0.5 rounded tracking-tighter uppercase">MATTE FINISH</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Specs & Material List */}
        <div className="lg:col-span-4 space-y-12">
          <section className="p-8 rounded-2xl bg-paper border luxury-border space-y-8 sticky top-36 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-accent" />
                <h3 className="text-[11px] uppercase tracking-widest font-bold">Curation & Specs</h3>
              </div>
              <span className="text-[10px] bg-ink text-white px-2 py-1 tracking-widest uppercase">Verified</span>
            </div>

            <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
              {report?.materialList.map((item, i) => (
                <div key={i} className="space-y-2 group">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold tracking-tight">{item.name}</h4>
                    <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded uppercase font-bold">Qty: {item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink/40">
                    <Ruler className="w-3 h-3" />
                    <span className="text-[11px] font-mono tracking-tighter">{item.dimensions}</span>
                  </div>
                  <div className="h-px w-full bg-ink/5 group-last:hidden" />
                </div>
              ))}
            </div>

            <button 
              onClick={exportBOM}
              className="w-full py-5 border-2 border-ink text-ink text-[11px] uppercase tracking-widest font-bold hover:bg-ink hover:text-white transition-all flex items-center justify-center gap-3 group"
            >
              <CheckCircle2 className="w-4 h-4 text-accent" /> Export Full Bill of Materials
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
