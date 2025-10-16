import React, { useState, useCallback } from 'react';
import { NodeData, Position, ActionType, NodeContent, ExportSection } from './types';
import { generateNodeContent, generateMissingDocument } from './services/geminiService';
import Canvas from './components/Canvas';
import Header from './components/Header';
import ExportModal from './components/ExportModal';
import { initialActions, NODE_WIDTH, NODE_HEIGHT } from './constants';

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
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
    return new Map([[initialNodeId, initialNode]]);
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSections, setExportSections] = useState<ExportSection[]>([]);

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
        const structuredContent: NodeContent = content.split('\n')
          .filter(line => line.trim() !== '')
          .map(line => ({ type: 'bullet', content: line.replace(/^- /, '') }));

        newNodes.set(id, { ...node, content: structuredContent.length > 0 ? structuredContent : content, isEditing: false });
      }
      return newNodes;
    });
  }, []);

  const updateNodeSize = useCallback((id: string, size: { width: number, height: number }) => {
    setNodes(prevNodes => {
        const newNodes = new Map(prevNodes);
        const node = newNodes.get(id);
        if (node && (node.width !== size.width || node.height !== size.height)) {
            newNodes.set(id, { ...node, width: size.width, height: size.height });
            return newNodes;
        }
        return prevNodes;
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
    
    const parentContentString = typeof parentNode.content === 'string' 
        ? parentNode.content 
        : parentNode.content.map(item => item.content).join('\n');

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
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };

    setNodes(prevNodes => new Map(prevNodes).set(newNodeId, newNode));

    try {
      const content = await generateNodeContent(parentContentString, action);
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
            const errorContent: NodeContent = [{ type: 'heading', content: 'Error'}, { type: 'paragraph', content: 'Failed to generate content. Please try again.' }];
            newNodes.set(newNodeId, { ...node, content: errorContent, isLoading: false });
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

    const parentContentString = typeof parentNode.content === 'string' 
        ? parentNode.content 
        : parentNode.content.map(item => item.content).join('\n');

    setNodes(prevNodes => {
        const newNodes = new Map(prevNodes);
        const node = newNodes.get(nodeId);
        if(node) {
            newNodes.set(nodeId, {...node, isLoading: true, content: 'Regenerating content...'})
        }
        return newNodes;
    });

    try {
        const content = await generateNodeContent(parentContentString, nodeToRegenerate.title as ActionType);
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
                const errorContent: NodeContent = [{ type: 'heading', content: 'Error'}, { type: 'paragraph', content: 'Failed to regenerate content. Please try again.' }];
                newNodes.set(nodeId, {...node, content: errorContent, isLoading: false});
            }
            return newNodes;
        })
    }
  }, [nodes]);
  
  const formatNodeContentForExport = (content: string | NodeContent): string => {
    if (typeof content === 'string') {
        return content;
    }
    return content.map(item => {
        switch(item.type) {
            case 'heading': return `### ${item.content}\n`;
            case 'bullet': return `* ${item.content}`;
            case 'paragraph': return `${item.content}\n`;
            default: return '';
        }
    }).join('\n');
  };

  const handleOpenExportModal = useCallback(() => {
    const rootNode = Array.from(nodes.values()).find(n => n.parentId === null);
    if (!rootNode) {
      alert("No root node found to start export.");
      return;
    }

    const allPossibleActions = initialActions.filter(a => a !== ActionType.REGENERATE);
    
    const sections: ExportSection[] = allPossibleActions.map((actionTitle, index) => {
      const node = Array.from(nodes.values()).find(n => n.title === actionTitle);
      if (node) {
        return { id: node.id, title: actionTitle, content: node.content, status: 'included', enabled: true };
      } else {
        return { id: `missing-${index}`, title: actionTitle, content: '', status: 'missing', enabled: false };
      }
    });

    sections.unshift({
      id: rootNode.id,
      title: rootNode.title,
      content: rootNode.content,
      status: 'included',
      enabled: true,
    });

    setExportSections(sections);
    setIsExportModalOpen(true);
  }, [nodes]);

  const handleGenerateMissingSection = useCallback(async (sectionToGenerate: ExportSection) => {
    const context = exportSections
      .filter(s => s.enabled && s.status !== 'missing')
      .map(s => `## ${s.title}\n\n${formatNodeContentForExport(s.content)}`)
      .join('\n\n---\n\n');

    setExportSections(prev => prev.map(s => s.id === sectionToGenerate.id ? { ...s, status: 'generating' } : s));

    try {
      const newContent = await generateMissingDocument(context, sectionToGenerate.title as ActionType);
      setExportSections(prev => prev.map(s => 
        s.id === sectionToGenerate.id 
          ? { ...s, content: newContent, status: 'generated', enabled: true } 
          : s
      ));
    } catch (error) {
      console.error("Failed to generate missing document:", error);
      setExportSections(prev => prev.map(s => 
        s.id === sectionToGenerate.id 
          ? { ...s, status: 'missing', content: 'Error generating content.' }
          : s
      ));
    }
  }, [exportSections]);
  
  const handleFinalExport = useCallback((sections: ExportSection[]) => {
    const enabledSections = sections.filter(s => s.enabled);
    
    const output = enabledSections.map(section => {
      return `\n## ${section.title}\n\n${formatNodeContentForExport(section.content)}`;
    });

    const blueprint = `# Vynixel Startup Blueprint\n${output.join('\n\n---\n')}`;
    
    const blob = new Blob([blueprint], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Vynixel-Blueprint.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden font-sans bg-gray-900">
      <Header onExport={handleOpenExportModal} />
      <Canvas
        nodes={nodes}
        onNodeMove={updateNodePosition}
        onNodeAdd={addNode}
        onNodeContentUpdate={updateNodeContent}
        onNodeEditingChange={toggleNodeEditing}
        onNodeRegenerate={regenerateNode}
        onNodeSizeChange={updateNodeSize}
      />
      {isExportModalOpen && (
        <ExportModal 
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          sections={exportSections}
          setSections={setExportSections}
          onExport={handleFinalExport}
          onGenerateMissing={handleGenerateMissingSection}
          formatContent={formatNodeContentForExport}
        />
      )}
    </div>
  );
};

export default App;
