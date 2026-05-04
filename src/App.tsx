/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Welcome from './components/Welcome';
import ProjectSetup from './components/ProjectSetup';
import RoomWizard from './components/RoomWizard';
import ReportView from './components/ReportView';
import QuickStartWizard from './components/QuickStartWizard';
import { ProjectData, RoomDesignData } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';

type WizardStep = 'welcome' | 'setup' | 'rooms' | 'quickstart' | 'report';

export default function App() {
  const [step, setStep] = useState<WizardStep>(() => {
    try {
      const saved = localStorage.getItem('interieur_step');
      return (saved as WizardStep) || 'welcome';
    } catch (e) {
      console.error('Failed to load step from localStorage', e);
      return 'welcome';
    }
  });
  const [currentRoom, setCurrentRoom] = useState<RoomDesignData | null>(() => {
    try {
      const saved = localStorage.getItem('interieur_current_room');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to load currentRoom from localStorage', e);
      return null;
    }
  });
  const [project, setProject] = useState<ProjectData>(() => {
    try {
      const saved = localStorage.getItem('interieur_project');
      return saved ? JSON.parse(saved) : {
        projectName: '',
        propertyAge: '',
        floorPlanImage: null,
        rooms: []
      };
    } catch (e) {
      console.error('Failed to load project from localStorage', e);
      return {
        projectName: '',
        propertyAge: '',
        floorPlanImage: null,
        rooms: []
      };
    }
  });

  // Sync to local storage
  React.useEffect(() => {
    try {
      localStorage.setItem('interieur_step', step);

      // Strip heavy base64 fields before persisting
      const projectLite = {
        ...project,
        floorPlanImage: null,
        rooms: project.rooms.map(r => ({
          ...r,
          referenceImages: undefined,
        })),
      };
      localStorage.setItem('interieur_project', JSON.stringify(projectLite));

      const roomLite = currentRoom
        ? { ...currentRoom, referenceImages: undefined }
        : null;
      localStorage.setItem('interieur_current_room', JSON.stringify(roomLite));
    } catch (e) {
      console.warn('localStorage write failed (likely quota):', e);
    }
  }, [step, project, currentRoom]);

  // Safety: Redirect to welcome if in report step without currentRoom
  React.useEffect(() => {
    if (step === 'report' && !currentRoom) {
      setStep('rooms');
    }
  }, [step, currentRoom]);

  const handleStart = () => setStep('setup');
  
  const handleSetupComplete = (data: Partial<ProjectData>) => {
    setProject(prev => ({ ...prev, ...data }));
    setStep('rooms');
  };

  const handleQuickStartInit = (data: Partial<ProjectData>) => {
    setProject(prev => ({ ...prev, ...data }));
    setStep('quickstart');
  };

  const handleRoomComplete = (room: RoomDesignData) => {
    setCurrentRoom(room);
    setProject(prev => ({ ...prev, rooms: [...prev.rooms, room] }));
    setStep('report');
  };

  const handleDesignAnother = () => {
    setCurrentRoom(null);
    setStep('rooms');
  };

  const handleRestart = () => {
    if (confirm("This will permanently clear all project data and renders. Proceed?")) {
      setProject({ projectName: '', propertyAge: '', floorPlanImage: null, rooms: [] });
      setCurrentRoom(null);
      setStep('welcome');
      ['interieur_step', 'interieur_project', 'interieur_current_room']
        .forEach(k => localStorage.removeItem(k));
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-red-500 text-white text-xs text-center py-1 font-bold tracking-wider">
        DEVELOPMENT BUILD: API Key is exposed to the client. Do not deploy this URL publicly.
      </div>
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Welcome onStart={handleStart} />
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProjectSetup 
              onComplete={handleSetupComplete} 
              onQuickStart={handleQuickStartInit}
              onBack={() => setStep('welcome')} 
              onRestart={handleRestart}
            />
          </motion.div>
        )}

        {step === 'rooms' && (
          <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RoomWizard 
              onComplete={handleRoomComplete} 
              onBack={() => setStep('setup')} 
              onRestart={handleRestart}
            />
          </motion.div>
        )}

        {step === 'quickstart' && (
          <motion.div key="quickstart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuickStartWizard 
              onComplete={handleRoomComplete}
              onBack={() => setStep('setup')}
              onRestart={handleRestart}
              projectName={project.projectName}
              propertyAge={project.propertyAge}
            />
          </motion.div>
        )}

        {step === 'report' && currentRoom && (
          <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ReportView 
              project={project} 
              room={currentRoom}
              onDesignAnother={handleDesignAnother}
              onRestart={handleRestart} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

