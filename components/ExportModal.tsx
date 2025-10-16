import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { ExportSection, NodeContent, QuizContent, TableContent } from '../types';
import { CloseIcon } from './icons';
import SmallLoadingSpinner from './SmallLoadingSpinner';
import { useStore } from '../store';

const printStyles = `
  body.light-print, body.dark-print {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --border: 240 5.9% 90%;
    --muted-foreground: 240 3.8% 46.1%;
  }
  
  .export-preview {
      font-family: Inter, system-ui, sans-serif;
  }
  .export-preview h1, .export-preview h2, .export-preview h3, .export-preview h4 { color: hsl(var(--foreground)); }
  .export-preview p, .export-preview li, .export-preview td, .export-preview th { color: hsl(var(--muted-foreground)); }
  .export-preview table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; }
  .export-preview th, .export-preview td { border: 1px solid hsl(var(--border)); padding: 8px; text-align: left; }
  .export-preview th { font-weight: 600; }
  .export-preview tr { break-inside: avoid; }
  .export-preview .blueprint-section { break-inside: avoid-page; page-break-before: auto; }
  .export-preview .quiz-question { break-inside: avoid; padding: 8px; border-radius: 4px; border: 1px solid hsl(var(--border)); margin-top: 8px;}
  .export-preview .short-answer-box {
    border: 1px solid hsl(var(--border));
    padding: 8px;
    margin-top: 4px;
    min-height: 24px;
    border-radius: 4px;
    color: hsl(var(--foreground));
    font-style: normal;
  }
  .export-preview .short-answer-box em {
    color: hsl(var(--muted-foreground));
    font-style: italic;
  }
`;

const formatContentForPreview = (section: ExportSection): string => {
    const { content, nodeType, answers = {} } = section;
    if (typeof content === 'string') return content.replace(/\n/g, '<br/>');
    
    switch(nodeType) {
        case 'table':
            const table = content as TableContent;
            if (!table || !table.headers || !table.rows) return '<p>Invalid table data</p>';
            let tableHtml = '<table class="w-full my-2 border-collapse text-sm"><thead><tr class="border-b-2 border-border">';
            table.headers.forEach(h => tableHtml += `<th class="p-2 text-left font-semibold">${h}</th>`);
            tableHtml += '</tr></thead><tbody>';
            table.rows.forEach(row => {
                tableHtml += '<tr class="border-b border-border/50">';
                row.forEach(cell => tableHtml += `<td class="p-2">${cell}</td>`);
                tableHtml += '</tr>';
            });
            tableHtml += '</tbody></table>';
            return tableHtml;
        case 'quiz':
            const quiz = content as QuizContent;
            if (!quiz || !Array.isArray(quiz)) return '<p>Invalid quiz data</p>';
            return quiz.map((q, i) => {
                let text = `<div class="quiz-question"><p class="font-semibold mb-2">${i + 1}. ${q.question}</p>`;
                if (q.type === 'short-answer') {
                    text += `<div class="short-answer-box">${answers[i] || '<em>No answer provided.</em>'}</div>`;
                }
                if (q.type === 'multiple-choice' && q.options) {
                    text += '<ul class="list-none pl-4 mt-1 space-y-1">';
                    q.options.forEach(opt => {
                        const isChecked = answers[i] === opt;
                        text += `<li class="py-0.5">${isChecked ? '<strong>&#9679; ' : '&#9675; '}${opt}${isChecked ? '</strong>' : ''}</li>`;
                    });
                    text += '</ul>';
                }
                text += '</div>';
                return text;
            }).join('');
        case 'text':
        default:
            const textContent = content as NodeContent;
            if (!textContent || !Array.isArray(textContent)) return '';
            return textContent.map(item => {
                switch(item.type) {
                    case 'heading': return `<h3 class="text-lg font-semibold mt-4 text-foreground">${item.content}</h3>`;
                    case 'bullet': return `<li class="ml-5 list-disc">${item.content}</li>`;
                    case 'paragraph': return `<p class="my-2">${item.content}</p>`;
                    default: return '';
                }
            }).join('');
    }
};

