import { create } from 'zustand';
import { VynixelState, NodeData, ActionType, Position, NodeContent, ExportSection, NodeType, TableContent, QuizContent } from './types';
import { 
    generateNodeContentStream, 
    generateMissingDocument, 
    getBlueprintCritique,
    generateCustomPromptContent 
} from './services/geminiService';
import { initialActions, NODE_WIDTH, NODE_HEIGHT } from './constants';

const getNodeTypeForAction = (action: ActionType): NodeType => {
    switch (action) {
        case ActionType.DEFINE_MONETIZATION_MODEL:
        case ActionType.SUGGEST_TECH_STACK:
            return 'table';
        case ActionType.VALIDATE_IDEA:
            return 'quiz';
        default:
            return 'text';
    }
};

const formatNodeContentForExport = (node: { content: NodeData['content'], nodeType: NodeType, answers?: { [key: number]: string } }): string => {
    if (typeof node.content === 'string') return node.content;

    switch(node.nodeType) {
        case 'table':
            const table = node.content as TableContent;
            if (!table || !table.headers || !table.rows) return 'Table data is malformed.';
            let markdown = `| ${table.headers.join(' | ')} |\n`;
            markdown += `| ${table.headers.map(() => '---').join(' | ')} |\n`;
            table.rows.forEach(row => {
                markdown += `| ${row.join(' | ')} |\n`;
            });
            return markdown;
        case 'quiz':
            const quiz = node.content as QuizContent;
            const answers = node.answers || {};
            if (!quiz || !Array.isArray(quiz)) return 'Quiz data is malformed.';
            return quiz.map((q, i) => {
                let text = `${i + 1}. ${q.question}\n`;
                if (q.type === 'multiple-choice' && q.options) {
                    text += q.options.map(opt => `  - ${answers[i] === opt ? '[x]' : '[ ]'} ${opt}`).join('\n');
                } else {
                    text += `\nAnswer: ${answers[i] || '____________________'}\n`;
                }
                return text;
            }).join('\n\n');
        case 'text':
        default:
            const textContent = node.content as NodeContent;
            if (!textContent || !Array.isArray(textContent)) return '';
            return textContent.map(item => {
                switch(item.type) {
                    case 'heading': return `### ${item.content}\n`;
                    case 'bullet': return `* ${item.content}`;
                    case 'paragraph': return `${item.content}\n`;
                    default: return '';
                }
            }).join('\n');
    }
};

const parseContent = (text: string): any => {
    try {
        return JSON.parse(text);
    } catch (e) {
        console.warn("Failed to parse JSON, falling back to error message:", text, e);
        return [{ type: 'paragraph', content: 'AI returned malformed content. Please try regenerating.' }];
    }
};


