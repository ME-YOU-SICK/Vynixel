import React, { useEffect } from 'react';
import { useStore } from './store';
import Canvas from './components/Canvas';
import Header from './components/Header';
import ExportModal from './components/ExportModal';
import CustomPromptModal from './components/CustomPromptModal';

const App: React.FC = () => {
  const { 
    isExportModalOpen, 
    isCustomPromptModalOpen, 
    theme,
    initializeNodes
  } = useStore(state => ({
    isExportModalOpen: state.isExportModalOpen,
    isCustomPromptModalOpen: state.isCustomPromptModalOpen,
    theme: state.theme,
    initializeNodes: state.initializeNodes
  }));

  useEffect(() => {
    initializeNodes();
  }, [initializeNodes]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="w-screen h-screen overflow-hidden font-sans bg-background text-foreground">
      <Header />
      <Canvas />
      {isExportModalOpen && <ExportModal />}
      {isCustomPromptModalOpen && <CustomPromptModal />}
    </div>
  );
};

export default App;