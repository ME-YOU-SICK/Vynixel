import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { NodeData, Position, ActionType } from '../types';
import { PlusIcon } from './icons';
import ActionMenu from './ActionMenu';
import LoadingSpinner from './LoadingSpinner';
import { NODE_HEIGHT, NODE_SPACING } from '../constants';

interface NodeProps {
  data: NodeData;
  onMove: (id: string, position: Position) => void;
  onAddNode: (parentId: string, action: ActionType, relativePosition: Position) => void;
  onContentUpdate: (id: string, content: string) => void;
  onEditingChange: (id: string, isEditing: boolean) => void;
  onRegenerate: (nodeId: string) => void;
  onNodeSizeChange: (id: string, size: { width: number; height: number; }) => void;
}

type MenuState = {
  visible: boolean;
  position: Position;
  relativePosition: Position;
};

const Node: React.FC<NodeProps> = ({ data, onMove, onAddNode, onContentUpdate, onEditingChange, onRegenerate, onNodeSizeChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [editableContent, setEditableContent] = useState('');
  const [menu, setMenu] = useState<MenuState>({ visible: false, position: {x:0, y:0}, relativePosition: {x:0, y:0} });

  // Stable size measurement: Let the component render and measure its actual height.
  useLayoutEffect(() => {
    if (nodeRef.current) {
        const newHeight = nodeRef.current.offsetHeight;
        if (data.height !== newHeight) {
            onNodeSizeChange(data.id, { width: data.width, height: newHeight });
        }
    }
  }, [data.content, data.width, data.height, onNodeSizeChange, data.id]);


  useEffect(() => {
    if (data.isEditing) {
      const textContent = data.content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<strong>/gi, '')
        .replace(/<\/strong>/gi, '');
      setEditableContent(textContent);
      textareaRef.current?.focus();
    }
  }, [data.isEditing, data.content]);
  
  useEffect(() => {
    if (!menu.visible) return;
    const handleClickOutside = (event: MouseEvent) => {
        if (nodeRef.current && !nodeRef.current.contains(event.target as Node)) {
            handleCloseMenu();
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menu.visible]);


  const handleMouseDown = (e: React.MouseEvent) => {
    if (data.isEditing || (e.target as HTMLElement).closest('.node-content-display') || (e.target as HTMLElement).closest('textarea') || (e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - data.position.x,
      y: e.clientY - data.position.y,
    };
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      onMove(data.id, {
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, data.id, onMove]);
  
  const handleContentBlur = () => {
    const newHtmlContent = editableContent.replace(/\n/g, '<br />');
    onContentUpdate(data.id, newHtmlContent);
  };
  
  const handleContentClick = () => {
      onEditingChange(data.id, true);
  };

  const handleOpenMenu = (e: React.MouseEvent, pos: 'top' | 'right' | 'bottom' | 'left') => {
    e.stopPropagation();
    let menuPos: Position = {x:0, y:0};
    let relativeNodePos: Position = {x:0, y:0};
    
    const MENU_WIDTH = 256;
    const MENU_MAX_HEIGHT = 240;
    const MENU_MARGIN = 12;
    const PLUS_BUTTON_HALF_SIZE = 12;

    const nodeWidth = data.width;
    const nodeHeight = data.height;

    switch(pos) {
        case 'top': 
            menuPos = {x: nodeWidth / 2 - MENU_WIDTH / 2, y: -PLUS_BUTTON_HALF_SIZE - MENU_MAX_HEIGHT - MENU_MARGIN };
            relativeNodePos = {x: 0, y: -(nodeHeight + NODE_SPACING)};
            break;
        case 'right': 
            menuPos = {x: nodeWidth + PLUS_BUTTON_HALF_SIZE + MENU_MARGIN, y: nodeHeight / 2 - MENU_MAX_HEIGHT / 2 };
            relativeNodePos = {x: nodeWidth + NODE_SPACING, y: 0};
            break;
        case 'bottom': 
            menuPos = {x: nodeWidth / 2 - MENU_WIDTH / 2, y: nodeHeight + PLUS_BUTTON_HALF_SIZE + MENU_MARGIN };
            relativeNodePos = {x: 0, y: nodeHeight + NODE_SPACING};
            break;
        case 'left': 
            menuPos = {x: -MENU_WIDTH - PLUS_BUTTON_HALF_SIZE - MENU_MARGIN, y: nodeHeight / 2 - MENU_MAX_HEIGHT / 2 };
            relativeNodePos = {x: -(nodeWidth + NODE_SPACING), y: 0};
            break;
    }
    setMenu({ visible: true, position: menuPos, relativePosition: relativeNodePos });
  };
  
  const handleCloseMenu = () => {
      setMenu({ ...menu, visible: false });
  };
  
  const PlusButton: React.FC<{pos: 'top' | 'right' | 'bottom' | 'left'}> = ({pos}) => {
      const posClasses = {
          top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
          right: 'top-1/2 right-0 -translate-y-1/2 translate-x-1/2',
          bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
          left: 'top-1/2 left-0 -translate-y-1/2 -translate-x-1/2',
      };
      return (
        <button 
            onClick={(e) => handleOpenMenu(e, pos)}
            className={`absolute ${posClasses[pos]} z-10 flex items-center justify-center w-6 h-6 bg-indigo-500 rounded-full text-white transition-transform duration-200 transform hover:scale-125 hover:bg-indigo-400 opacity-0 group-hover:opacity-100`}>
            <PlusIcon className="w-4 h-4"/>
        </button>
      )
  };

  return (
    <div
      ref={nodeRef}
      className="absolute group"
      style={{
        left: data.position.x,
        top: data.position.y,
        width: `${data.width}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
        <div 
          className="relative w-full p-4 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg flex flex-col transition-all duration-200 hover:border-indigo-500"
          style={{ minHeight: `${NODE_HEIGHT}px`}}
        >
            <h3 className="text-lg font-bold text-gray-100 pb-2 border-b border-gray-600 mb-2 flex-shrink-0">{data.title}</h3>
            
            {data.isEditing ? (
                 <textarea
                    ref={textareaRef}
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    onBlur={handleContentBlur}
                    className="node-content text-sm text-gray-300 flex-grow bg-transparent w-full resize-none focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <div
                    className="node-content-display text-sm text-gray-300 flex-grow overflow-y-auto cursor-text"
                    onClick={handleContentClick}
                    dangerouslySetInnerHTML={{ __html: data.content }}
                />
            )}
            
            {data.isLoading && (
              <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center rounded-lg">
                <LoadingSpinner />
              </div>
            )}
        </div>

        {!data.isLoading && (
            <>
                <PlusButton pos="top" />
                <PlusButton pos="right" />
                <PlusButton pos="bottom" />
                <PlusButton pos="left" />
            </>
        )}
        
        {menu.visible && (
            <div style={{ position: 'absolute', top: menu.position.y, left: menu.position.x, zIndex: 100 }} >
                <ActionMenu 
                    actions={data.availableActions}
                    onSelect={(action) => onAddNode(data.id, action, menu.relativePosition)}
                    onClose={handleCloseMenu}
                    onRegenerate={() => onRegenerate(data.id)}
                />
            </div>
        )}
    </div>
  );
};

export default Node;