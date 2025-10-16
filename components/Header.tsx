import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { ExportIcon, AnalyzeIcon, SettingsIcon, PlusIcon, TrashIcon } from './icons';
import ThemeToggle from './ThemeToggle';

const UserProfile: React.FC = () => {
  const { user, logout } = useStore(state => ({ user: state.user, logout: state.logout }));
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring focus:ring-offset-background">
        <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg py-1 z-20">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-semibold text-popover-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

const Header: React.FC = () => {
  const { openExportModal, analyzeBlueprint, openSettingsModal, model, apiKey, clearCanvas, initializeNodes, isAuthenticated, provider } = useStore(state => ({
    openExportModal: state.openExportModal,
    analyzeBlueprint: state.analyzeBlueprint,
    openSettingsModal: state.openSettingsModal,
    model: state.model,
    apiKey: state.apiKey,
    clearCanvas: state.clearCanvas,
    initializeNodes: state.initializeNodes,
    isAuthenticated: state.isAuthenticated,
    provider: state.provider,
  }));

  return (
    <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-2xl">
          V
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Vynixel</h1>
        {isAuthenticated && (
          <button
            onClick={() => { clearCanvas(); initializeNodes(); }}
            className="ml-2 w-9 h-9 flex items-center justify-center rounded-lg border bg-secondary text-secondary-foreground hover:bg-accent"
            title="New canvas"
            aria-label="New canvas"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <button
          onClick={openSettingsModal}
          className="flex items-center justify-center w-10 h-10 transition-colors border rounded-lg bg-secondary text-secondary-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Open settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
        {isAuthenticated && (
          <button
            onClick={() => { if (confirm('This will delete your entire canvas for this user. Continue?')) clearCanvas(); }}
            className="flex items-center justify-center w-10 h-10 transition-colors border rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Delete canvas"
            title="Delete entire canvas"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        )}
        {/* Expose provider, model and optional API key for runtime consumers */}
        <script dangerouslySetInnerHTML={{ __html: `window.__VYNIXEL_PROVIDER__ = ${JSON.stringify(provider)}; window.__VYNIXEL_MODEL__ = ${JSON.stringify(model)}; window.__VYNIXEL_API_KEY__ = ${apiKey ? JSON.stringify(apiKey) : 'undefined'};` }} />
        <button 
          onClick={analyzeBlueprint}
          className="items-center px-4 py-2 space-x-2 text-sm font-medium transition-colors border rounded-lg bg-secondary text-secondary-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring hidden md:flex"
        >
          <AnalyzeIcon className="w-4 h-4" />
          <span>Analyze</span>
        </button>
        <button 
          onClick={openExportModal}
          className="items-center px-4 py-2 space-x-2 text-sm font-medium text-primary-foreground transition-colors rounded-lg bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring hidden md:flex"
        >
          <ExportIcon className="w-4 h-4" />
          <span>Export Blueprint</span>
        </button>
        <div className="w-px h-8 bg-border mx-2 hidden md:block" />
        <UserProfile />
      </div>
    </header>
  );
};

export default Header;
