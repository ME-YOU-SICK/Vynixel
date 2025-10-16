import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { NodeData, Position } from '../types';
import Node from './Node';
import { useStore } from '../store';
import MiniMap from './MiniMap';

const Canvas: React.FC = () => {
  const { nodes } = useStore(state => ({ nodes: state.nodes }));
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isZoomingWithKey, setIsZoomingWithKey] = useState(false);
  const lastMousePos = useRef<Position>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.group, .minimap')) return;
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

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (isZoomingWithKey) {
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
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'z') setIsZoomingWithKey(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'z') setIsZoomingWithKey(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseUp);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  const getEdgePoint = (sourceNode: NodeData, targetNode: NodeData): Position => {
    const s = { x: sourceNode.position.x, y: sourceNode.position.y, w: sourceNode.width, h: sourceNode.height };
    const t = { x: targetNode.position.x, y: targetNode.position.y, w: targetNode.width, h: targetNode.height };
    const sCenter = { x: s.x + s.w / 2, y: s.y + s.h / 2 };
    const tCenter = { x: t.x + t.w / 2, y: t.y + t.h / 2 };
    const dx = tCenter.x - sCenter.x;
    const dy = tCenter.y - sCenter.y;
    if (dx === 0 && dy === 0) return { x: sCenter.x, y: sCenter.y };
    const sRatio = s.h / s.w;
    const angleRatio = Math.abs(dy / dx);
    let x, y;
    if (angleRatio < sRatio) {
        x = dx > 0 ? s.x + s.w : s.x;
        y = sCenter.y + (x - sCenter.x) * (dy/dx);
    } else {
        y = dy > 0 ? s.y + s.h : s.y;
        x = sCenter.x + (y - sCenter.y) * (dx/dy);
    }
    return { x, y };
  }
  
  const visibleNodes = useMemo(() => {
    const nodesArray = Array.from(nodes.values());
    if (nodesArray.length < 20) return nodesArray; // No virtualization for small graphs
    
    const viewRect = {
        x: -transform.x / transform.scale,
        y: -transform.y / transform.scale,
        width: viewport.width / transform.scale,
        height: viewport.height / transform.scale
    };

    const buffer = 200; // Render nodes slightly outside the viewport

    return nodesArray.filter(node => {
        return (
            node.position.x < viewRect.x + viewRect.width + buffer &&
            node.position.x + node.width > viewRect.x - buffer &&
            node.position.y < viewRect.y + viewRect.height + buffer &&
            node.position.y + node.height > viewRect.y - buffer
        );
    });
  }, [nodes, transform, viewport]);

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-background cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: 'radial-gradient(hsl(var(--border)) 1px, transparent 0)',
        backgroundSize: `${30 * transform.scale}px ${30 * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      }}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      <div
        className="relative w-full h-full"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
      >
        <svg className="absolute top-0 left-0" style={{ width: '1px', height: '1px', overflow: 'visible', pointerEvents: 'none' }}>
              {Array.from(nodes.values()).map(node => {
                if (!node.parentId) return null;
                const parentNode = nodes.get(node.parentId);
                if (!parentNode) return null;

                const start = getEdgePoint(parentNode, node);
                const end = getEdgePoint(node, parentNode);
                
                const d = `M${start.x},${start.y} C${start.x + (end.x - start.x) / 2},${start.y} ${start.x + (end.x - start.x) / 2},${end.y} ${end.x},${end.y}`;

                return <path key={`${node.parentId}-${node.id}`} d={d} stroke="hsl(var(--border))" strokeWidth="2" fill="none" />;
              })}
        </svg>

        {visibleNodes.map(node => <Node key={node.id} data={node} />)}
      </div>
      <MiniMap nodes={nodes} transform={transform} viewport={viewport} setTransform={setTransform} />
    </div>
  );
};

export default Canvas;