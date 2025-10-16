import React from 'react';
import { ExportIcon } from './icons';

interface HeaderProps {
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ onExport }) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gray-900 bg-opacity-50 backdrop-blur-sm">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">
          V
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Vynixel</h1>
      </div>
      <button 
        onClick={onExport}
        className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-colors bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <ExportIcon className="w-4 h-4" />
        <span>Export Blueprint</span>
      </button>
    </header>
  );
};

export default Header;