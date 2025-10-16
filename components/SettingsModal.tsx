import React from 'react';
import { useStore } from '../store';
import { CloseIcon } from './icons';
import { AIProvider } from '../types';

const providerDisplayNames: Record<AIProvider, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  claude: 'Anthropic (Claude)',
  mistral: 'Mistral',
  deepseek: 'Deepseek',
  openrouter: 'OpenRouter'
};


const SettingsModal: React.FC = () => {
  const { closeSettingsModal, provider, setProvider, model, setModel, apiKey, setApiKey } = useStore(state => ({
    closeSettingsModal: state.closeSettingsModal,
    provider: state.provider,
    setProvider: state.setProvider,
    model: state.model,
    setModel: state.setModel,
    apiKey: state.apiKey,
    setApiKey: state.setApiKey
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-md flex flex-col text-card-foreground border border-border">
        <header className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={closeSettingsModal} className="p-1 rounded-full hover:bg-accent">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">API Configuration</h3>
            <label htmlFor="api-key" className="block text-sm font-medium text-muted-foreground mb-1">API Key</label>
            <input
              id="api-key"
              type="password"
              placeholder={`Using ${provider} key from environment if left blank`}
              className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              value={apiKey || ''}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Stored locally per user; clear it to fallback to environment key.
            </p>
          </div>

          <div>
            <label htmlFor="ai-provider" className="block text-sm font-medium text-muted-foreground mb-1">AI Provider</label>
            <select
              id="ai-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProvider)}
              className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Object.entries(providerDisplayNames).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-muted-foreground mb-1">Model</label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring mb-2"
            >
              {provider === 'gemini' && (
                <>
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                </>
              )}
              {provider !== 'gemini' && (
                <option value={model}>{model}</option>
              )}
              <option value="__custom__">Custom...</option>
            </select>
            {model === '__custom__' && (
              <input
                type="text"
                placeholder="Enter custom model name (e.g., gemini-2.0-pro)"
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                onBlur={(e) => setModel(e.target.value || 'gemini-2.5-flash')}
                autoFocus
              />
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Changing the model updates generation immediately for new content.
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-end p-4 border-t border-border space-x-4">
          <button
            type="button"
            onClick={closeSettingsModal}
            className="px-4 py-2 text-sm font-medium text-primary-foreground transition-colors bg-primary rounded-lg hover:bg-primary/90"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;