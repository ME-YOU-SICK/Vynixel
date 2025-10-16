
import React, { useState, useCallback } from 'react';
import { NodeData, Position, ActionType } from './types';
import { generateNodeContent } from './services/geminiService';
import Canvas from './components/Canvas';
import Header from './components/Header';
import { initialActions } from './constants';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Map<string, NodeData>>(() => {
    const initialNodeId = `node_${Date.now()}`;
    const initialNode: NodeData = {
      id: initialNodeId,
      title: 'Your Startup Idea',
      content: 'Describe your startup idea in a sentence or a short paragraph. For example: "A platform that uses AI to create personalized travel itineraries."',
      position: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 },
      parentId: null,
      isEditing: false,
      isLoading: false,
      availableActions: initialActions,
    };
    return new Map([[initialNodeId, initialNode]]);
  });

  const updateNodePosition = useCallback((id: string, newPosition: Position) => {
    setNodes(prevNodes => {
      const newNodes = new Map(prevNodes);
      const node = newNodes.get(id);
      if (node) {
        newNodes.set(id, { ...node, position: newPosition });
      }
      return newNodes;
    });
  }, []);

  const updateNodeContent = useCallback((id: string, content: string) => {
    setNodes(prevNodes => {
      const newNodes = new Map(prevNodes);
      const node = newNodes.get(id);
      if (node) {
        newNodes.set(id, { ...node, content, isEditing: false });
      }
      return newNodes;
    });
  }, []);

  const toggleNodeEditing = useCallback((id: string, isEditing: boolean) => {
    setNodes(prevNodes => {
      const newNodes = new Map(prevNodes);
      const node = newNodes.get(id);
      if (node) {
        newNodes.set(id, { ...node, isEditing });
      }
      return newNodes;
    });
  }, []);

  const addNode = useCallback(async (parentId: string, action: ActionType, relativePosition: Position) => {
    const parentNode = nodes.get(parentId);
    if (!parentNode) return;

    const newNodeId = `node_${Date.now()}`;
    const newNode: NodeData = {
      id: newNodeId,
      title: action,
      content: 'Generating content...',
      position: {
        x: parentNode.position.x + relativePosition.x,
        y: parentNode.position.y + relativePosition.y,
      },
      parentId: parentId,
      isEditing: false,
      isLoading: true,
      availableActions: initialActions.filter(a => a !== ActionType.REGENERATE),
    };

    setNodes(prevNodes => new Map(prevNodes).set(newNodeId, newNode));

    try {
      const content = await generateNodeContent(parentNode.content, action);
      setNodes(prevNodes => {
        const newNodes = new Map(prevNodes);
        const node = newNodes.get(newNodeId);
        if (node) {
          newNodes.set(newNodeId, { ...node, content, isLoading: false, availableActions: initialActions });
        }
        return newNodes;
      });
    } catch (error) {
      console.error('Failed to generate node content:', error);
      setNodes(prevNodes => {
        const newNodes = new Map(prevNodes);
        const node = newNodes.get(newNodeId);
        if (node) {
            newNodes.set(newNodeId, { ...node, content: 'Error generating content. Please try again.', isLoading: false });
        }
        return newNodes;
      });
    }
  }, [nodes]);
  
  const regenerateNode = useCallback(async (nodeId: string) => {
    const nodeToRegenerate = nodes.get(nodeId);
    if (!nodeToRegenerate || !nodeToRegenerate.parentId) return;
    
    const parentNode = nodes.get(nodeToRegenerate.parentId);
    if(!parentNode) return;

    setNodes(prevNodes => {
        const newNodes = new Map(prevNodes);
        const node = newNodes.get(nodeId);
        if(node) {
            newNodes.set(nodeId, {...node, isLoading: true, content: 'Regenerating content...'})
        }
        return newNodes;
    });

    try {
        const content = await generateNodeContent(parentNode.content, nodeToRegenerate.title as ActionType);
        setNodes(prevNodes => {
            const newNodes = new Map(prevNodes);
            const node = newNodes.get(nodeId);
            if(node) {
                newNodes.set(nodeId, {...node, content, isLoading: false});
            }
            return newNodes;
        })
    } catch (error) {
        console.error('Failed to regenerate node content:', error);
        setNodes(prevNodes => {
            const newNodes = new Map(prevNodes);
            const node = newNodes.get(nodeId);
            if(node) {
                newNodes.set(nodeId, {...node, content: 'Error regenerating content. Please try again.', isLoading: false});
            }
            return newNodes;
        })
    }
  }, [nodes]);

  return (
    <div className="w-screen h-screen overflow-hidden font-sans bg-gray-900">
      <Header />
      <Canvas
        nodes={nodes}
        onNodeMove={updateNodePosition}
        onNodeAdd={addNode}
        onNodeContentUpdate={updateNodeContent}
        onNodeEditingChange={toggleNodeEditing}
        onNodeRegenerate={regenerateNode}
      />
    </div>
  );
};

export default App;
