import { GoogleGenAI, Type } from "@google/genai";
import { ActionType, NodeContent } from "../types";

// Construct client lazily to avoid throwing at module load when no key is set
function getRuntimeConfig() {
    const w: any = window as any;
    return {
        provider: w?.__VYNIXEL_PROVIDER__ || 'gemini',
        model: w?.__VYNIXEL_MODEL__ || 'gemini-2.5-flash',
        apiKey: w?.__VYNIXEL_API_KEY__ || undefined,
    } as { provider: string; model: string; apiKey?: string };
}

function getGenAI(withApiKey?: string) {
    const apiKey = withApiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
}

const textResponseSchema = {
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

const tableResponseSchema = {
    type: Type.OBJECT,
    properties: {
        headers: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'The column headers for the table.'
        },
        rows: {
            type: Type.ARRAY,
            items: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            description: 'The rows of the table, where each row is an array of strings.'
        }
    },
    required: ['headers', 'rows']
};

const quizResponseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: {
                type: Type.STRING,
                description: 'The question text.'
            },
            type: {
                type: Type.STRING,
                enum: ['multiple-choice', 'short-answer'],
                description: 'The type of question.'
            },
            options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'An array of possible answers for multiple-choice questions.'
            }
        },
        required: ['question', 'type']
    }
};

const actionToSchemaMap = {
    [ActionType.DEFINE_MONETIZATION_MODEL]: tableResponseSchema,
    [ActionType.SUGGEST_TECH_STACK]: tableResponseSchema,
    [ActionType.VALIDATE_IDEA]: quizResponseSchema,
};


