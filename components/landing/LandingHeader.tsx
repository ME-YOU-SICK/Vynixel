import React from 'react';
import { useStore } from '../../store';
import ThemeToggle from '../ThemeToggle';

const LandingHeader: React.FC = () => {
  const { login } = useStore();

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 md:px-8">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-2xl">
          V
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Vynixel</h1>
      </div>
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <button
          onClick={login}
          className="px-4 py-2 text-sm font-medium transition-colors border rounded-lg bg-secondary text-secondary-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Sign In
        </button>
      </div>
    </header>
  );
};

export default LandingHeader;
