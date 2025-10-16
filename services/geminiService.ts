import { GoogleGenAI } from "@google/genai";
import { ActionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function getPromptForAction(idea: string, action: ActionType): string {
  const basePrompt = `You are an expert startup consultant. Based on the following startup idea: "${idea}"\n\n`;
  const outputFormat = `\n\nPresent the output in clear, concise, actionable bullet points using markdown-style formatting. Use **bold** for headings.`;

  switch (action) {
    case ActionType.EXPAND_IDEA:
      return `${basePrompt}Expand and refine this idea. Describe the core value proposition, key features, and what makes it unique.${outputFormat}`;
    case ActionType.VALIDATE_IDEA:
      return `${basePrompt}Provide a validation plan. What are the key assumptions to test? Suggest simple, low-cost experiments (like landing pages, surveys, or smoke tests) to validate product-market fit.${outputFormat}`;
    case ActionType.DEFINE_PROBLEM:
      return `${basePrompt}Clearly define the core problem this startup is solving. Who is experiencing this problem? What are the pain points? Why are existing solutions inadequate?${outputFormat}`;
    case ActionType.IDENTIFY_TARGET_USERS:
      return `${basePrompt}Identify and describe the primary and secondary target user segments for this idea. What are their demographics, needs, and behaviors? Create a brief proto-persona for the primary segment.${outputFormat}`;
    case ActionType.MAP_USER_PERSONAS:
      return `${basePrompt}Create 2-3 detailed user personas for the primary target audience. For each persona, include their name, role, goals, motivations, and frustrations related to the problem space.${outputFormat}`;
    case ActionType.CREATE_USER_JOURNEY:
      return `${basePrompt}Map out a typical user journey. Describe the key stages: Awareness, Consideration, Decision, Service, and Loyalty. For each stage, list the user's goals, actions, and touchpoints with the product.${outputFormat}`;
    case ActionType.DRAFT_PRD:
      return `${basePrompt}Draft a high-level Product Requirements Document (PRD). Include an introduction, goals, success metrics, and a list of key features with user stories (e.g., "As a [user], I want to [action], so that [benefit]").${outputFormat}`;
    case ActionType.DEFINE_MVP:
      return `${basePrompt}Define the Minimum Viable Product (MVP). What is the absolute smallest set of features needed to solve the core problem for early adopters? Prioritize features using a simple framework (e.g., MoSCoW method).${outputFormat}`;
    case ActionType.SUGGEST_TECH_STACK:
      return `${basePrompt}Suggest a suitable technology stack for building the MVP. Recommend a frontend framework, backend language/framework, database, and potential cloud hosting provider. Justify your choices briefly based on scalability, development speed, and talent availability.${outputFormat}`;
    case ActionType.GENERATE_PROJECT_STRUCTURE:
        return `${basePrompt}Based on the suggested tech stack (e.g., React, Node.js, PostgreSQL), generate a recommended project folder and file structure. Use a tree-like format to represent the directory layout and explain the purpose of key folders.${outputFormat}`;
    case ActionType.BUILD_SOCIAL_MEDIA_CAMPAIGN:
        return `${basePrompt}Outline a social media campaign map for the launch. Identify 2-3 key platforms. For each platform, define content pillars, suggest 3 sample post ideas, and recommend key metrics (KPIs) to track.${outputFormat}`;
    case ActionType.PLAN_AUDIENCE_GROWTH:
        return `${basePrompt}Create a plan for audience growth and engagement for the first 6 months. Suggest strategies across content marketing (blogging, SEO), community building (Discord, Reddit), and email marketing.${outputFormat}`;
    case ActionType.CREATE_MARKETING_STRATEGY:
        return `${basePrompt}Outline a comprehensive go-to-market strategy. Cover key marketing channels (e.g., content marketing, social media, SEO, paid ads), define the core marketing message, and create a high-level timeline for the first 3 months.${outputFormat}`;
    case ActionType.GENERATE_FUNDING_ROADMAP:
        return `${basePrompt}Generate a potential funding roadmap. Describe the typical stages (Pre-seed, Seed, Series A), the key milestones to achieve for each stage, and the estimated capital to raise at each round.${outputFormat}`;
    case ActionType.DEFINE_MONETIZATION_MODEL:
        return `${basePrompt}Define and compare 3 potential monetization models for this startup (e.g., Subscription (SaaS), Freemium, Transactional, Marketplace Fee). For each model, list its pros and cons in the context of this specific idea.${outputFormat}`;
    case ActionType.MAP_GTM_PLAN:
        return `${basePrompt}Map out a detailed Go-To-Market (GTM) plan for the launch. Include target audience segmentation, value proposition, marketing channels, sales strategy, and key performance indicators (KPIs).${outputFormat}`;
    case ActionType.GENERATE_TODO_LIST:
        return `${basePrompt}Generate a phase-based to-do list to get this startup off the ground. Break it down into phases like 'Phase 1: Validation (Weeks 1-4)', 'Phase 2: MVP Development (Weeks 5-12)', and 'Phase 3: Launch (Weeks 13-16)', with actionable tasks in each phase.${outputFormat}`;
    default:
      return `${basePrompt}Generate content for: ${action}. The output should be structured and actionable.${outputFormat}`;
  }
}

export const generateNodeContent = async (parentContent: string, action: ActionType): Promise<string> => {
    if (!process.env.API_KEY) {
        return Promise.resolve("API Key not configured. Please set up your environment variable.");
    }

    try {
        const prompt = getPromptForAction(parentContent, action);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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