function getPromptForAction(idea: string, action: ActionType): string {
  const basePrompt = `You are a world-class startup consultant and product strategist. Your advice is sharp, actionable, and tailored. For the startup idea: "${idea}"\n\nWhen you respond, you MUST use one of the following formats so the app can parse it cleanly:\n1) Strict JSON matching the schema for the selected action (preferred).\n2) Markdown with clear headings and bullets using ONLY this syntax:\n   - Headings as ****Heading Text:**** (four asterisks on both sides, colon optional)\n   - Bullets starting with '- ' (dash and space)\nDo not use other heading syntaxes. Do not wrap the whole response in code fences.\n\n`;

  switch (action) {
    case ActionType.EXPAND_IDEA:
      return `${basePrompt}Flesh out this concept into a clear "Idea Canvas". Structure your response with these headings:
- **Core Value Proposition:** What is the single, most compelling promise to the customer?
- **Key Features (Top 3):** Describe the three most critical features that deliver the value proposition.
- **Secret Sauce:** What makes this idea unique and difficult to copy?
- **Target Audience:** Who is the ideal early adopter?`;

    case ActionType.VALIDATE_IDEA:
      return `${basePrompt}Create an "Assumption Validation Quiz" to help the founder critically assess their idea. The goal is to identify the riskiest assumptions. Generate 4 critical questions, mixing multiple-choice and short-answer formats, that challenge the founder on:
1.  The existence and severity of the problem.
2.  The effectiveness of their proposed solution.
3.  Their ability to reach the target customer.
4.  The customer's willingness to pay.
Frame the questions to be thought-provoking and direct.`;

    case ActionType.DEFINE_PROBLEM:
      return `${basePrompt}Create a "Problem Statement Canvas". Clearly define the problem space using these headings:
- **The Problem:** Describe the core problem in 1-2 sentences.
- **Target Customer:** Who experiences this problem most acutely? Be specific.
- **Current Pains & Workarounds:** What are their specific pain points? How do they try to solve it now (and why does it fail)?
- **Emotional Impact:** What is the emotional cost of this problem for the customer?`;

    case ActionType.IDENTIFY_TARGET_USERS:
      return `${basePrompt}Define the "Ideal Customer Profile". Break down the target audience with these headings:
- **Primary Segment (Early Adopters):** Describe the single group of users who will get the most value, most quickly.
- **Secondary Segment (Growth Market):** Who is the next logical group to target after initial success?
- **Proto-Persona:** Create a brief, actionable profile of the primary user, including their main goal, a key demographic fact, and their biggest frustration related to this problem.`;

    case ActionType.MAP_USER_PERSONAS:
      return `${basePrompt}Create two distinct and detailed user personas. For each persona, use these headings:
- **Persona Name & Photo Descriptor:** (e.g., "Sarah the Startup Marketer", "A photo of a woman in her late 20s at a busy co-working space").
- **Role & Demographics:** Their job, age, and key characteristics.
- **Goals:** What are they trying to achieve related to the problem?
- **Frustrations:** What's getting in their way?
- **A Day in Their Life:** Briefly describe a scenario where they encounter the problem.`;

    case ActionType.CREATE_USER_JOURNEY:
      return `${basePrompt}Map a high-level "Customer Journey" from discovery to advocacy. Use these stages as headings:
- **Awareness:** How does a user first learn about the solution?
- **Consideration:** What do they do to evaluate it against alternatives?
- **Conversion:** What is the key action they take to become a user?
- **Retention:** What makes them come back and use the product regularly?
- **Advocacy:** What would motivate them to tell others about it?
For each stage, list the user's key action and one opportunity for the startup to excel.`;

    case ActionType.DRAFT_PRD:
      return `${basePrompt}Draft a concise, high-level Product Requirements Document (PRD). Use these headings:
- **Objective:** What is the goal of this product/feature set?
- **Success Metrics:** How will you know you've succeeded? (List 2-3 KPIs).
- **User Stories (Epics):** List 3-5 high-level user stories in the format "As a [user], I want to [action], so that [benefit]".
- **Features Out of Scope:** What are you explicitly NOT building for the initial release? This is critical for focus.`;

    case ActionType.DEFINE_MVP:
      return `${basePrompt}Define the Minimum Viable Product (MVP) with extreme focus. Use these headings:
- **Core User Loop:** Describe the single, most important action/loop a user must complete to get value. (e.g., "Post photo -> Get feedback").
- **MVP Feature Set:** List the absolute minimum features required to enable this core loop.
- **"Not-Doing" List:** What popular but non-essential features are being intentionally excluded?
- **Success Criteria:** What is the one metric that proves the MVP is successful?`;

    case ActionType.SUGGEST_TECH_STACK:
      return `${basePrompt}Suggest a pragmatic technology stack for the MVP. Prioritize speed of development and scalability for a small team. Present this as a table with columns: 'Layer' (e.g., Frontend, Backend, Database, Deployment), 'Technology', and 'Justification & Risk'. The justification should explain why it's a good fit for this specific idea, and the risk should mention a potential drawback.`;

    case ActionType.GENERATE_PROJECT_STRUCTURE:
      return `${basePrompt}Generate a logical project folder structure for the suggested tech stack. Present it as a nested bullet point list (markdown-style tree) and provide a one-sentence explanation for each top-level directory. For example:
- \`/src\`: Main application source code.
  - \`/components\`: Reusable UI components.
  - \`/pages\`: Page-level components.`;

    case ActionType.BUILD_SOCIAL_MEDIA_CAMPAIGN:
      return `${basePrompt}Outline a "Launch Social Media Campaign" plan. Structure it with these headings:
- **Recommended Platform:** Choose the single best platform to reach the target audience and explain why.
- **Brand Voice:** Describe the tone in 3 words (e.g., "Witty, Helpful, Bold").
- **Content Pillars:** List 3 themes to consistently post about.
- **Sample Posts:** Provide one sample post for each pillar to illustrate the voice and theme.
- **Key Metric:** What is the #1 metric to track for this campaign?`;

    case ActionType.PLAN_AUDIENCE_GROWTH:
      return `${basePrompt}Create a "6-Month Audience Growth Plan". Focus on sustainable strategies. Use these headings:
- **Month 1-2 (Foundation):** Focus on one core channel (e.g., SEO-driven blog posts, building a Discord community). Outline the key activities.
- **Month 3-4 (Expansion):** How to double down on what's working and add one complementary channel.
- **Month 5-6 (Optimization):** How to analyze results and refine the strategy.
- **Engagement Flywheel:** Describe a simple loop for how you will turn new audience members into engaged fans.`;

    case ActionType.CREATE_MARKETING_STRATEGY:
      return `${basePrompt}Outline a "Go-To-Market (GTM) Strategy". Structure your response with these headings:
- **Unique Selling Proposition (USP):** What is the one thing you do better than anyone else?
- **Brand Voice:** Describe the brand's personality in 3-4 keywords.
- **Core Marketing Channel:** What is the primary channel you will use to acquire the first 100 users? Explain why.
- **Launch Message:** Write a clear, compelling message to announce the product.`;

    case ActionType.GENERATE_FUNDING_ROADMAP:
      return `${basePrompt}Generate a "Startup Funding Roadmap". Describe the first two likely funding stages. Use these headings for each stage (e.g., "Pre-Seed Round", "Seed Round"):
- **Key Goal:** What is the main objective of this funding round?
- **Milestones to Achieve:** List 3-4 concrete milestones needed to justify the round (e.g., "1,000 active users", "MVP launched").
- **Estimated Capital:** Provide a typical range for this stage.
- **Primary Use of Funds:** How will the capital be spent? (e.g., "Hire 2 engineers", "Initial marketing budget").`;

    case ActionType.DEFINE_MONETIZATION_MODEL:
      return `${basePrompt}Compare 3 potential monetization models tailored for this startup. Present this as a table with columns: 'Model' (e.g., Tiered Subscription), 'Best For...', 'Key Metric to Track', and 'Potential Challenge'. The 'Best For...' column should describe the ideal customer for that model.`;

    case ActionType.MAP_GTM_PLAN:
      return `${basePrompt}Map out a detailed "Go-To-Market (GTM) Plan" focused on the first launch. Use these headings:
- **Target Audience Segment:** Be hyper-specific about the first group of users you'll target.
- **Launch Channels:** Where will you announce and promote the product? (List 2-3 specific places, e.g., Product Hunt, a specific subreddit).
- **Launch Offer:** Is there a special offer for early adopters? (e.g., Lifetime deal, extended trial).
- **Post-Launch Goal (First 30 Days):** What is the single most important goal after launching?`;

    case ActionType.GENERATE_TODO_LIST:
      return `${basePrompt}Generate an actionable, phase-based to-do list to launch this startup. Use these headings and include 3-4 key tasks under each:
- **Phase 1: Validation & Research (Next 4 Weeks):** Tasks to confirm the problem and solution are needed.
- **Phase 2: Prototyping & MVP Build (Next 8 Weeks):** Tasks to build the core product.
- **Phase 3: Launch & Feedback (Next 4 Weeks):** Tasks to launch and gather initial user feedback.
For each task, suggest a primary owner (e.g., Founder, Dev, Marketing).`;
    default:
      return `${basePrompt}${action}`;
  }
}

