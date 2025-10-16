
import React, { useState, useRef, useEffect } from 'react';
import { NodeData, Position, ActionType } from '../types';
import { PlusIcon } from './icons';
import ActionMenu from './ActionMenu';
import LoadingSpinner from './LoadingSpinner';
import { NODE_WIDTH, NODE_HEIGHT, NODE_SPACING } from '../constants';

interface NodeProps {
  data: NodeData;
  onMove: (id: string, position: Position) => void;
  onAddNode: (parentId: string, action: ActionType, relativePosition: Position) => void;
  onContentUpdate: (id: string, content: string) => void;
  onEditingChange: (id: string, isEditing: boolean) => void;
  onRegenerate: (nodeId: string) => void;
}

type MenuState = {
  visible: boolean;
  position: Position;
  relativePosition: Position;
};

const Node: React.FC<NodeProps> = ({ data, onMove, onAddNode, onContentUpdate, onEditingChange, onRegenerate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [menu, setMenu] = useState<MenuState>({ visible: false, position: {x:0, y:0}, relativePosition: {x:0, y:0} });

  useEffect(() => {
    if (data.isEditing && contentRef.current) {
      contentRef.current.focus();
    }
  }, [data.isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if not editing content
    if (data.isEditing || (e.target as HTMLElement).closest('.node-content')) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, data.id, onMove]);
  
  const handleContentBlur = () => {
    if (contentRef.current) {
        onContentUpdate(data.id, contentRef.current.innerHTML);
    }
  };
  
  const handleContentClick = () => {
      onEditingChange(data.id, true);
  };

  const handleOpenMenu = (e: React.MouseEvent, pos: 'top' | 'right' | 'bottom' | 'left') => {
    e.stopPropagation();
    let menuPos: Position = {x:0, y:0};
    let relativeNodePos: Position = {x:0, y:0};

    switch(pos) {
        case 'top': 
            menuPos = {x: NODE_WIDTH / 2 - 128, y: -10}; 
            relativeNodePos = {x: 0, y: -(NODE_HEIGHT + NODE_SPACING)};
            break;
        case 'right': 
            menuPos = {x: NODE_WIDTH + 10, y: NODE_HEIGHT / 2 - 120};
            relativeNodePos = {x: NODE_WIDTH + NODE_SPACING, y: 0};
            break;
        case 'bottom': 
            menuPos = {x: NODE_WIDTH / 2 - 128, y: NODE_HEIGHT + 10};
            relativeNodePos = {x: 0, y: NODE_HEIGHT + NODE_SPACING};
            break;
        case 'left': 
            menuPos = {x: -266, y: NODE_HEIGHT / 2 - 120};
            relativeNodePos = {x: -(NODE_WIDTH + NODE_SPACING), y: 0};
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
        width: `${NODE_WIDTH}px`,
        minHeight: `${NODE_HEIGHT}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
        <div className="relative w-full h-full p-4 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg flex flex-col transition-all duration-200 hover:border-indigo-500">
            <h3 className="text-lg font-bold text-gray-100 pb-2 border-b border-gray-600 mb-2 flex-shrink-0">{data.title}</h3>
            <div
                ref={contentRef}
                className="node-content text-sm text-gray-300 flex-grow overflow-y-auto"
                style={{ maxHeight: '150px' }}
                contentEditable={data.isEditing}
                suppressContentEditableWarning={true}
                onClick={handleContentClick}
                onBlur={handleContentBlur}
                dangerouslySetInnerHTML={{ __html: data.content }}
            />
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
            <div style={{ position: 'absolute', top: menu.position.y, left: menu.position.x }} >
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
