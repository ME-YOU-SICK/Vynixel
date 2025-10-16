
import React from 'react';
import { ActionType } from '../types';
import { RegenerateIcon } from './icons';

interface ActionMenuProps {
  actions: ActionType[];
  onSelect: (action: ActionType) => void;
  onClose: () => void;
  onRegenerate: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ actions, onSelect, onClose, onRegenerate }) => {
  return (
    <div className="absolute z-20 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
      <div className="p-2 max-h-60 overflow-y-auto">
        {actions.map((action) => (
          <button
            key={action}
            onClick={() => {
              if (action === ActionType.REGENERATE) {
                onRegenerate();
              } else {
                onSelect(action);
              }
              onClose();
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-200 rounded-md hover:bg-indigo-600 flex items-center space-x-2"
          >
            {action === ActionType.REGENERATE ? <RegenerateIcon className="w-4 h-4" /> : <span>➕</span>}
            <span>{action}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActionMenu;
