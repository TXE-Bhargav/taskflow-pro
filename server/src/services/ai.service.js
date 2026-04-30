// ai.service.js — Powered by Groq (Free, Fast, Works in India!)
// Groq runs Llama 3.3 70B at 300+ tokens/second — completely free

const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ─── HELPER: Call Groq ────────────────────────────────────────
const callGroq = async (systemPrompt, userMessage) => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });
  return response.choices[0].message.content;
};

// ─── FEATURE 1: Smart Task Breakdown ─────────────────────────
const breakdownTask = async (goal, projectContext = '') => {

  const system = `You are a professional project manager AI assistant.
Break down goals into clear actionable subtasks.
Always respond with valid JSON only. No explanation, no markdown, just raw JSON.`;

  const user = `
Break down this goal into 4-6 subtasks:
Goal: "${goal}"
${projectContext ? `Project context: ${projectContext}` : ''}

Respond with exactly this JSON:
{
  "subtasks": [
    {
      "title": "Specific actionable task title",
      "description": "Clear description of what needs to be done",
      "priority": "LOW | MEDIUM | HIGH | URGENT",
      "estimatedDays": 2
    }
  ]
}`;

  const raw = await callGroq(system, user);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

// ─── FEATURE 2: Auto Prioritize Tasks ────────────────────────
const prioritizeTasks = async (tasks) => {

  const taskList = tasks.map((t, i) =>
    `${i + 1}. "${t.title}" - Priority: ${t.priority}, Due: ${t.dueDate || 'No deadline'}`
  ).join('\n');

  const system = `You are a productivity expert AI.
Analyze tasks and prioritize by urgency and importance.
Respond with valid JSON only. No markdown, no explanation.`;

  const user = `
Prioritize these tasks:
${taskList}

Respond with exactly this JSON:
{
  "prioritized": [
    {
      "originalTitle": "exact task title",
      "suggestedPriority": "LOW | MEDIUM | HIGH | URGENT",
      "reason": "One sentence why",
      "suggestedOrder": 1
    }
  ],
  "summary": "One sentence overall recommendation"
}`;

  const raw = await callGroq(system, user);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

// ─── FEATURE 3: Due Date Suggestion ──────────────────────────
const suggestDueDate = async (taskTitle, taskDescription, teamSize = 1) => {

  const system = `You are a project planning expert.
Estimate realistic deadlines based on task complexity.
Respond with valid JSON only. No markdown, no explanation.`;

  const user = `
Suggest a due date for:
Title: "${taskTitle}"
Description: "${taskDescription || 'No description'}"
Team size: ${teamSize}
Today: ${new Date().toISOString().split('T')[0]}

Respond with exactly this JSON:
{
  "suggestedDays": 3,
  "suggestedDate": "YYYY-MM-DD",
  "confidence": "low | medium | high",
  "reasoning": "One sentence explanation",
  "breakdown": [
    { "phase": "Planning", "days": 1 },
    { "phase": "Execution", "days": 2 }
  ]
}`;

  const raw = await callGroq(system, user);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

// ─── FEATURE 4: Daily Standup Generator ──────────────────────
const generateStandup = async (userName, completedTasks, inProgressTasks, blockedTasks = []) => {

  const system = `You are a professional technical writer.
Generate concise daily standup updates.
Respond with valid JSON only. No markdown, no explanation.`;

  const user = `
Generate standup for ${userName}:

Completed: ${completedTasks.length ? completedTasks.map(t => t.title).join(', ') : 'Nothing'}
In progress: ${inProgressTasks.length ? inProgressTasks.map(t => t.title).join(', ') : 'Nothing'}
Blockers: ${blockedTasks.length ? blockedTasks.map(t => t.title).join(', ') : 'None'}

Respond with exactly this JSON:
{
  "standup": {
    "yesterday": "What was accomplished in 1-2 sentences",
    "today": "What will be worked on in 1-2 sentences",
    "blockers": "Blockers or No blockers today",
    "fullText": "Complete standup message ready to paste in Slack"
  }
}`;

  const raw = await callGroq(system, user);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

// ─── FEATURE 5: Improve Task Description ─────────────────────
const improveDescription = async (title, roughDescription) => {

  const system = `You are a technical project manager.
Transform rough descriptions into clear professional ones.
Respond with valid JSON only. No markdown, no explanation.`;

  const user = `
Improve this task description:
Title: "${title}"
Rough description: "${roughDescription || 'No description'}"

Respond with exactly this JSON:
{
  "improved": {
    "description": "Professional 2-3 sentence description",
    "acceptanceCriteria": [
      "Measurable criteria 1",
      "Measurable criteria 2",
      "Measurable criteria 3"
    ],
    "technicalNotes": "Technical considerations or empty string"
  }
}`;

  const raw = await callGroq(system, user);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

const suggestWorkspace = async (rawIdea) => {
  const prompt = `
You are a product naming expert.
Based on this raw idea, suggest a workspace name, description, and 5 initial projects.
Respond with valid JSON only. No markdown, no explanation.

Raw idea: "${rawIdea}"

Respond with exactly this JSON:
{
  "name": "Short workspace name (2-4 words)",
  "description": "One sentence describing the workspace purpose",
  "suggestedProjects": [
    { "name": "Project name", "description": "One sentence" }
  ]
}`;
  const raw = await callGroq(prompt, prompt);
  const cleaned = raw.replace(/\`\`\`json|\`\`\`/g, '').trim();
  return JSON.parse(cleaned);
};

const suggestProject = async (rawIdea, workspaceName) => {
  const prompt = `
You are a project management expert.
Based on this raw idea, suggest a project name, description, and 5 initial tasks.
Respond with valid JSON only. No markdown, no explanation.

Workspace: "${workspaceName}"
Raw idea: "${rawIdea}"

Respond with exactly this JSON:
{
  "name": "Short project name",
  "description": "One sentence describing the project",
  "suggestedTasks": [
    {
      "title": "Task title",
      "priority": "LOW | MEDIUM | HIGH | URGENT"
    }
  ]
}`;
  const raw = await callGroq(prompt, prompt);
  const cleaned = raw.replace(/\`\`\`json|\`\`\`/g, '').trim();
  return JSON.parse(cleaned);
};

module.exports = {
  breakdownTask,
  prioritizeTasks,
  suggestDueDate,
  generateStandup,
  improveDescription,
  suggestWorkspace,
  suggestProject
};