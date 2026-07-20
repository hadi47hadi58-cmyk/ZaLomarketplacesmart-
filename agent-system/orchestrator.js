import 'dotenv/config';
import { askAgent } from './agents.js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Orchestrator Agent
 * Breaks down the main task and coordinates the specialized agents.
 */
async function orchestrateTask(userTask) {
  console.log(`[Orchestrator] Received new task: "${userTask}"\n`);
  
  const results = {};

  // 1. Planning Phase
  console.log('--- Phase 1: Planning ---');
  results.productOwner = await askAgent('productOwner', `Task: ${userTask}\nPlease provide requirements and acceptance criteria.`);
  console.log(`\n👨‍💼 Product Owner:\n${results.productOwner}\n`);
  
  results.architect = await askAgent('architect', `Task: ${userTask}\nProduct Owner Specs:\n${results.productOwner}\nPlease provide technical architecture.`);
  console.log(`\n🏗️ Architect:\n${results.architect}\n`);

  // 2. Execution Phase
  console.log('--- Phase 2: Execution ---');
  const devContext = `Task: ${userTask}\nArchitecture:\n${results.architect}`;
  
  results.backendDev = await askAgent('backendDev', `${devContext}\nPlease provide the backend code and Supabase policies.`);
  console.log(`\n⚙️ Backend Developer:\n${results.backendDev}\n`);
  
  results.frontendDev = await askAgent('frontendDev', `${devContext}\nBackend Code:\n${results.backendDev}\nPlease provide the frontend UI code.`);
  console.log(`\n🎨 Frontend Developer:\n${results.frontendDev}\n`);

  // 3. Review Phase
  console.log('--- Phase 3: Review & Security ---');
  const reviewContext = `Task: ${userTask}\nBackend Code:\n${results.backendDev}\nFrontend Code:\n${results.frontendDev}`;
  
  results.qaEngineer = await askAgent('qaEngineer', `${reviewContext}\nPlease review for bugs and edge cases.`);
  console.log(`\n🕵️ QA Engineer:\n${results.qaEngineer}\n`);
  
  results.securityReviewer = await askAgent('securityReviewer', `${reviewContext}\nPlease review for security vulnerabilities.`);
  console.log(`\n🛡️ Security Reviewer:\n${results.securityReviewer}\n`);

  // 4. Final Synthesis
  console.log('--- Phase 4: Final Synthesis ---');
  const summaryPrompt = `
    You are the Orchestrator Manager. 
    Summarize the findings of your team into a cohesive final delivery package for the user.
    
    Task: ${userTask}
    Backend: ${results.backendDev}
    Frontend: ${results.frontendDev}
    QA Notes: ${results.qaEngineer}
    Security Notes: ${results.securityReviewer}
  `;

  const finalResponse = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: summaryPrompt,
    config: {
      systemInstruction: 'You are the Orchestrator. Provide a clear, structured summary of the work done by your team.',
      temperature: 0.3,
    }
  });

  console.log(`\n👑 Orchestrator Final Report:\n${finalResponse.text}\n`);
  return finalResponse.text;
}

// Example Execution (Run this via: node orchestrator.js)
const task = process.argv[2] || "Add an employee management dashboard with roles and permissions";
orchestrateTask(task).catch(console.error);
