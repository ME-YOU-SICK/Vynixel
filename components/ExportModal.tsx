import React, { useMemo } from 'react';
import { ExportSection, NodeContent } from '../types';
import { CloseIcon } from './icons';
import SmallLoadingSpinner from './SmallLoadingSpinner';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: ExportSection[];
  setSections: React.Dispatch<React.SetStateAction<ExportSection[]>>;
  onExport: (sections: ExportSection[]) => void;
  onGenerateMissing: (section: ExportSection) => void;
  formatContent: (content: string | NodeContent) => string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, sections, setSections, onExport, onGenerateMissing, formatContent }) => {
  if (!isOpen) return null;

  const handleToggleSection = (id: string) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === id ? { ...section, enabled: !section.enabled } : section
      )
    );
  };

  const blueprintPreview = useMemo(() => {
    return sections
      .filter(s => s.enabled)
      .map(s => `## ${s.title}\n\n${formatContent(s.content)}`)
      .join('\n\n---\n');
  }, [sections, formatContent]);

  const renderStatusIcon = (section: ExportSection) => {
    switch (section.status) {
      case 'included':
        return <span title="Included" className="text-green-400">✅</span>;
      case 'missing':
        return <span title="Missing" className="text-yellow-400">⚠️</span>;
      case 'generated':
        return <span title="AI Generated" className="text-purple-400">✨</span>;
      case 'generating':
        return <SmallLoadingSpinner />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col text-white border border-gray-700">
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold">Export Your Blueprint</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex flex-grow min-h-0">
          {/* Left Panel: Sections */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col">
            <h3 className="p-4 text-lg font-semibold text-gray-300 border-b border-gray-700">Blueprint Sections</h3>
            <ul className="overflow-y-auto p-2 space-y-1">
              {sections.map(section => (
                <li key={section.id} className="p-2 rounded-md flex items-center justify-between hover:bg-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={() => handleToggleSection(section.id)}
                      disabled={section.status === 'missing' && !section.enabled}
                      className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor={`section-${section.id}`} className="flex items-center space-x-2 text-sm cursor-pointer">
                      {renderStatusIcon(section)}
                      <span className={section.enabled ? 'text-gray-100' : 'text-gray-500'}>{section.title}</span>
                    </label>
                  </div>
                  {section.status === 'missing' && (
                    <button
                      onClick={() => onGenerateMissing(section)}
                      className="px-2 py-1 text-xs font-semibold text-indigo-300 transition-colors bg-indigo-500 bg-opacity-10 rounded-md hover:bg-opacity-20"
                    >
                      Generate
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Panel: Preview */}
          <div className="w-2/3 flex flex-col">
             <h3 className="p-4 text-lg font-semibold text-gray-300 border-b border-gray-700">Live Preview</h3>
            <div className="overflow-y-auto p-4">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                <h1 className="text-2xl font-bold mb-4 pb-2 border-b border-gray-600">Vynixel Startup Blueprint</h1>
                {blueprintPreview}
              </pre>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end p-4 border-t border-gray-700 flex-shrink-0 space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 transition-colors bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => onExport(sections)}
            className="px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-500"
          >
            Download Blueprint
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ExportModal;