const generateJSON = async (prompt: string): Promise<NodeContent> => {
    try {
        const cfg = getRuntimeConfig();
        if (cfg.provider !== 'gemini') {
            if (!cfg.apiKey) {
                return [
                    { type: 'heading', content: 'Configuration Error' },
                    { type: 'paragraph', content: 'API Key not configured.' }
                ];
            }
            const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cfg.apiKey}`,
                },
                body: JSON.stringify({
                    model: cfg.model || 'openrouter/auto',
                    messages: [{ role: 'user', content: prompt }],
                    response_format: { type: 'json_object' },
                })
            });
            const data = await resp.json();
            const text = data?.choices?.[0]?.message?.content ?? '[]';
            return JSON.parse(text) as NodeContent;
        }

        const ai = getGenAI(cfg.apiKey);
        if (!ai) {
            return [
                { type: 'heading', content: 'Configuration Error' },
                { type: 'paragraph', content: 'API Key not configured.' }
            ];
        }
        const response = await ai.models.generateContent({
            model: cfg.model || 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: textResponseSchema }
        });
        return JSON.parse(response.text.trim()) as NodeContent;
    } catch (error) {
        console.error("Error generating JSON content:", error);
        throw new Error("Failed to generate structured content from AI.");
    }
};

export async function* generateContentStream(prompt: string, schema: any): AsyncGenerator<string, void, unknown> {
    try {
        const cfg = getRuntimeConfig();
        if (cfg.provider !== 'gemini') {
            const content = await generateJSON(prompt);
            yield JSON.stringify(content);
            return;
        }
        const ai = getGenAI(cfg.apiKey);
        if (!ai) { yield '{"error": "API Key not configured."}'; return; }
        const response = await ai.models.generateContentStream({
            model: cfg.model || 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
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
    const schema = actionToSchemaMap[action] || textResponseSchema;
    return generateContentStream(prompt, schema);
};

export const generateCustomPromptContent = (parentContent: string, customPrompt: string) => {
    const prompt = `You are an expert startup consultant. Based on the following context: "${parentContent}"\n\nFulfill this request: "${customPrompt}"`;
    return generateContentStream(prompt, textResponseSchema);
}

export const generateMissingDocument = (context: string, missingAction: ActionType) => {
    const prompt = `You are a startup consultant synthesizing a business plan. You have the following context from an existing business plan:\n---\n${context}\n---\n\nBased on all the information above, generate the content for the following missing section: "${missingAction}". Make sure the new section is consistent with the provided context.`;
    const schema = actionToSchemaMap[missingAction] || textResponseSchema;
    return generateContentStream(prompt, schema);
};

export const getBlueprintCritique = (context: string): Promise<NodeContent> => {
    const prompt = `You are an expert startup strategist. Analyze the following startup blueprint and provide a high-level critique. Identify potential gaps, logical inconsistencies, and risks. Finally, suggest 2-3 actionable next steps.
    ---
    ${context}
    ---
    Structure your response with clear headings for "Critique", "Identified Gaps", and "Suggested Next Steps".`;
    return generateJSON(prompt);
};