const ExportModal: React.FC = () => {
  const { 
    exportSections: sections,
    setExportSections: setSections,
    closeExportModal,
    generateMissingSection,
    theme
   } = useStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleToggleSection = (id: string) => {
    const newSections = sections.map(section =>
        section.id === id ? { ...section, enabled: !section.enabled } : section
    );
    setSections(newSections);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;
      
      const newSections = [...sections];
      const draggedItem = newSections.splice(draggedIndex, 1)[0];
      newSections.splice(index, 0, draggedItem);
      
      setDraggedIndex(index);
      setSections(newSections);
  };

  const handleDragEnd = () => setDraggedIndex(null);

  const handleExport = async () => {
    const element = previewRef.current;
    if (!element) return;
    setIsExporting(true);

    const originalBodyClass = document.body.className;
    document.body.className = theme === 'dark' ? 'dark-print' : 'light-print';
    
    const pdf = new jsPDF('p', 'pt', 'a4');

    await pdf.html(element, {
        callback: (doc) => {
            doc.save('Vynixel-Blueprint.pdf');
            document.body.className = originalBodyClass;
            setIsExporting(false);
            closeExportModal();
        },
        margin: [40, 40, 40, 40],
        autoPaging: 'text',
        html2canvas: {
            scale: 0.75,
            useCORS: true,
            backgroundColor: theme === 'dark' ? '#ffffff' : '#ffffff', // Always use white background for PDF
        },
        width: 595 - 80, // A4 width in points minus margins
        windowWidth: 1024,
    });
  };

  const renderStatusIcon = (section: ExportSection) => {
    switch (section.status) {
      case 'included': return <span title="Included from canvas" className="text-green-500">✓</span>;
      case 'missing': return <span title="Missing from canvas" className="text-yellow-500">!</span>;
      case 'generated': return <span title="AI Generated" className="text-purple-500">✨</span>;
      case 'generating': return <SmallLoadingSpinner />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <style>{printStyles}</style>
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col text-card-foreground border border-border">
        <header className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-2xl font-bold">Export Your Blueprint</h2>
          <button onClick={closeExportModal} className="p-1 rounded-full hover:bg-accent"><CloseIcon className="w-6 h-6" /></button>
        </header>

        <div className="flex flex-grow min-h-0">
          <div className="w-1/3 border-r border-border flex flex-col">
            <h3 className="p-4 text-lg font-semibold text-muted-foreground border-b border-border">Blueprint Sections</h3>
            <ul className="overflow-y-auto p-2 space-y-1">
              {sections.map((section, index) => (
                <li key={section.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd} className={`p-2 rounded-md flex items-center justify-between hover:bg-accent/50 transition-all ${draggedIndex === index ? 'opacity-50' : ''}`}>
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" checked={section.enabled} onChange={() => handleToggleSection(section.id)} disabled={section.status === 'missing' && !section.enabled} className="w-4 h-4 text-primary bg-secondary border-border rounded focus:ring-ring" />
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                      {renderStatusIcon(section)}
                      <span className={section.enabled ? 'text-foreground' : 'text-muted-foreground'}>{section.title}</span>
                    </label>
                  </div>
                  {section.status === 'missing' && <button onClick={() => generateMissingSection(section)} className="px-2 py-1 text-xs font-semibold text-primary transition-colors bg-primary/10 rounded-md hover:bg-primary/20">Generate</button>}
                </li>
              ))}
            </ul>
          </div>

          <div className="w-2/3 flex flex-col bg-background">
             <h3 className="p-4 text-lg font-semibold text-muted-foreground border-b border-border">Live PDF Preview</h3>
            <div className="overflow-y-auto p-4 flex-grow">
                <div ref={previewRef} className="export-preview p-6" style={{ backgroundColor: 'hsl(var(--background))'}}>
                  <h1 className="text-3xl font-bold mb-6 pb-2 border-b border-border">Vynixel Startup Blueprint</h1>
                  {sections.filter(s => s.enabled).map(s => (
                    <div key={s.id} className="blueprint-section mb-6">
                        <h2 className="text-2xl font-bold mb-2 pb-1 border-b border-border/50">{s.title}</h2>
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatContentForPreview(s) }} />
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end p-4 border-t border-border flex-shrink-0 space-x-4">
          <button onClick={closeExportModal} className="px-4 py-2 text-sm font-medium transition-colors bg-secondary text-secondary-foreground rounded-lg hover:bg-accent" disabled={isExporting}>Cancel</button>
          <button onClick={handleExport} className="px-4 py-2 text-sm font-medium text-primary-foreground transition-colors bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50" disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Download PDF'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ExportModal;