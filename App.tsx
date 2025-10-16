import React, { useEffect } from 'react';
import { useStore } from './store';
import Canvas from './components/Canvas';
import Header from './components/Header';
import ExportModal from './components/ExportModal';
import CustomPromptModal from './components/CustomPromptModal';
import SettingsModal from './components/SettingsModal';
import LandingPage from './pages/LandingPage';

const EditorApp: React.FC = () => {
  const { 
    isExportModalOpen, 
    isCustomPromptModalOpen,
    isSettingsModalOpen, 
    initializeNodes
  } = useStore(state => ({
    isExportModalOpen: state.isExportModalOpen,
    isCustomPromptModalOpen: state.isCustomPromptModalOpen,
    isSettingsModalOpen: state.isSettingsModalOpen,
    initializeNodes: state.initializeNodes
  }));

  useEffect(() => {
    initializeNodes();
  }, [initializeNodes]);

  return (
    <>
      <Header />
      <Canvas />
      {isExportModalOpen && <ExportModal />}
      {isCustomPromptModalOpen && <CustomPromptModal />}
      {isSettingsModalOpen && <SettingsModal />}
    </>
  );
}


const App: React.FC = () => {
  const { isAuthenticated, theme } = useStore(state => ({
    isAuthenticated: state.isAuthenticated,
    theme: state.theme,
  }));

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
      {isAuthenticated ? <EditorApp /> : <LandingPage />}
    </div>
  );
};

export default App;