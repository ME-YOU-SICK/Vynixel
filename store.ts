import { create } from 'zustand';
import { VynixelState, NodeData, ActionType, Position, NodeContent, ExportSection, NodeType, TableContent, QuizContent, AIProvider, User } from './types';
import { 
    generateNodeContentStream, 
    generateMissingDocument, 
    getBlueprintCritique,
    generateCustomPromptContent 
} from './services/geminiService';
import { initialActions, NODE_WIDTH, NODE_HEIGHT, NODE_SPACING } from './constants';

// --- DATABASE PERSISTENCE (localStorage simulation) ---

/**
 * Helper function to save the node graph to localStorage.
 * The data is scoped to the current user's email to simulate a multi-user database.
 * @param nodes - The map of nodes to be saved.
 * @param user - The current user object.
 */
const saveNodesToStorage = (nodes: Map<string, NodeData>, user: User | null) => {
    if (!user || !user.email) {
        console.warn("Attempted to save nodes without a user.");
        return;
    }
    const storageKey = `vynixel_graph_${user.email}`;
    try {
        // Convert Map to an array for JSON serialization, as Maps don't serialize directly.
        const serializableNodes = Array.from(nodes.entries());
        localStorage.setItem(storageKey, JSON.stringify(serializableNodes));
    } catch (error) {
        console.error("Failed to save nodes to localStorage:", error);
    }
};

const settingsStorageKey = (user: User | null) => user && user.email ? `vynixel_settings_${user.email}` : 'vynixel_settings_guest';

