import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { NodeData, Position, ActionType, NodeContent } from '../types';
import { PlusIcon } from './icons';
import ActionMenu from './ActionMenu';
import LoadingSpinner from './LoadingSpinner';
import { NODE_HEIGHT, NODE_SPACING, NODE_WIDTH } from '../constants';

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
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [editableContent, setEditableContent] = useState('');
  const [menu, setMenu] = useState<MenuState>({ visible: false, position: {x:0, y:0}, relativePosition: {x:0, y:0} });

  useLayoutEffect(() => {
    if (nodeRef.current && !isResizing) {
        const currentHeight = nodeRef.current.offsetHeight;
        if (data.height !== currentHeight) {
             onNodeSizeChange(data.id, { width: data.width, height: currentHeight });
        }
    }
  }, [data.content, data.width, isResizing, data.id, onNodeSizeChange]);

  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  useEffect(() => {
    if (data.isEditing) {
      let textContent = '';
      if (typeof data.content === 'string') {
        textContent = data.content;
      } else {
        textContent = data.content.map(item => {
          if (item.type === 'heading') return `**${item.content}**`;
          if (item.type === 'bullet') return `- ${item.content}`;
          return item.content;
        }).join('\n');
      }
      setEditableContent(textContent);
      // Defer focus and resize to next tick to ensure textarea is rendered
      setTimeout(() => {
        textareaRef.current?.focus();
        resizeTextarea();
      }, 0);
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menu.visible]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (data.isEditing || isResizing || (e.target as HTMLElement).closest('.node-content, .node-content-display, textarea, button, .resize-handle')) return;
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX - data.position.x, y: e.clientY - data.position.y };
    e.stopPropagation();
  };

  // FIX: Added useCallback to memoize the function and fix reference errors.
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      onMove(data.id, { x: e.clientX - dragStartPos.current.x, y: e.clientY - dragStartPos.current.y });
    }
  }, [isDragging, data.id, onMove]);

  // FIX: Added useCallback to memoize the function and fix reference errors.
  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };
  
  // FIX: Added useCallback to memoize the function and fix reference errors.
  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        onNodeSizeChange(data.id, { width: Math.max(NODE_WIDTH, data.width + dx), height: Math.max(NODE_HEIGHT, data.height + dy) });
    }
  }, [isResizing, data.id, data.width, data.height, onNodeSizeChange]);

  // FIX: Added useCallback to memoize the function and fix reference errors.
  const handleResizeMouseUp = useCallback(() => setIsResizing(false), []);

  useEffect(() => {
      if (isResizing) {
          window.addEventListener('mousemove', handleResizeMouseMove);
          window.addEventListener('mouseup', handleResizeMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleResizeMouseMove);
          window.removeEventListener('mouseup', handleResizeMouseUp);
      };
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);
  
  const handleContentBlur = () => onContentUpdate(data.id, editableContent);
  const handleContentClick = () => onEditingChange(data.id, true);

  const handleOpenMenu = (e: React.MouseEvent, pos: 'top' | 'right' | 'bottom' | 'left') => {
    e.stopPropagation();
    let menuPos: Position = {x:0, y:0};
    let relativeNodePos: Position = {x:0, y:0};
    const { width, height } = nodeRef.current!.getBoundingClientRect();
    
    const MENU_WIDTH = 256;
    const MENU_MAX_HEIGHT = 240;
    const MENU_MARGIN = 12;
    const PLUS_BUTTON_HALF_SIZE = 12;

    switch(pos) {
        case 'top': 
            menuPos = {x: width / 2 - MENU_WIDTH / 2, y: -PLUS_BUTTON_HALF_SIZE - MENU_MAX_HEIGHT - MENU_MARGIN };
            relativeNodePos = {x: 0, y: -(height + NODE_SPACING)};
            break;
        case 'right': 
            menuPos = {x: width + PLUS_BUTTON_HALF_SIZE + MENU_MARGIN, y: height / 2 - MENU_MAX_HEIGHT / 2 };
            relativeNodePos = {x: width + NODE_SPACING, y: 0};
            break;
        case 'bottom': 
            menuPos = {x: width / 2 - MENU_WIDTH / 2, y: height + PLUS_BUTTON_HALF_SIZE + MENU_MARGIN };
            relativeNodePos = {x: 0, y: height + NODE_SPACING};
            break;
        case 'left': 
            menuPos = {x: -MENU_WIDTH - PLUS_BUTTON_HALF_SIZE - MENU_MARGIN, y: height / 2 - MENU_MAX_HEIGHT / 2 };
            relativeNodePos = {x: -(data.width + NODE_SPACING), y: 0};
            break;
    }
    setMenu({ visible: true, position: menuPos, relativePosition: relativeNodePos });
  };
  
  const handleCloseMenu = () => setMenu({ ...menu, visible: false });
  
  const PlusButton: React.FC<{pos: 'top' | 'right' | 'bottom' | 'left'}> = ({pos}) => {
      const posClasses = { top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2', right: 'top-1/2 right-0 -translate-y-1/2 translate-x-1/2', bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2', left: 'top-1/2 left-0 -translate-y-1/2 -translate-x-1/2' };
      return <button onClick={(e) => handleOpenMenu(e, pos)} className={`absolute ${posClasses[pos]} z-10 flex items-center justify-center w-6 h-6 bg-indigo-500 rounded-full text-white transition-transform duration-200 transform hover:scale-125 hover:bg-indigo-400 opacity-0 group-hover:opacity-100`}><PlusIcon className="w-4 h-4"/></button>;
  };
  
  const renderContent = () => {
    if (typeof data.content === 'string') {
        return <div className="node-content-display text-sm text-gray-300 flex-grow overflow-y-auto cursor-text" onClick={handleContentClick} dangerouslySetInnerHTML={{ __html: data.content.replace(/\n/g, '<br/>') }} />;
    }
    return (
        <div className="node-content-display text-sm text-gray-300 flex-grow overflow-y-auto cursor-text space-y-2" onClick={handleContentClick}>
            {data.content.map((item, index) => {
                switch(item.type) {
                    case 'heading': return <h4 key={index} className="text-md font-bold text-gray-100">{item.content}</h4>;
                    case 'bullet': return <li key={index} className="ml-4 list-disc text-gray-300">{item.content}</li>;
                    case 'paragraph': return <p key={index} className="text-gray-300">{item.content}</p>;
                    default: return null;
                }
            })}
        </div>
    );
  };

  return (
    <div ref={nodeRef} className="absolute group" style={{ left: data.position.x, top: data.position.y, width: `${data.width}px`, height: `${data.height}px`, cursor: isDragging ? 'grabbing' : 'grab' }} onMouseDown={handleMouseDown}>
        <div className="relative w-full h-full p-4 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg flex flex-col transition-all duration-200 hover:border-indigo-500">
            <h3 className="text-lg font-bold text-gray-100 pb-2 border-b border-gray-600 mb-2 flex-shrink-0">{data.title}</h3>
            
            {data.isEditing ? (
                 <textarea ref={textareaRef} value={editableContent} onChange={(e) => setEditableContent(e.target.value)} onBlur={handleContentBlur} onInput={resizeTextarea} className="node-content text-sm text-gray-300 flex-grow bg-transparent w-full resize-none focus:outline-none" onClick={(e) => e.stopPropagation()} />
            ) : renderContent()}
            
            {data.isLoading && (<div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center rounded-lg"><LoadingSpinner /></div>)}
            <div onMouseDown={handleResizeMouseDown} className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity" style={{background: 'radial-gradient(circle at 100% 100%, transparent 50%, #fff 50%)'}}/>
        </div>

        {!data.isLoading && (<><PlusButton pos="top" /><PlusButton pos="right" /><PlusButton pos="bottom" /><PlusButton pos="left" /></>)}
        
        {menu.visible && (<div style={{ position: 'absolute', top: menu.position.y, left: menu.position.x, zIndex: 100 }} ><ActionMenu actions={data.availableActions} onSelect={(action) => onAddNode(data.id, action, menu.relativePosition)} onClose={handleCloseMenu} onRegenerate={() => onRegenerate(data.id)} /></div>)}
    </div>
  );
};

export default Node;