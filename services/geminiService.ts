
import { GoogleGenAI } from "@google/genai";
import { ActionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function getPromptForAction(idea: string, action: ActionType): string {
  const basePrompt = `Based on the following startup idea: "${idea}"\n\n`;
  
  switch (action) {
    case ActionType.EXPAND_IDEA:
      return `${basePrompt}Expand and refine this idea. Describe the core value proposition, key features, and what makes it unique. Present the output in clear, concise bullet points.`;
    case ActionType.VALIDATE_IDEA:
      return `${basePrompt}Provide a validation plan for this idea. What are the key assumptions to test? Suggest simple, low-cost experiments (like landing pages, surveys, or smoke tests) to validate product-market fit.`;
    case ActionType.DEFINE_PROBLEM:
      return `${basePrompt}Clearly define the core problem this startup is solving. Who is experiencing this problem? What are the pain points? Why is existing solutions inadequate?`;
    case ActionType.IDENTIFY_TARGET_USERS:
      return `${basePrompt}Identify and describe the primary and secondary target user segments for this idea. What are their demographics, needs, and behaviors?`;
    case ActionType.MAP_USER_PERSONAS:
      return `${basePrompt}Create 2-3 detailed user personas for the primary target audience. Include their name, role, goals, motivations, and frustrations related to the problem space.`;
    case ActionType.DRAFT_PRD:
      return `${basePrompt}Draft a high-level Product Requirements Document (PRD). Include an introduction, goals, user stories (e.g., "As a [user], I want to [action], so that [benefit]"), and key features for the MVP.`;
    case ActionType.DEFINE_MVP:
      return `${basePrompt}Define the Minimum Viable Product (MVP). What is the absolute smallest set of features needed to solve the core problem for early adopters? Prioritize features using a simple framework.`;
    case ActionType.SUGGEST_TECH_STACK:
      return `${basePrompt}Suggest a suitable technology stack for building the MVP. Recommend a frontend framework, backend language/framework, database, and potential cloud hosting provider. Justify your choices briefly.`;
    case ActionType.CREATE_MARKETING_STRATEGY:
        return `${basePrompt}Outline a comprehensive marketing strategy. Suggest channels (e.g., content marketing, social media, SEO, paid ads), key messaging, and a plan for the first 3 months.`;
    case ActionType.GENERATE_TODO_LIST:
        return `${basePrompt}Generate a phase-based to-do list to get this startup off the ground. Break it down into phases like 'Phase 1: Validation (Weeks 1-4)', 'Phase 2: MVP Development (Weeks 5-12)', etc. with actionable tasks in each phase.`;
    default:
      return `${basePrompt}Generate content for: ${action}. The output should be structured and actionable.`;
  }
}

export const generateNodeContent = async (parentContent: string, action: ActionType): Promise<string> => {
    if (!process.env.API_KEY) {
        return Promise.resolve("API Key not configured. Please set up your environment variable.");
    }

    try {
        const prompt = getPromptForAction(parentContent, action);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });

        const text = response.text.trim();
        // Simple markdown-like formatting for better display
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');

    } catch (error) {
        console.error("Error generating content with Gemini API:", error);
        throw new Error("Failed to generate content from AI. Please check your API key and network connection.");
    }
};
