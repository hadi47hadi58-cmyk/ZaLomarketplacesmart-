import 'dotenv/config';
import { askAgent } from './agents.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Orchestrator Agent
 * Breaks down the main task and coordinates the specialized agents.
 */
async function orchestrateTask(userTask) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY environment variable is not set.");
    process.exit(1);
  }

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

  // 4. File Writing Phase (New feature for automatic saving)
  console.log('--- Phase 4: Automated File Writing ---');
  const fileWriterPrompt = `
    Based on the following code and architecture from the team, generate the exact files that need to be created or updated.
    
    Backend Code: ${results.backendDev}
    Frontend Code: ${results.frontendDev}
    
    You MUST respond with ONLY a valid JSON array of objects. No markdown formatting, no backticks, no explanations.
    Format:
    [
      {
        "path": "web/new-page.html",
        "content": "<html>...</html>"
      },
      {
        "path": "web/js/new-script.js",
        "content": "..."
      }
    ]
    
    Paths should be relative to the root directory (e.g., web/... or backend/...).
  `;
  
  const modelFile = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    systemInstruction: 'You are an automated file writer. You output ONLY pure JSON. Never use markdown code blocks like ```json',
  });

  try {
    const fileResponse = await modelFile.generateContent(fileWriterPrompt);
    let jsonString = fileResponse.response.text().trim();
    
    // Clean up potential markdown formatting if the AI still adds it
    if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7);
    if (jsonString.startsWith('```')) jsonString = jsonString.slice(3);
    if (jsonString.endsWith('```')) jsonString = jsonString.slice(0, -3);
    
    const filesToCreate = JSON.parse(jsonString.trim());
    
    for (const file of filesToCreate) {
      // Resolve path relative to the root of the project (parent of agent-system)
      const fullPath = path.resolve(process.cwd(), '..', file.path);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, file.content, 'utf8');
      console.log(`✅ Automatically wrote file: ${file.path}`);
    }
  } catch (error) {
    console.error("⚠️ Failed to parse or write files automatically:", error);
  }

  // 5. Final Synthesis
  console.log('--- Phase 5: Final Synthesis ---');
  const summaryPrompt = `
    You are the Orchestrator Manager. 
    Summarize the findings of your team into a cohesive final delivery package for the user.
    
    Task: ${userTask}
    QA Notes: ${results.qaEngineer}
    Security Notes: ${results.securityReviewer}
  `;

  const modelSummary = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    systemInstruction: 'You are the Orchestrator. Provide a clear, structured summary of the work done by your team.',
  });

  const finalResponse = await modelSummary.generateContent(summaryPrompt);

  console.log(`\n👑 Orchestrator Final Report:\n${finalResponse.response.text()}\n`);
  return finalResponse.response.text();
}

// Example Execution (Run this via: node orchestrator.js)
const task = process.argv[2] || "Add a test file to the project";
orchestrateTask(task).catch(console.error);
