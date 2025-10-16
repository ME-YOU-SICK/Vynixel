import React from 'react';
import { useStore } from '../store';
import { ExportIcon, AnalyzeIcon } from './icons';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  const { openExportModal, analyzeBlueprint } = useStore(state => ({
    openExportModal: state.openExportModal,
    analyzeBlueprint: state.analyzeBlueprint,
  }));

  return (
    <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-2xl">
          V
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Vynixel</h1>
      </div>
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <button 
          onClick={analyzeBlueprint}
          className="flex items-center px-4 py-2 space-x-2 text-sm font-medium transition-colors border rounded-lg bg-secondary text-secondary-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <AnalyzeIcon className="w-4 h-4" />
          <span>Analyze</span>
        </button>
        <button 
          onClick={openExportModal}
          className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-primary-foreground transition-colors rounded-lg bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <ExportIcon className="w-4 h-4" />
          <span>Export Blueprint</span>
        </button>
      </div>
    </header>
  );
};

export default Header;