export const useStore = create<VynixelState>((set, get) => ({
    nodes: new Map(),
    theme: 'dark',
    isExportModalOpen: false,
    exportSections: [],
    isCustomPromptModalOpen: false,
    customPromptParentNode: null,

    initializeNodes: () => {
        if(get().nodes.size > 0) return;
        const initialNodeId = `node_${Date.now()}`;
        const initialNode: NodeData = {
            id: initialNodeId,
            title: 'Your Startup Idea',
            content: 'Describe your startup idea in a sentence or a short paragraph. For example: "A platform that uses AI to create personalized travel itineraries."',
            nodeType: 'text',
            position: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 },
            parentId: null,
            isEditing: false,
            isLoading: false,
            availableActions: initialActions,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
        };
        set({ nodes: new Map([[initialNodeId, initialNode]]) });
    },

    updateNodePosition: (id, newPosition) => set(state => {
        const newNodes = new Map(state.nodes);
        const node = newNodes.get(id);
        if (node) newNodes.set(id, { ...node, position: newPosition });
        return { nodes: newNodes };
    }),
    
    updateNodeContent: (id, content) => set(state => {
        const newNodes = new Map(state.nodes);
        const node = newNodes.get(id);
        if (node && node.nodeType === 'text') {
            const structuredContent: NodeContent = content.split('\n')
              .filter(line => line.trim() !== '')
              .map(line => ({ type: 'bullet', content: line.replace(/^- /, '') }));
            newNodes.set(id, { ...node, content: structuredContent.length > 0 ? structuredContent : content, isEditing: false });
        }
        return { nodes: newNodes };
    }),

    updateNodeAnswers: (id, answers) => set(state => {
        const newNodes = new Map(state.nodes);
        const node = newNodes.get(id);
        if (node && node.nodeType === 'quiz') {
            newNodes.set(id, { ...node, answers });
        }
        return { nodes: newNodes };
    }),

    updateNodeSize: (id, size) => set(state => {
        const newNodes = new Map(state.nodes);
        const node = newNodes.get(id);
        if (node && (node.width !== size.width || node.height !== size.height)) {
            newNodes.set(id, { ...node, width: size.width, height: size.height });
            return { nodes: newNodes };
        }
        return {}; 
    }),

    toggleNodeEditing: (id, isEditing) => set(state => {
        const newNodes = new Map(state.nodes);
        const node = newNodes.get(id);
        if (node) newNodes.set(id, { ...node, isEditing });
        return { nodes: newNodes };
    }),

    addNode: async (parentId, action, relativePosition) => {
        const parentNode = get().nodes.get(parentId);
        if (!parentNode) return;

        const parentContentString = typeof parentNode.content === 'string' 
            ? parentNode.content 
            : formatNodeContentForExport(parentNode);

        const newNodeId = `node_${Date.now()}`;
        const nodeType = getNodeTypeForAction(action);
        const newNode: NodeData = {
            id: newNodeId,
            title: action,
            content: '',
            nodeType: nodeType,
            position: { x: parentNode.position.x + relativePosition.x, y: parentNode.position.y + relativePosition.y },
            parentId: parentId,
            isEditing: false,
            isLoading: true,
            availableActions: initialActions.filter(a => a !== ActionType.REGENERATE),
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
        };

        set(state => ({ nodes: new Map(state.nodes).set(newNodeId, newNode) }));
        
        let accumulatedText = "";
        try {
            const stream = generateNodeContentStream(parentContentString, action);
            for await (const chunk of stream) {
                accumulatedText += chunk;
            }
            
            set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(newNodeId);
                if (node) {
                    const finalContent = parseContent(accumulatedText);
                    newNodes.set(newNodeId, { ...node, content: finalContent, isLoading: false, availableActions: initialActions });
                }
                return { nodes: newNodes };
            });

        } catch (error) {
            console.error('Failed to generate node content:', error);
            set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(newNodeId);
                if(node) {
                    const errorContent: NodeContent = [{ type: 'heading', content: 'Error'}, { type: 'paragraph', content: 'Failed to generate content.' }];
                    newNodes.set(newNodeId, { ...node, content: errorContent, isLoading: false, nodeType: 'text' });
                }
                return { nodes: newNodes };
            });
        }
    },

    regenerateNode: async (nodeId) => {
        const nodeToRegenerate = get().nodes.get(nodeId);
        if (!nodeToRegenerate || !nodeToRegenerate.parentId) return;
        
        const parentNode = get().nodes.get(nodeToRegenerate.parentId);
        if(!parentNode) return;

        const parentContentString = typeof parentNode.content === 'string' 
            ? parentNode.content 
            : formatNodeContentForExport(parentNode);
        
        const action = nodeToRegenerate.title as ActionType;
        const nodeType = getNodeTypeForAction(action);

        set(state => {
            const newNodes = new Map(state.nodes);
            const node = newNodes.get(nodeId);
            if(node) newNodes.set(nodeId, {...node, isLoading: true, content: '', nodeType: nodeType});
            return { nodes: newNodes };
        });

        let accumulatedText = "";
        try {
            const stream = generateNodeContentStream(parentContentString, action);
             for await (const chunk of stream) {
                accumulatedText += chunk;
            }
             set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(nodeId);
                if (node) {
                    const finalContent = parseContent(accumulatedText);
                    newNodes.set(nodeId, { ...node, content: finalContent, isLoading: false });
                }
                return { nodes: newNodes };
            });
        } catch (error) {
            console.error('Failed to regenerate node content:', error);
            set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(nodeId);
                if(node) {
                    const errorContent: NodeContent = [{ type: 'heading', content: 'Error'}, { type: 'paragraph', content: 'Failed to regenerate content.' }];
                    newNodes.set(nodeId, {...node, content: errorContent, isLoading: false, nodeType: 'text'});
                }
                return { nodes: newNodes };
            });
        }
    },

    analyzeBlueprint: async () => {
        const { nodes } = get();
        const context = Array.from(nodes.values())
            .map(n => `## ${n.title}\n\n${formatNodeContentForExport(n)}`)
            .join('\n\n---\n\n');
        
        const rootNode = Array.from(nodes.values()).find(n => !n.parentId);
        if (!rootNode) return;

        const newNodeId = `node_${Date.now()}`;
        const newNode: NodeData = {
            id: newNodeId,
            title: 'Critique & Suggestions',
            content: '',
            nodeType: 'text',
            position: { x: rootNode.position.x - rootNode.width - 100, y: rootNode.position.y },
            parentId: null,
            isEditing: false,
            isLoading: true,
            availableActions: [],
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
        };
        set(state => ({ nodes: new Map(state.nodes).set(newNodeId, newNode) }));

        try {
            const content = await getBlueprintCritique(context);
            set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(newNodeId);
                if(node) newNodes.set(newNodeId, { ...node, content, isLoading: false });
                return { nodes: newNodes };
            });
        } catch (error) {
             console.error('Failed to analyze blueprint:', error);
             set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(newNodeId);
                if(node) newNodes.set(newNodeId, { ...node, content: 'Error during analysis.', isLoading: false, nodeType: 'text' });
                return { nodes: newNodes };
            });
        }
    },
    
    openCustomPromptModal: (parentId, relativePosition) => set({
        isCustomPromptModalOpen: true,
        customPromptParentNode: { parentId, relativePosition }
    }),

    closeCustomPromptModal: () => set({
        isCustomPromptModalOpen: false,
        customPromptParentNode: null
    }),
    
    addCustomNode: async (title, prompt) => {
        const { customPromptParentNode, nodes } = get();
        if (!customPromptParentNode) return;
        const { parentId, relativePosition } = customPromptParentNode;

        const parentNode = nodes.get(parentId);
        if (!parentNode) return;

        const parentContentString = typeof parentNode.content === 'string'
            ? parentNode.content
            : formatNodeContentForExport(parentNode);
        
        get().closeCustomPromptModal();

        const newNodeId = `node_${Date.now()}`;
        const newNode: NodeData = {
            id: newNodeId, title, content: '',
            nodeType: 'text',
            position: { x: parentNode.position.x + relativePosition.x, y: parentNode.position.y + relativePosition.y },
            parentId, isEditing: false, isLoading: true, availableActions: initialActions,
            width: NODE_WIDTH, height: NODE_HEIGHT,
        };
        set(state => ({ nodes: new Map(state.nodes).set(newNodeId, newNode) }));

        let accumulatedText = "";
        try {
            const stream = generateCustomPromptContent(parentContentString, prompt);
            for await (const chunk of stream) {
                accumulatedText += chunk;
            }
            set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(newNodeId);
                if (node) newNodes.set(newNodeId, { ...node, content: parseContent(accumulatedText), isLoading: false });
                return { nodes: newNodes };
            });
        } catch (error) {
            console.error('Failed to generate custom node:', error);
             set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(newNodeId);
                if(node) newNodes.set(newNodeId, { ...node, content: 'Error generating content.', isLoading: false, nodeType: 'text' });
                return { nodes: newNodes };
            });
        }
    },

    toggleTheme: () => set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    
    openExportModal: () => {
        const { nodes } = get();
        const rootNode = Array.from(nodes.values()).find(n => n.parentId === null);
        if (!rootNode) return;

        const allPossibleActions = initialActions.filter(a => a !== ActionType.REGENERATE && a !== ActionType.CUSTOM_PROMPT);
        
        const sections: ExportSection[] = allPossibleActions.map((actionTitle, index) => {
          const node = Array.from(nodes.values()).find(n => n.title === actionTitle);
          return node
            ? { id: node.id, title: actionTitle, content: node.content, status: 'included', enabled: true, nodeType: node.nodeType, answers: node.answers }
            : { id: `missing-${index}`, title: actionTitle, content: '', status: 'missing', enabled: false, nodeType: getNodeTypeForAction(actionTitle) };
        });

        sections.unshift({
          id: rootNode.id, title: rootNode.title, content: rootNode.content, status: 'included', enabled: true, nodeType: rootNode.nodeType,
        });

        set({ exportSections: sections, isExportModalOpen: true });
    },
    
    closeExportModal: () => set({ isExportModalOpen: false, exportSections: [] }),
    
    setExportSections: (sections) => set({ exportSections: sections }),
    
    generateMissingSection: async (sectionToGenerate) => {
        const { exportSections } = get();
        const context = exportSections
            .filter(s => s.enabled && s.status !== 'missing')
            .map(s => `## ${s.title}\n\n${formatNodeContentForExport(s)}`)
            .join('\n\n---\n\n');

        set(state => ({
            exportSections: state.exportSections.map(s => s.id === sectionToGenerate.id ? { ...s, status: 'generating' } : s)
        }));

        let accumulatedText = "";
        try {
            const stream = generateMissingDocument(context, sectionToGenerate.title as ActionType);
            for await (const chunk of stream) {
                accumulatedText += chunk;
            }
            const newContent = parseContent(accumulatedText);
            set(state => ({
                exportSections: state.exportSections.map(s => s.id === sectionToGenerate.id ? { ...s, content: newContent, status: 'generated', enabled: true } : s)
            }));
        } catch (error) {
            console.error("Failed to generate missing document:", error);
            set(state => ({
                exportSections: state.exportSections.map(s => s.id === sectionToGenerate.id ? { ...s, status: 'missing', content: 'Error generating content.', nodeType: 'text' } : s)
            }));
        }
    },
    
    exportToPdf: () => {
        // This function will be called from the component, which has access to the DOM
        console.log("PDF export initiated from store. Component handles implementation.");
    },
}));