const saveSettingsToStorage = (settings: { provider?: AIProvider; model?: string; apiKey?: string }, user: User | null) => {
    try {
        const key = settingsStorageKey(user);
        const existing = localStorage.getItem(key);
        const current = existing ? JSON.parse(existing) : {};
        const updated = { ...current, ...settings };
        localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
};

const loadSettingsFromStorage = (user: User | null): { provider?: AIProvider; model?: string; apiKey?: string } => {
    try {
        const raw = localStorage.getItem(settingsStorageKey(user));
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
};


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

const parseContent = (text: string): NodeContent | TableContent | QuizContent => {
    const normalizeMarkdownish = (raw: string): NodeContent => {
        const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        const items: NodeContent = [];
        for (const line of lines) {
            // ****Heading:**** or **Heading:** or ### Heading
            const starHeading = line.match(/^\*{2,}\s*(.+?)\s*\*{2,}\s*:?.*$/);
            const hashHeading = line.match(/^#{2,,6}\s*(.+)$/);
            if (starHeading) {
                const content = starHeading[1].replace(/:$/, '').trim();
                items.push({ type: 'heading', content });
                const rest = line.replace(starHeading[0], '').trim();
                if (rest) items.push({ type: 'paragraph', content: rest });
                continue;
            }
            if (hashHeading) {
                items.push({ type: 'heading', content: hashHeading[1].trim() });
                continue;
            }
            // Bullets
            const bullet = line.match(/^[-\u2022]\s+(.*)$/);
            if (bullet) {
                items.push({ type: 'bullet', content: bullet[1] });
                continue;
            }
            // Default paragraph
            items.push({ type: 'paragraph', content: line });
        }
        return items.length > 0 ? items : [{ type: 'paragraph', content: raw }];
    };

    try {
        // Try whole-text JSON first
        let parsed = JSON.parse(text);
        // If already the expected shapes, return as-is
        if (Array.isArray(parsed)) {
            return parsed as NodeContent | QuizContent;
        }
        if (parsed && typeof parsed === 'object') {
            // Normalize generic objects into NodeContent (headings + bullets/paragraphs)
            const items: NodeContent = [];
            for (const [key, value] of Object.entries(parsed)) {
                items.push({ type: 'heading', content: key });
                if (typeof value === 'string') {
                    items.push(...normalizeMarkdownish(value));
                } else if (Array.isArray(value)) {
                    for (const v of value) {
                        if (typeof v === 'string') items.push({ type: 'bullet', content: v });
                        else items.push({ type: 'paragraph', content: JSON.stringify(v) });
                    }
                } else if (value && typeof value === 'object') {
                    items.push({ type: 'paragraph', content: JSON.stringify(value) });
                } else if (value != null) {
                    items.push({ type: 'paragraph', content: String(value) });
                }
            }
            return items;
        }
        // Fallback to paragraph string or embedded JSON object within text
        if (parsed != null) {
            return normalizeMarkdownish(String(parsed));
        }
        return [{ type: 'paragraph', content: '' }];
    } catch {
        // Not pure JSON: try to extract the first JSON object from the text
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            const prefix = text.slice(0, start).trim();
            const jsonSlice = text.slice(start, end + 1);
            try {
                const baseItems = prefix ? normalizeMarkdownish(prefix) : [];
                const obj = JSON.parse(jsonSlice);
                if (obj && typeof obj === 'object') {
                    const items: NodeContent = [...baseItems];
                    for (const [key, value] of Object.entries(obj)) {
                        items.push({ type: 'heading', content: key });
                        if (typeof value === 'string') {
                            items.push(...normalizeMarkdownish(value));
                        } else if (Array.isArray(value)) {
                            for (const v of value) {
                                if (typeof v === 'string') items.push({ type: 'bullet', content: v });
                                else items.push({ type: 'paragraph', content: JSON.stringify(v) });
                            }
                        } else if (value && typeof value === 'object') {
                            items.push({ type: 'paragraph', content: JSON.stringify(value) });
                        } else if (value != null) {
                            items.push({ type: 'paragraph', content: String(value) });
                        }
                    }
                    return items;
                }
            } catch {
                // ignore and fall through
            }
        }
        // Treat as markdownish text
        return normalizeMarkdownish(text);
    }
};


export const useStore = create<VynixelState>((set, get) => ({
    nodes: new Map(),
    theme: 'dark',
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: undefined,
    isAuthenticated: false,
    user: null,
    isSettingsModalOpen: false,
    isExportModalOpen: false,
    exportSections: [],
    isCustomPromptModalOpen: false,
    customPromptParentNode: null,

    login: () => {
        // Redirect to backend Google OAuth
        window.location.href = '/auth/google';
    },

    logout: async () => {
        try {
            await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
            // ignore network errors on logout
        }
        set({ isAuthenticated: false, user: null, nodes: new Map() });
    },

    initializeNodes: () => {
        const { nodes, isAuthenticated, user } = get();
        // Prevent re-initialization or running for unauthenticated users.
        if (nodes.size > 0 || !isAuthenticated || !user) {
            return;
        }

        const storageKey = `vynixel_graph_${user.email}`;
        const savedData = localStorage.getItem(storageKey);

        if (savedData) {
            try {
                const parsedNodes = JSON.parse(savedData);
                // Reconstruct the Map from the saved array.
                const nodesMap = new Map<string, NodeData>(parsedNodes);
                if (nodesMap.size > 0) {
                    set({ nodes: nodesMap });
                    return; // Successfully loaded from storage.
                }
            } catch (error) {
                console.error("Failed to parse saved nodes, creating a new board.", error);
                localStorage.removeItem(storageKey); // Clear corrupted data.
            }
        }

        // If no saved data, or if it was corrupted, create and save a new initial node.
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
        const initialNodes = new Map([[initialNodeId, initialNode]]);
        set({ nodes: initialNodes });
        saveNodesToStorage(initialNodes, user); // Save the initial state.
    },

    // Hydrate session from backend; call this early on app load
    hydrateSession: async () => {
        try {
            const res = await fetch('/api/me', { credentials: 'include' });
            if (!res.ok) {
                const guestSettings = loadSettingsFromStorage(null);
                set({ isAuthenticated: false, user: null, ...guestSettings });
                return;
            }
            const data = await res.json();
            if (data.authenticated && data.user) {
                const userSettings = loadSettingsFromStorage(data.user);
                set({ isAuthenticated: true, user: data.user, ...userSettings });
            } else {
                const guestSettings = loadSettingsFromStorage(null);
                set({ isAuthenticated: false, user: null, ...guestSettings });
            }
        } catch (e) {
            const guestSettings = loadSettingsFromStorage(null);
            set({ isAuthenticated: false, user: null, ...guestSettings });
        }
    },

    updateNodePosition: (id, newPosition) => set(state => {
        const newNodes = new Map(state.nodes);
        const node = newNodes.get(id);
        if (node) {
            newNodes.set(id, { ...node, position: newPosition });
            saveNodesToStorage(newNodes, state.user);
        }
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
            saveNodesToStorage(newNodes, state.user);
        }
        return { nodes: newNodes };
    }),

    updateNodeAnswers: (id, answers) => set(state => {
        const newNodes = new Map(state.nodes);
        const node = newNodes.get(id);
        if (node && node.nodeType === 'quiz') {
            newNodes.set(id, { ...node, answers });
            saveNodesToStorage(newNodes, state.user);
        }
        return { nodes: newNodes };
    }),

    updateNodeSize: (id, size) => set(state => {
        const newNodes = new Map(state.nodes);
        const node = newNodes.get(id);
        if (node && (node.width !== size.width || node.height !== size.height)) {
            newNodes.set(id, { ...node, width: size.width, height: size.height });
            saveNodesToStorage(newNodes, state.user);
            return { nodes: newNodes };
        }
        return {}; 
    }),

    toggleNodeEditing: (id, isEditing) => set(state => {
        const newNodes = new Map(state.nodes);
        const node = newNodes.get(id);
        if (node) {
            newNodes.set(id, { ...node, isEditing });
            saveNodesToStorage(newNodes, state.user);
        }
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

        set(state => {
            const newNodes = new Map(state.nodes).set(newNodeId, newNode);
            saveNodesToStorage(newNodes, state.user);
            return { nodes: newNodes };
        });
        
        let accumulatedText = "";
        try {
            const { provider, model, apiKey } = get();
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
                    saveNodesToStorage(newNodes, state.user);
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
                    saveNodesToStorage(newNodes, state.user);
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
            saveNodesToStorage(newNodes, state.user);
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
                    saveNodesToStorage(newNodes, state.user);
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
                    saveNodesToStorage(newNodes, state.user);
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
        set(state => {
            const newNodes = new Map(state.nodes).set(newNodeId, newNode);
            saveNodesToStorage(newNodes, state.user);
            return { nodes: newNodes };
        });

        try {
            const content = await getBlueprintCritique(context);
            set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(newNodeId);
                if(node) newNodes.set(newNodeId, { ...node, content, isLoading: false });
                saveNodesToStorage(newNodes, state.user);
                return { nodes: newNodes };
            });
        } catch (error) {
             console.error('Failed to analyze blueprint:', error);
             set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(newNodeId);
                if(node) {
                    newNodes.set(newNodeId, { ...node, content: 'Error during analysis.', isLoading: false, nodeType: 'text' });
                    saveNodesToStorage(newNodes, state.user);
                }
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
        set(state => {
            const newNodes = new Map(state.nodes).set(newNodeId, newNode);
            saveNodesToStorage(newNodes, state.user);
            return { nodes: newNodes };
        });

        let accumulatedText = "";
        try {
            const { provider, model, apiKey } = get();
            const stream = generateCustomPromptContent(parentContentString, prompt);
            for await (const chunk of stream) {
                accumulatedText += chunk;
            }
            set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(newNodeId);
                if (node) {
                    newNodes.set(newNodeId, { ...node, content: parseContent(accumulatedText), isLoading: false });
                    saveNodesToStorage(newNodes, state.user);
                }
                return { nodes: newNodes };
            });
        } catch (error) {
            console.error('Failed to generate custom node:', error);
             set(state => {
                const newNodes = new Map(state.nodes);
                const node = newNodes.get(newNodeId);
                if(node) {
                    newNodes.set(newNodeId, { ...node, content: 'Error generating content.', isLoading: false, nodeType: 'text' });
                    saveNodesToStorage(newNodes, state.user);
                }
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

    // Danger: Clears the entire canvas and user graph
    clearCanvas: () => set(state => {
        const newNodes = new Map<string, NodeData>();
        saveNodesToStorage(newNodes, state.user);
        return { nodes: newNodes };
    }),
    
    generateMissingSection: async (sectionToGenerate) => {
        set(state => {
            const newExportSections: ExportSection[] = state.exportSections.map(s => s.id === sectionToGenerate.id ? { ...s, status: 'generating' } : s);
            return { exportSections: newExportSections };
        });

        const { exportSections } = get();
        const context = exportSections
            .filter(s => s.enabled && s.status !== 'missing')
            .map(s => `## ${s.title}\n\n${formatNodeContentForExport(s)}`)
            .join('\n\n---\n\n');

        let accumulatedText = "";
        try {
            const { provider, model, apiKey } = get();
            const stream = generateMissingDocument(context, sectionToGenerate.title as ActionType);
            for await (const chunk of stream) {
                accumulatedText += chunk;
            }
            const newContent = parseContent(accumulatedText);

            let anchorNode: NodeData | null = null;
            const currentSectionIndex = get().exportSections.findIndex(s => s.id === sectionToGenerate.id);

            for (let i = currentSectionIndex - 1; i >= 0; i--) {
                const prevSection = get().exportSections[i];
                if (prevSection.status === 'included' || prevSection.status === 'generated') {
                    const potentialAnchor = get().nodes.get(prevSection.id);
                    if (potentialAnchor) {
                        anchorNode = potentialAnchor;
                        break;
                    }
                }
            }
            if (!anchorNode) {
                anchorNode = Array.from(get().nodes.values()).find(n => n.parentId === null) || null;
            }

            if(anchorNode) {
                const newNodeId = `node_${Date.now()}`;
                const newPosition: Position = {
                    x: anchorNode.position.x,
                    y: anchorNode.position.y + anchorNode.height + NODE_SPACING
                };
                const newNode: NodeData = {
                    id: newNodeId,
                    title: sectionToGenerate.title,
                    content: newContent,
                    nodeType: getNodeTypeForAction(sectionToGenerate.title as ActionType),
                    position: newPosition,
                    parentId: anchorNode.id,
                    isEditing: false,
                    isLoading: false,
                    availableActions: initialActions,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                    answers: sectionToGenerate.answers
                };

                set(state => {
                    const newNodes = new Map(state.nodes).set(newNodeId, newNode);
                    const newExportSections: ExportSection[] = state.exportSections.map(s => 
                        s.id === sectionToGenerate.id 
                        ? { ...s, id: newNodeId, content: newContent, status: 'generated', enabled: true } 
                        : s
                    );
                    saveNodesToStorage(newNodes, state.user);
                    return { nodes: newNodes, exportSections: newExportSections };
                });
            } else {
                 set(state => {
                    const newExportSections: ExportSection[] = state.exportSections.map(s => s.id === sectionToGenerate.id ? { ...s, content: newContent, status: 'generated', enabled: true } : s);
                    return { exportSections: newExportSections };
                });
            }

        } catch (error) {
            console.error("Failed to generate missing document:", error);
            set(state => {
                const newExportSections: ExportSection[] = state.exportSections.map(s => s.id === sectionToGenerate.id ? { ...s, status: 'missing', content: 'Error generating content.', nodeType: 'text' } : s);
                return { exportSections: newExportSections };
            });
        }
    },
    
    exportToPdf: () => {
        console.log("PDF export initiated from store. Component handles implementation.");
    },

    openSettingsModal: () => set({ isSettingsModalOpen: true }),
    closeSettingsModal: () => set({ isSettingsModalOpen: false }),
    setProvider: (provider) => set(state => { saveSettingsToStorage({ provider }, state.user); return { provider }; }),
    setModel: (model) => set(state => { saveSettingsToStorage({ model }, state.user); return { model }; }),
    setApiKey: (apiKey) => set(state => { saveSettingsToStorage({ apiKey }, state.user); return { apiKey }; }),
}));