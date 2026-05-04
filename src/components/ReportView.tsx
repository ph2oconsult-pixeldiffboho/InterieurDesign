import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Download, Package, Palette, Ruler, Sparkles, CheckCircle2, Layout, Plus, RotateCcw } from 'lucide-react';
import { APP_VERSION } from '../constants';
import { ProjectData, RoomDesignData, DesignReport as IDesignReport } from '../types';
import { analyzeRoomLayout, generateRoomRender, refineRoomLayout } from '../services/geminiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ReportViewProps {
  project: ProjectData;
  room: RoomDesignData;
  onDesignAnother: () => void;
  onRestart: () => void;
}

export default function ReportView({ project, room, onDesignAnother, onRestart }: ReportViewProps) {
  const [report, setReport] = useState<IDesignReport | null>(null);
  const [status, setStatus] = useState<'analyzing' | 'rendering' | 'complete' | 'error'>('analyzing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleError = (err: any) => {
    console.error(err);
    let message = err?.message || err?.toString() || "An unexpected error occurred during spatial analysis.";
    
    if (message.includes("429") || err?.status === 429 || message.includes("RESOURCE_EXHAUSTED")) {
      message = "AI Studio Engine is at capacity. Your minute/daily quota has been reached. Please wait a moment or check your Gemini API plan.";
    } else {
      message = "Error details: " + JSON.stringify({
        code: err?.status || err?.code,
        message: err?.message || message,
        status: err?.statusText || "UNKNOWN"
      });
    }
    
    setErrorMessage(message);
    setStatus('error');
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setStatus('analyzing');
      setErrorMessage(null);
      try {
        const result = await analyzeRoomLayout(project, room);
        if (cancelled) return;
        setStatus('rendering');
        
        let renderUrl: string | undefined = undefined;
        let secondaryUrl: string | undefined = undefined;
        
        try {
          renderUrl = await generateRoomRender(result.renderPrompt, project.floorPlanImage || undefined);
        } catch (err: any) {
          console.error("Failed to generate primary render", err);
        }
        
        if (cancelled) return;
        
        try {
          // Delay briefly to help with rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
          secondaryUrl = await generateRoomRender(result.secondaryRenderPrompt, project.floorPlanImage || undefined);
        } catch (err: any) {
          console.error("Failed to generate secondary render", err);
        }
        
        if (cancelled) return;

        setReport({ 
          ...result, 
          renderImageUrl: renderUrl, 
          secondaryRenderImageUrl: secondaryUrl 
        });
        setStatus('complete');
      } catch (err: any) {
        if (cancelled) return;
        handleError(err);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefine = async () => {
    if (!feedback.trim() || !report) return;
    setStatus('analyzing');
    setErrorMessage(null);
    try {
      const result = await refineRoomLayout(project, room, report, feedback);
      setStatus('rendering');
      
      let renderUrl: string | undefined = undefined;
      let secondaryUrl: string | undefined = undefined;
      
      try {
        renderUrl = await generateRoomRender(result.renderPrompt, project.floorPlanImage || undefined);
      } catch (err: any) {
        console.error("Failed to generate primary render", err);
      }
      
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        secondaryUrl = await generateRoomRender(result.secondaryRenderPrompt, project.floorPlanImage || undefined);
      } catch (err: any) {
        console.error("Failed to generate secondary render", err);
      }

      setReport({ 
        ...result, 
        renderImageUrl: renderUrl, 
        secondaryRenderImageUrl: secondaryUrl 
      });
      setStatus('complete');
      setFeedback('');
    } catch (err: any) {
      handleError(err);
    }
  };

  const downloadImage = (url?: string, suffix: string = 'Primary') => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.projectName}-${room.type}-${suffix}.png`;
    link.click();
  };

  const exportPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    setIsExporting(true);
    try {
      // Small delay to ensure any fonts/images are ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FCFCF9' // paper color
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${project.projectName}-${room.type}-Specs.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper p-12">
        <div className="text-center space-y-8 max-w-lg">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full mx-auto flex items-center justify-center">
            <Plus className="w-8 h-8 rotate-45" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-light italic">Analysis Interrupted</h2>
            <p className="text-red-500 uppercase text-[10px] tracking-[0.4em] font-bold">Studio Engine Error</p>
          </div>
          <p className="text-ink/60 text-sm leading-relaxed serif-italic px-8">
            {errorMessage || "An unexpected error occurred during spatial analysis. This may be due to high demand or an issue with the floor plan clarity."}
          </p>
          <div className="pt-8 flex flex-col gap-4 items-center">
            <button 
              onClick={() => window.location.reload()}
              className="w-full max-w-xs px-8 py-4 bg-ink text-white text-xs uppercase tracking-widest font-bold hover:bg-accent transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={onRestart}
              className="text-xs uppercase tracking-widest font-bold text-ink/40 hover:text-ink transition-colors"
            >
              Return to Studio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'analyzing' || status === 'rendering' || !report) {
    const isRefining = !!report;
    const messages = {
      analyzing: isRefining ? "Refining the design based on your feedback..." : "Assessing original architecture and spatial heritage...",
      rendering: isRefining ? "Regenerating 8K atmospheric 3D visualization..." : "Crafting the 8K atmospheric 3D visualization...",
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
            <p className="text-[9px] text-ink/20 font-bold uppercase tracking-widest italic">Property: {project.projectName} • {project.propertyAge}</p>
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
          <div className="h-4 w-px bg-ink/10 hidden md:block" />
          <p className="text-[9px] uppercase tracking-widest text-ink/20 font-bold hidden md:block">v{APP_VERSION}</p>
        </div>
        <div className="flex items-center gap-8">
          <button onClick={onDesignAnother} className="text-[11px] tracking-widest uppercase text-accent hover:text-ink transition-colors font-bold flex items-center gap-2 group">
            <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" /> Design Another Room
          </button>
          <button onClick={onRestart} className="text-[11px] tracking-widest uppercase text-ink/30 hover:text-ink transition-colors font-bold flex items-center gap-2">
            <RotateCcw className="w-3 h-3" /> Reset Project
          </button>
        </div>
      </header>

      {/* Room Title */}
      <div className="px-8 py-20 flex flex-col items-center justify-center max-w-7xl mx-auto text-center space-y-4">
        <div className="space-y-0">
          <p className="text-accent uppercase text-xs tracking-[0.6em] font-bold mb-4">{room.style.replace('_', ' ')} • CURATED</p>
          <h2 className="text-8xl font-light">{room.type}</h2>
        </div>
      </div>

      <main id="report-content" className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Render View */}
        <div className="lg:col-span-8 space-y-12">
          <section className="space-y-8">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h3 className="text-xs uppercase tracking-[0.4em] font-bold text-ink/30">Primary Atmosphere Study</h3>
                <span className="flex items-center gap-2 text-[10px] text-accent tracking-widest font-bold">
                  <Sparkles className="w-3 h-3" /> CONCEPT 01
                </span>
              </div>
              <div className="aspect-video bg-ink/5 rounded-2xl overflow-hidden shadow-2xl relative group">
                {report?.renderImageUrl ? (
                  <img 
                    src={report.renderImageUrl} 
                    alt="Primary Render" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : status === 'complete' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-6 text-center">
                    <p className="text-sm font-bold text-red-500/80">API Limit Reached</p>
                    <p className="text-xs text-ink/40">The spatial analysis succeeded, but image generation was skipped due to Gemini API rate limits. Please check your Quota or select a paid key.</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-ink/30 italic">Developing primary angle...</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <button 
                    onClick={() => downloadImage(report?.renderImageUrl, 'Primary')}
                    disabled={!report?.renderImageUrl}
                    className="px-8 py-4 bg-white text-ink text-xs uppercase tracking-widest font-bold flex items-center gap-3 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" /> Download Mood 01
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h3 className="text-xs uppercase tracking-[0.4em] font-bold text-ink/30">Secondary Mood Study</h3>
                <span className="flex items-center gap-2 text-[10px] text-ink/20 tracking-widest font-bold">
                  CONCEPT 02
                </span>
              </div>
              <div className="aspect-video bg-ink/5 rounded-2xl overflow-hidden shadow-2xl relative group">
                {report?.secondaryRenderImageUrl ? (
                  <img 
                    src={report.secondaryRenderImageUrl} 
                    alt="Secondary Render" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : status === 'complete' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-6 text-center">
                    <p className="text-sm font-bold text-red-500/80">API Limit Reached</p>
                    <p className="text-xs text-ink/40">The spatial analysis succeeded, but image generation was skipped due to Gemini API rate limits. Please check your Quota or select a paid key.</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-ink/30 italic">Developing reverse angle...</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <button 
                    onClick={() => downloadImage(report?.secondaryRenderImageUrl, 'Reverse')}
                    className="px-8 py-4 bg-white text-ink text-xs uppercase tracking-widest font-bold flex items-center gap-3 active:scale-95 transition-transform"
                  >
                    <Download className="w-4 h-4" /> Download Mood 02
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="px-6 py-4 bg-accent/5 border-l-2 border-accent/40 rounded-r">
            <p className="text-[11px] text-ink/60 leading-relaxed font-serif italic">
              These visuals are <span className="not-italic font-bold text-ink/80">atmosphere studies</span> — 
              they illustrate the proposed style, palette, materials, and mood. For dimensionally accurate 
              spatial planning, refer to the Structural Audit and Bill of Materials. The renders should be 
              treated as inspiration, not blueprints.
            </p>
          </aside>

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

            <div className="space-y-8 md:col-span-2 pt-8 border-t luxury-border">
              <div className="flex items-center gap-3 border-b border-accent/20 pb-4">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className="text-[11px] uppercase tracking-widest font-bold">Refine Design</h3>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-ink/60 font-serif italic">
                  Not quite right? Provide feedback to adjust the layout, color palette, or overall mood, and we will regenerate the concept.
                </p>
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. 'The palette is too dark, make it lighter' or 'Remove the cupboards on the left wall to make it less cramped'"
                  className="w-full bg-white border luxury-border p-4 min-h-[100px] text-sm font-serif resize-y focus:outline-none focus:border-accent transition-colors"
                />
                <button 
                  onClick={handleRefine}
                  disabled={!feedback.trim()}
                  className="px-8 py-4 bg-ink text-white text-xs uppercase tracking-widest font-bold disabled:opacity-50 hover:bg-accent transition-colors block ml-auto"
                >
                  Regenerate Concept
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Specs & Material List */}
        <div className="lg:col-span-4 space-y-8">
          {/* Architectural Audit */}
          <section className="p-8 rounded-2xl bg-white border luxury-border space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Ruler className="w-5 h-5 text-accent" />
              <h3 className="text-[11px] uppercase tracking-widest font-bold">Structural Audit <span className="text-accent font-normal italic"> — Dimensional Truth</span></h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-ink/[0.02] border border-ink/[0.05]">
                <p className="text-2xl font-serif italic text-accent leading-none">{report?.structuralAudit?.doors || 0}</p>
                <p className="text-[8px] uppercase tracking-widest text-ink/30 font-bold mt-2">Doors</p>
              </div>
              <div className="text-center p-3 bg-ink/[0.02] border border-ink/[0.05]">
                <p className="text-2xl font-serif italic text-accent leading-none">{report?.structuralAudit?.windows || 0}</p>
                <p className="text-[8px] uppercase tracking-widest text-ink/30 font-bold mt-2">Windows</p>
              </div>
              <div className="text-center p-3 bg-ink/[0.02] border border-ink/[0.05]">
                <p className="text-2xl font-serif italic text-accent leading-none">{report?.structuralAudit?.radiators || 0}</p>
                <p className="text-[8px] uppercase tracking-widest text-ink/30 font-bold mt-2">Rads</p>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-ink/5">
              {report?.structuralAudit?.dimensionsAndCeilingHeight && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-ink/30 font-bold mb-1">Dimensions & Ceiling</p>
                  <p className="text-xs text-ink/70 serif-italic">{report.structuralAudit.dimensionsAndCeilingHeight}</p>
                </div>
              )}
              {report?.structuralAudit?.restrictions && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-ink/30 font-bold mb-1">Key Restrictions</p>
                  <p className="text-xs text-red-500/80 serif-italic">{report.structuralAudit.restrictions}</p>
                </div>
              )}
            </div>

            {report?.structuralAudit?.other && (
              <p className="px-4 py-2 bg-accent/5 border-l border-accent text-[10px] text-accent/80 italic serif-italic">
                "{report.structuralAudit.other}"
              </p>
            )}
            <p className="text-[9px] text-ink/20 font-bold uppercase tracking-widest leading-relaxed">
              * This audit is the dimensional source of truth. The renders above are stylistic; trust these counts.
            </p>
          </section>

          <section className="p-8 rounded-2xl bg-paper border luxury-border space-y-8 sticky top-36 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-accent" />
                <h3 className="text-[11px] uppercase tracking-widest font-bold">Curation & Specs</h3>
              </div>
              <span className="text-[10px] bg-ink text-white px-2 py-1 tracking-widest uppercase">Verified</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-ink/30 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Visual Identity
                </h4>
                <p className="text-xs text-ink/60 leading-relaxed italic border-l border-accent/20 pl-4 py-1">
                  {report?.visualIdentity}
                </p>
              </div>
              <div className="h-px w-full bg-ink/5" />
            </div>

            <div className="space-y-6 overflow-y-auto max-h-[40vh] pr-4 custom-scrollbar">
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
              onClick={exportPDF}
              disabled={isExporting}
              className={`w-full py-5 border-2 border-ink text-ink text-[11px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-3 group ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ink hover:text-white'}`}
            >
              <CheckCircle2 className="w-4 h-4 text-accent" /> 
              {isExporting ? 'Generating PDF...' : 'Export Full Spec to PDF'}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
