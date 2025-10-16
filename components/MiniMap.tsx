import React, { useMemo, useRef, useEffect, useState } from 'react';
import { NodeData, Position } from '../types';

interface MiniMapProps {
  nodes: Map<string, NodeData>;
  transform: { x: number; y: number; scale: number };
  viewport: { width: number; height: number };
  setTransform: (t: { x: number; y: number; scale: number }) => void;
}

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;
const PADDING = 20;

const MiniMap: React.FC<MiniMapProps> = ({ nodes, transform, viewport, setTransform }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const bounds = useMemo(() => {
    const nodesArray = Array.from(nodes.values());
    if (nodesArray.length === 0) {
      return { minX: 0, minY: 0, maxX: viewport.width, maxY: viewport.height, width: viewport.width, height: viewport.height };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodesArray.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.width);
      maxY = Math.max(maxY, node.position.y + node.height);
    });
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }, [nodes, viewport]);

  const scale = useMemo(() => {
    const scaleX = (MINIMAP_WIDTH - PADDING * 2) / bounds.width;
    const scaleY = (MINIMAP_HEIGHT - PADDING * 2) / bounds.height;
    return Math.min(scaleX, scaleY);
  }, [bounds]);

  const handlePan = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newCenterX = (x - PADDING) / scale + bounds.minX;
      const newCenterY = (y - PADDING) / scale + bounds.minY;

      setTransform({
          ...transform,
          x: -newCenterX * transform.scale + viewport.width / 2,
          y: -newCenterY * transform.scale + viewport.height / 2,
      });
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
      handlePan(e);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging) {
          handlePan(e);
      }
  };
  const handleMouseUp = () => setIsDragging(false);

  if (nodes.size === 0) return null;

  return (
    <div
      ref={mapRef}
      className="minimap absolute bottom-4 right-4 bg-card/80 border border-border rounded-lg shadow-lg backdrop-blur-sm cursor-crosshair"
      style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT}>
        <g transform={`translate(${PADDING}, ${PADDING}) scale(${scale}) translate(${-bounds.minX}, ${-bounds.minY})`}>
          {Array.from(nodes.values()).map(node => (
            <rect
              key={node.id}
              x={node.position.x}
              y={node.position.y}
              width={node.width}
              height={node.height}
              className={`fill-muted-foreground/50 ${!node.parentId ? 'stroke-primary' : 'stroke-border'}`}
              strokeWidth={10 / scale}
            />
          ))}
          <rect
            x={(-transform.x / transform.scale)}
            y={(-transform.y / transform.scale)}
            width={viewport.width / transform.scale}
            height={viewport.height / transform.scale}
            className="fill-primary/20 stroke-primary"
            strokeWidth={2 / scale}
          />
        </g>
      </svg>
    </div>
  );
};

export default MiniMap;