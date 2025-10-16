export interface Position {
  x: number;
  y: number;
}

export type NodeContentItem = {
  type: 'heading' | 'bullet' | 'paragraph';
  content: string;
};

export type NodeContent = NodeContentItem[];

export enum ActionType {
  EXPAND_IDEA = 'Expand or Refine Idea',
  VALIDATE_IDEA = 'Validate Idea',
  DEFINE_PROBLEM = 'Define Problem',
  IDENTIFY_TARGET_USERS = 'Identify Target Users',
  MAP_USER_PERSONAS = 'Map User Personas',
  CREATE_USER_JOURNEY = 'Create User Journey',
  DRAFT_PRD = 'Draft PRD',
  DEFINE_MVP = 'Define MVP',
  SUGGEST_TECH_STACK = 'Suggest Tech Stack',
  GENERATE_PROJECT_STRUCTURE = 'Generate Project Structure',
  BUILD_SOCIAL_MEDIA_CAMPAIGN = 'Build Social Media Campaign',
  PLAN_AUDIENCE_GROWTH = 'Plan Audience Growth & Engagement',
  CREATE_MARKETING_STRATEGY = 'Create Marketing Strategy',
  GENERATE_FUNDING_ROADMAP = 'Generate Funding Roadmap',
  DEFINE_MONETIZATION_MODEL = 'Define Monetization Model',
  MAP_GTM_PLAN = 'Map Go-To-Market Plan',
  GENERATE_TODO_LIST = 'Generate Phase-based To-Do List',
  REGENERATE = 'Regenerate',
  CUSTOM_PROMPT = 'Custom Prompt',
}

export interface NodeData {
  id: string;
  title: string;
  content: string | NodeContent;
  position: Position;
  parentId: string | null;
  isEditing: boolean;
  isLoading: boolean;
  availableActions: ActionType[];
  width: number;
  height: number;
}

export type ExportSectionStatus = 'included' | 'missing' | 'generated' | 'generating';

export interface ExportSection {
  id: string;
  title: ActionType | string;
  content: string | NodeContent;
  status: ExportSectionStatus;
  enabled: boolean;
}

export type Theme = 'light' | 'dark';

export interface VynixelState {
    nodes: Map<string, NodeData>;
    theme: Theme;
    isExportModalOpen: boolean;
    exportSections: ExportSection[];
    isCustomPromptModalOpen: boolean;
    customPromptParentNode: { parentId: string, relativePosition: Position } | null;
    initializeNodes: () => void;
    updateNodePosition: (id: string, newPosition: Position) => void;
    updateNodeContent: (id: string, content: string) => void;
    updateNodeSize: (id: string, size: { width: number; height: number }) => void;
    toggleNodeEditing: (id: string, isEditing: boolean) => void;
    addNode: (parentId: string, action: ActionType, relativePosition: Position) => Promise<void>;
    regenerateNode: (nodeId: string) => Promise<void>;
    analyzeBlueprint: () => Promise<void>;
    openCustomPromptModal: (parentId: string, relativePosition: Position) => void;
    closeCustomPromptModal: () => void;
    addCustomNode: (title: string, prompt: string) => Promise<void>;
    toggleTheme: () => void;
    openExportModal: () => void;
    closeExportModal: () => void;
    setExportSections: (sections: ExportSection[]) => void;
    generateMissingSection: (section: ExportSection) => Promise<void>;
    exportToPdf: () => void;
}