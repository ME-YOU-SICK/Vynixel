import React, { useState } from 'react';
import { useStore } from '../store';
import { CloseIcon } from './icons';

const CustomPromptModal: React.FC = () => {
  const { closeCustomPromptModal, addCustomNode } = useStore();
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && prompt.trim()) {
      addCustomNode(title, prompt);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-lg flex flex-col text-card-foreground border border-border">
        <header className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Create Custom Node</h2>
          <button onClick={closeCustomPromptModal} className="p-1 rounded-full hover:bg-accent">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="node-title" className="block text-sm font-medium text-muted-foreground mb-1">Node Title</label>
              <input
                id="node-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Competitor Analysis"
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label htmlFor="node-prompt" className="block text-sm font-medium text-muted-foreground mb-1">Your Prompt</label>
              <textarea
                id="node-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder="e.g., Analyze the top 3 competitors for a personalized travel itinerary app. Focus on their pricing, key features, and user reviews."
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          <footer className="flex items-center justify-end p-4 border-t border-border space-x-4">
            <button
              type="button"
              onClick={closeCustomPromptModal}
              className="px-4 py-2 text-sm font-medium transition-colors bg-secondary text-secondary-foreground rounded-lg hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-primary-foreground transition-colors bg-primary rounded-lg hover:bg-primary/90"
            >
              Generate Node
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CustomPromptModal;