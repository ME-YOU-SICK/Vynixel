import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { NodeData, Position, ActionType, NodeContent, TableContent, QuizContent } from '../types';
import { PlusIcon } from './icons';
import ActionMenu from './ActionMenu';
import LoadingSpinner from './LoadingSpinner';
import { NODE_HEIGHT, NODE_SPACING, NODE_WIDTH } from '../constants';
import { useStore } from '../store';
import TableView from './TableView';
import QuizView from './QuizView';

interface NodeProps {
  data: NodeData;
}

type MenuState = {
  visible: boolean;
  position: Position;
};

const Node: React.FC<NodeProps> = ({ data }) => {
  const { 
      updateNodePosition, 
      addNode, 
      updateNodeContent, 
      toggleNodeEditing, 
      regenerateNode, 
      updateNodeSize,
      openCustomPromptModal
    } = useStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasLoading = useRef(data.isLoading);

  const [editableContent, setEditableContent] = useState('');
  const [displayedContent, setDisplayedContent] = useState<NodeContent | null>(null);
  const [menu, setMenu] = useState<MenuState & { relativePosition: Position }>({ visible: false, position: {x:0, y:0}, relativePosition: {x:0, y:0} });

  useEffect(() => {
    if (data.nodeType !== 'text') return;

    const justFinishedLoading = wasLoading.current && !data.isLoading;
    if (justFinishedLoading && data.nodeType === 'text') {
        if (typeof data.content === 'string') {
            setDisplayedContent([{ type: 'paragraph', content: data.content }]);
        } else if (Array.isArray(data.content)) {
            setDisplayedContent(data.content as NodeContent);
        } else if (data.content && typeof data.content === 'object') {
            setDisplayedContent([{ type: 'paragraph', content: JSON.stringify(data.content) }]);
        } else {
            setDisplayedContent([]);
        }
    } else if (!data.isLoading) {
        // If not loading (e.g., initial render of existing node), show full content immediately
        if (typeof data.content === 'string') {
            setDisplayedContent([{type: 'paragraph', content: data.content}]);
        } else if (data.nodeType === 'text') {
            // Ensure we only set arrays; gracefully handle unexpected objects
            const maybeArray = data.content as unknown;
            if (Array.isArray(maybeArray)) {
                setDisplayedContent(maybeArray as NodeContent);
            } else if (maybeArray && typeof maybeArray === 'object') {
                setDisplayedContent([{ type: 'paragraph', content: JSON.stringify(maybeArray) }]);
            } else {
                setDisplayedContent([]);
            }
        }
    }

    wasLoading.current = data.isLoading;
  }, [data.isLoading, data.content, data.nodeType]);


  useLayoutEffect(() => {
    if (cardRef.current && !isResizing && !data.isLoading) {
        const contentHeight = cardRef.current.scrollHeight;
        if (contentHeight > data.height) {
             updateNodeSize(data.id, { width: data.width, height: contentHeight });
        }
    }
  }, [data.content, data.width, isResizing, data.id, updateNodeSize, data.isLoading, displayedContent]);

  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  useEffect(() => {
    if (data.isEditing && data.nodeType === 'text') {
      let textContent = '';
      if (typeof data.content === 'string') {
        textContent = data.content;
      } else if (Array.isArray(data.content)) {
        textContent = (data.content as NodeContent).map(item => {
          if (item.type === 'heading') return `**${item.content}**`;
          if (item.type === 'bullet') return `- ${item.content}`;
          return item.content;
        }).join('\n');
      } else if (data.content && typeof data.content === 'object') {
        // Fallback for unexpected object content
        textContent = JSON.stringify(data.content);
      }
      setEditableContent(textContent);
      setTimeout(() => {
        textareaRef.current?.focus();
        resizeTextarea();
      }, 0);
    }
  }, [data.isEditing, data.content, data.nodeType]);
  
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
    if (data.isEditing || isResizing || (e.target as HTMLElement).closest('.node-content, .node-content-display, textarea, button, .resize-handle, table, input, label')) return;
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX - data.position.x, y: e.clientY - data.position.y };
    e.stopPropagation();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      updateNodePosition(data.id, { x: e.clientX - dragStartPos.current.x, y: e.clientY - dragStartPos.current.y });
    }
  }, [isDragging, data.id, updateNodePosition]);

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
  
  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        updateNodeSize(data.id, { width: Math.max(NODE_WIDTH, data.width + dx), height: Math.max(NODE_HEIGHT, data.height + dy) });
    }
  }, [isResizing, data.id, data.width, data.height, updateNodeSize]);

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
  
  const handleContentBlur = () => updateNodeContent(data.id, editableContent);
  const handleContentClick = () => {
    if (data.nodeType === 'text') {
        toggleNodeEditing(data.id, true);
    }
  };
  
  const handleActionSelect = (action: ActionType) => {
      if (action === ActionType.REGENERATE) {
          regenerateNode(data.id);
      } else if (action === ActionType.CUSTOM_PROMPT) {
          openCustomPromptModal(data.id, menu.relativePosition);
      } else {
          addNode(data.id, action, menu.relativePosition);
      }
  };

  const handleOpenMenu = (e: React.MouseEvent, pos: 'top' | 'right' | 'bottom' | 'left') => {
    e.stopPropagation();
    let menuPos: Position = {x:0, y:0};
    let relativeNodePos: Position = {x:0, y:0};
    const { height } = nodeRef.current!.getBoundingClientRect();
    
    const MENU_WIDTH = 256;
    const MENU_MAX_HEIGHT = 240;
    const MENU_MARGIN = 12;

    switch(pos) {
        case 'top': 
            menuPos = {x: data.width / 2 - MENU_WIDTH / 2, y: -MENU_MAX_HEIGHT - MENU_MARGIN };
            relativeNodePos = {x: 0, y: -(height + NODE_SPACING)};
            break;
        case 'right': 
            menuPos = {x: data.width + MENU_MARGIN, y: data.height / 2 - MENU_MAX_HEIGHT / 2 };
            relativeNodePos = {x: data.width + NODE_SPACING, y: 0};
            break;
        case 'bottom': 
            menuPos = {x: data.width / 2 - MENU_WIDTH / 2, y: data.height + MENU_MARGIN };
            relativeNodePos = {x: 0, y: data.height + NODE_SPACING};
            break;
        case 'left': 
            menuPos = {x: -MENU_WIDTH - MENU_MARGIN, y: data.height / 2 - MENU_MAX_HEIGHT / 2 };
            relativeNodePos = {x: -(data.width + NODE_SPACING), y: 0};
            break;
    }
    setMenu({ visible: true, position: menuPos, relativePosition: relativeNodePos });
  };
  
  const handleCloseMenu = () => setMenu({ ...menu, visible: false });
  
  const PlusButton: React.FC<{pos: 'top' | 'right' | 'bottom' | 'left'}> = ({pos}) => {
      const posClasses = { top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full', right: 'top-1/2 right-0 -translate-y-1/2 translate-x-full', bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full', left: 'top-1/2 left-0 -translate-y-1/2 -translate-x-full' };
      return <button onClick={(e) => handleOpenMenu(e, pos)} className={`absolute ${posClasses[pos]} z-10 flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full transition-all duration-200 transform hover:scale-110 opacity-0 group-hover:opacity-100`}><PlusIcon className="w-4 h-4"/></button>;
  };
  
  const renderContent = () => {
    if (data.isLoading) {
        return <div className="absolute inset-0 bg-card/75 flex items-center justify-center rounded-lg"><LoadingSpinner /></div>;
    }

    const contentWrapperClass = "node-content-display text-base text-card-foreground flex-grow overflow-y-auto no-scrollbar";

    switch (data.nodeType) {
        case 'table':
            return (
                <div className={`${contentWrapperClass} cursor-default`} onClick={(e) => e.stopPropagation()}>
                    <TableView content={data.content as TableContent} />
                </div>
            );
        case 'quiz':
            return (
                <div className={`${contentWrapperClass} cursor-default space-y-2`} onClick={(e) => e.stopPropagation()}>
                    <QuizView content={data.content as QuizContent} nodeId={data.id} answers={data.answers} />
                </div>
            );
        case 'text':
        default:
            const contentToRender = Array.isArray(displayedContent) ? displayedContent : [];
            return (
                <div className={`${contentWrapperClass} cursor-text space-y-2`} onClick={handleContentClick}>
                    {contentToRender.map((item, index) => {
                        switch(item.type) {
                            case 'heading': return <h4 key={index} className="text-md font-bold text-card-foreground">{item.content}</h4>;
                            case 'bullet': return <li key={index} className="ml-4 list-disc">{item.content}</li>;
                            case 'paragraph': return <p key={index}>{item.content}</p>;
                            default: return null;
                        }
                    })}
                </div>
            );
    }
  };

  return (
    <div ref={nodeRef} className="absolute group" style={{ left: data.position.x, top: data.position.y, width: `${data.width}px`, height: `${data.height}px`, cursor: isDragging ? 'grabbing' : 'grab' }} onMouseDown={handleMouseDown}>
        <div ref={cardRef} className="relative w-full h-full p-4 bg-card border-2 border-border rounded-lg shadow-lg flex flex-col glow-effect">
            <h3 className="text-lg font-bold text-card-foreground pb-2 border-b border-border mb-2 flex-shrink-0 flex items-center justify-between">
              <span>{data.title}</span>
              {data.title !== 'Your Startup Idea' && !data.isEditing && (
                <button onClick={(e) => { e.stopPropagation(); toggleNodeEditing(data.id, true); }} className="text-xs px-2 py-1 rounded-md border bg-secondary text-secondary-foreground hover:bg-accent">
                  Edit
                </button>
              )}
            </h3>
            
            {data.isEditing && data.nodeType === 'text' ? (
                 <textarea ref={textareaRef} value={editableContent} onChange={(e) => setEditableContent(e.target.value)} onBlur={handleContentBlur} onInput={resizeTextarea} className="node-content text-base text-card-foreground flex-grow bg-transparent w-full resize-none focus:outline-none" onClick={(e) => e.stopPropagation()} />
            ) : renderContent()}

            <div onMouseDown={handleResizeMouseDown} className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity" style={{background: 'radial-gradient(circle at 100% 100%, transparent 50%, hsl(var(--foreground)) 50%)'}}/>
        
            {!data.isLoading && (<><PlusButton pos="top" /><PlusButton pos="right" /><PlusButton pos="bottom" /><PlusButton pos="left" /></>)}
        </div>

        {menu.visible && (<div style={{ position: 'absolute', top: menu.position.y, left: menu.position.x, zIndex: 100 }} ><ActionMenu actions={data.availableActions} onSelect={handleActionSelect} onClose={handleCloseMenu} onRegenerate={() => {}} /></div>)}
    </div>
  );
};

export default Node;