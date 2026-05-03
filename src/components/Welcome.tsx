import { motion } from 'motion/react';
import { ArrowRight, Compass, Home, Layout } from 'lucide-react';
import { APP_VERSION } from '../constants';

interface WelcomeProps {
  onStart: () => void;
}

export default function Welcome({ onStart }: WelcomeProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-paper relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 border-t border-r luxury-border -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 border-b border-l luxury-border -ml-12 -mb-12 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="max-w-3xl text-center z-10"
      >
        <span className="uppercase tracking-[0.4em] text-xs font-semibold mb-6 block text-accent">Est. 2026</span>
        <h1 className="text-7xl md:text-8xl mb-8 leading-tight font-light">
          Intèrieur <span className="serif-italic">Design</span>
        </h1>
        <p className="font-serif text-2xl md:text-3xl text-ink/70 mb-12 max-w-2xl mx-auto leading-relaxed italic">
          "Where architectural heritage meets the future of generative spatial design."
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 text-left border-y luxury-border py-10">
          <div className="space-y-3">
            <Compass className="w-6 h-6 text-accent" />
            <h3 className="font-semibold uppercase text-[11px] tracking-widest">Precision Layouts</h3>
            <p className="text-sm text-ink/60">Advanced spatial analysis of your floor plan images.</p>
          </div>
          <div className="space-y-3">
            <Home className="w-6 h-6 text-accent" />
            <h3 className="font-semibold uppercase text-[11px] tracking-widest">Period Authenticity</h3>
            <p className="text-sm text-ink/60">Design logic tailored to your property's architectural age.</p>
          </div>
          <div className="space-y-3">
            <Layout className="w-6 h-6 text-accent" />
            <h3 className="font-semibold uppercase text-[11px] tracking-widest">Visual Fidelity</h3>
            <p className="text-sm text-ink/60">Bespoke 3D renders generated for every room concept.</p>
          </div>
        </div>

        <button 
          onClick={onStart}
          className="group relative inline-flex items-center gap-4 px-12 py-5 bg-ink text-white font-medium uppercase text-xs tracking-[0.2em] overflow-hidden transition-all hover:pr-14 active:scale-95"
        >
          <span className="relative z-10">Initialize Design Studio</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
          <div className="absolute inset-0 bg-accent transform translate-y-full transition-transform group-hover:translate-y-0 duration-500" />
        </button>
      </motion.div>

      <div className="absolute bottom-8 right-8 text-[9px] uppercase tracking-[0.2em] font-bold text-ink/20 font-mono">
        v{APP_VERSION} PREVIEW
      </div>
    </div>
  );
}
