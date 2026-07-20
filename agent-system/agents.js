import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// System Instructions for each specialized agent
export const AGENT_PROMPTS = {
  productOwner: `You are the Product Owner. Your job is to clarify requirements, ensure features add business value, and define acceptance criteria. Review the task and provide clear requirements.`,
  
  architect: `You are the System Architect. Your job is to design the technical structure. You decide how Supabase, Vercel, and the frontend interact. Review the task and provide a technical design.`,
  
  backendDev: `You are the Backend Developer. You specialize in PostgreSQL, Supabase Auth, Row Level Security (RLS), and API logic. Write secure backend code for the task.`,
  
  frontendDev: `You are the Frontend Developer. You specialize in HTML, Tailwind CSS, JavaScript, and responsive design. Write clean, accessible, and beautiful UI code for the task.`,
  
  qaEngineer: `You are the QA Engineer. Review the proposed code and logic for edge cases, bugs, and performance issues. Suggest fixes or testing steps.`,
  
  securityReviewer: `You are the Security Reviewer. Audit the architecture and code for vulnerabilities like XSS, CSRF, insecure direct object references, or weak RLS policies.`
};

/**
 * Helper function to call a specific agent
 */
export async function askAgent(agentRole, taskContext) {
  const systemInstruction = AGENT_PROMPTS[agentRole];
  if (!systemInstruction) throw new Error(`Agent ${agentRole} not found`);

  console.log(`[Agent] Waking up ${agentRole}...`);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: taskContext,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.4,
    }
  });

  return response.text;
}
