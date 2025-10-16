import { GoogleGenAI, Type } from "@google/genai";
import { ActionType, NodeContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            type: {
                type: Type.STRING,
                enum: ['heading', 'bullet', 'paragraph'],
                description: 'The type of content element.'
            },
            content: {
                type: Type.STRING,
                description: 'The text content of the element.'
            }
        },
        required: ['type', 'content']
    }
};

function getPromptForAction(idea: string, action: ActionType): string {
  const basePrompt = `You are an expert startup consultant. Based on the following startup idea: "${idea}"\n\n`;
  const instruction = `Generate content for the action: "${action}".`;

  switch (action) {
    case ActionType.EXPAND_IDEA:
      return `${basePrompt}Expand and refine this idea. Describe the core value proposition, key features, and what makes it unique.`;
    case ActionType.VALIDATE_IDEA:
      return `${basePrompt}Provide a validation plan. What are the key assumptions to test? Suggest simple, low-cost experiments (like landing pages, surveys, or smoke tests) to validate product-market fit.`;
    case ActionType.DEFINE_PROBLEM:
      return `${basePrompt}Clearly define the core problem this startup is solving. Who is experiencing this problem? What are the pain points? Why are existing solutions inadequate?`;
    case ActionType.IDENTIFY_TARGET_USERS:
      return `${basePrompt}Identify and describe the primary and secondary target user segments for this idea. What are their demographics, needs, and behaviors? Create a brief proto-persona for the primary segment.`;
    case ActionType.MAP_USER_PERSONAS:
      return `${basePrompt}Create 2-3 detailed user personas for the primary target audience. For each persona, include their name, role, goals, motivations, and frustrations related to the problem space. Use headings for each persona.`;
    case ActionType.CREATE_USER_JOURNEY:
      return `${basePrompt}Map out a typical user journey. Describe the key stages: Awareness, Consideration, Decision, Service, and Loyalty. For each stage, list the user's goals, actions, and touchpoints with the product.`;
    case ActionType.DRAFT_PRD:
      return `${basePrompt}Draft a high-level Product Requirements Document (PRD). Include an introduction, goals, success metrics, and a list of key features with user stories (e.g., "As a [user], I want to [action], so that [benefit]").`;
    case ActionType.DEFINE_MVP:
      return `${basePrompt}Define the Minimum Viable Product (MVP). What is the absolute smallest set of features needed to solve the core problem for early adopters? Prioritize features using a simple framework (e.g., MoSCoW method).`;
    case ActionType.SUGGEST_TECH_STACK:
      return `${basePrompt}Suggest a suitable technology stack for building the MVP. Recommend a frontend framework, backend language/framework, database, and potential cloud hosting provider. Justify your choices briefly based on scalability, development speed, and talent availability.`;
    case ActionType.GENERATE_PROJECT_STRUCTURE:
        return `${basePrompt}Based on the suggested tech stack (e.g., React, Node.js, PostgreSQL), generate a recommended project folder and file structure. Use a tree-like format to represent the directory layout and explain the purpose of key folders. Present as paragraphs and bullets.`;
    case ActionType.BUILD_SOCIAL_MEDIA_CAMPAIGN:
        return `${basePrompt}Outline a social media campaign map for the launch. Identify 2-3 key platforms. For each platform, define content pillars, suggest 3 sample post ideas, and recommend key metrics (KPIs) to track.`;
    case ActionType.PLAN_AUDIENCE_GROWTH:
        return `${basePrompt}Create a plan for audience growth and engagement for the first 6 months. Suggest strategies across content marketing (blogging, SEO), community building (Discord, Reddit), and email marketing.`;
    case ActionType.CREATE_MARKETING_STRATEGY:
        return `${basePrompt}Outline a comprehensive go-to-market strategy. Cover key marketing channels (e.g., content marketing, social media, SEO, paid ads), define the core marketing message, and create a high-level timeline for the first 3 months.`;
    case ActionType.GENERATE_FUNDING_ROADMAP:
        return `${basePrompt}Generate a potential funding roadmap. Describe the typical stages (Pre-seed, Seed, Series A), the key milestones to achieve for each stage, and the estimated capital to raise at each round.`;
    case ActionType.DEFINE_MONETIZATION_MODEL:
        return `${basePrompt}Define and compare 3 potential monetization models for this startup (e.g., Subscription (SaaS), Freemium, Transactional, Marketplace Fee). For each model, list its pros and cons in the context of this specific idea.`;
    case ActionType.MAP_GTM_PLAN:
        return `${basePrompt}Map out a detailed Go-To-Market (GTM) plan for the launch. Include target audience segmentation, value proposition, marketing channels, sales strategy, and key performance indicators (KPIs).`;
    case ActionType.GENERATE_TODO_LIST:
        return `${basePrompt}Generate a phase-based to-do list to get this startup off the ground. Break it down into phases like 'Phase 1: Validation (Weeks 1-4)', 'Phase 2: MVP Development (Weeks 5-12)', and 'Phase 3: Launch (Weeks 13-16)', with actionable tasks in each phase.`;
    default:
      return `${basePrompt}${instruction}`;
  }
}

const generateJSON = async (prompt: string): Promise<NodeContent> => {
    if (!process.env.API_KEY) {
        return Promise.resolve([
            { type: 'heading', content: 'Configuration Error' },
            { type: 'paragraph', content: 'API Key not configured.' }
        ]);
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema }
        });
        return JSON.parse(response.text.trim()) as NodeContent;
    } catch (error) {
        console.error("Error generating JSON content:", error);
        throw new Error("Failed to generate structured content from AI.");
    }
};

export async function* generateContentStream(prompt: string): AsyncGenerator<string, void, unknown> {
    if (!process.env.API_KEY) {
        yield '{"error": "API Key not configured."}';
        return;
    }
    try {
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema }
        });
        for await (const chunk of response) {
            yield chunk.text;
        }
    } catch (error) {
        console.error("Error in streaming generation:", error);
        yield `[{"type": "heading", "content": "Error"}, {"type": "paragraph", "content": "Failed to stream content."}]`;
    }
}

export const generateNodeContentStream = (parentContent: string, action: ActionType) => {
    const prompt = getPromptForAction(parentContent, action);
    return generateContentStream(prompt);
};

export const generateCustomPromptContent = (parentContent: string, customPrompt: string) => {
    const prompt = `You are an expert startup consultant. Based on the following context: "${parentContent}"\n\nFulfill this request: "${customPrompt}"`;
    return generateContentStream(prompt);
}

export const generateMissingDocument = (context: string, missingAction: ActionType) => {
    const prompt = `You are a startup consultant synthesizing a business plan. You have the following context from an existing business plan:\n---\n${context}\n---\n\nBased on all the information above, generate the content for the following missing section: "${missingAction}". Make sure the new section is consistent with the provided context.`;
    return generateContentStream(prompt);
};

export const getBlueprintCritique = (context: string): Promise<NodeContent> => {
    const prompt = `You are an expert startup strategist. Analyze the following startup blueprint and provide a high-level critique. Identify potential gaps, logical inconsistencies, and risks. Finally, suggest 2-3 actionable next steps.
    ---
    ${context}
    ---
    Structure your response with clear headings for "Critique", "Identified Gaps", and "Suggested Next Steps".`;
    return generateJSON(prompt);
};