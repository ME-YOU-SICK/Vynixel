import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NodeData, Position, ActionType } from '../types';
import Node from './Node';

interface CanvasProps {
  nodes: Map<string, NodeData>;
  onNodeMove: (id: string, position: Position) => void;
  onNodeAdd: (parentId: string, action: ActionType, relativePosition: Position) => void;
  onNodeContentUpdate: (id: string, content: string) => void;
  onNodeEditingChange: (id: string, isEditing: boolean) => void;
  onNodeRegenerate: (nodeId: string) => void;
  onNodeSizeChange: (id: string, size: { width: number; height: number; }) => void;
}

const Canvas: React.FC<CanvasProps> = ({ nodes, onNodeMove, onNodeAdd, onNodeContentUpdate, onNodeEditingChange, onNodeRegenerate, onNodeSizeChange }) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef<Position>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.group')) return;
    setIsPanning(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.2, transform.scale + scaleAmount), 2);
    
    if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const newX = transform.x - mouseX * (newScale / transform.scale - 1);
        const newY = transform.y - mouseY * (newScale / transform.scale - 1);
        
        setTransform({ x: newX, y: newY, scale: newScale });
    }
  };

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);
  
  const getEdgePoint = (node: NodeData, parent: NodeData): Position => {
    const sourceX = parent.position.x + parent.width / 2;
    const sourceY = parent.position.y + parent.height / 2;
    const targetX = node.position.x + node.width / 2;
    const targetY = node.position.y + node.height / 2;

    const dx = targetX - sourceX;
    const dy = targetY - sourceY;

    if (Math.abs(dx) > Math.abs(dy)) {
        return {
            x: node.position.x + (dx > 0 ? 0 : node.width),
            y: node.position.y + node.height / 2
        };
    } else {
        return {
            x: node.position.x + node.width / 2,
            y: node.position.y + (dy > 0 ? 0 : node.height)
        };
    }
  }


  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-grid-pattern cursor-grab active:cursor-grabbing"
      style={{
        backgroundSize: `${30 * transform.scale}px ${30 * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
        '--grid-color': 'rgba(107, 114, 128, 0.2)',
      } as React.CSSProperties}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      <div
        className="transform-origin-top-left"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
      >
        <svg className="absolute top-0 left-0 w-full h-full" style={{ width: '100vw', height: '100vh', pointerEvents: 'none', transform: `scale(${1/transform.scale}) translate(${-transform.x}px, ${-transform.y}px)` }}>
            <g style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}>
              {Array.from(nodes.values()).map(node => {
                if (!node.parentId) return null;
                const parentNode = nodes.get(node.parentId);
                if (!parentNode) return null;

                const start = getEdgePoint(parentNode, node);
                const end = getEdgePoint(node, parentNode);
                
                const d = `M${start.x},${start.y} C${start.x + (end.x - start.x) / 2},${start.y} ${start.x + (end.x - start.x) / 2},${end.y} ${end.x},${end.y}`;

                return <path key={`${node.parentId}-${node.id}`} d={d} stroke="#4A5568" strokeWidth="2" fill="none" />;
              })}
            </g>
        </svg>

        {Array.from(nodes.values()).map(node => (
          <Node
            key={node.id}
            data={node}
            onMove={onNodeMove}
            onAddNode={onNodeAdd}
            onContentUpdate={onNodeContentUpdate}
            onEditingChange={onNodeEditingChange}
            onRegenerate={onNodeRegenerate}
            onNodeSizeChange={onNodeSizeChange}
          />
        ))}
      </div>
    </div>
  );
};

export default Canvas;