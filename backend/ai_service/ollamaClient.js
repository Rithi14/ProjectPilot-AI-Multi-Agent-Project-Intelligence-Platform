require("dotenv").config();

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODEL = process.env.MODEL || "llama-3.3-70b-versatile";

async function askLLM(question, context, history = []) {

  const messages = [
    {
      role: "system",
      content: `
You are an intelligent Retrieval-Augmented AI Assistant.

Your job is to answer ONLY from the uploaded PDF.

==========================
RULES
==========================

1. Use ONLY the PDF context.
2. Never use outside knowledge.
3. Never guess.
4. Never invent facts.
5. If the answer is missing, reply EXACTLY:

I couldn't find the answer in the uploaded PDF.

6. If the answer exists:

• Answer in Markdown.
• Use headings.
• Use bullet points.
• Use numbered lists where appropriate.
• Highlight important words using **bold**.
• Explain in simple English.
• Give examples ONLY if they appear in the PDF.
• Keep the answer well structured.
• Do not mention "According to the context" or "Based on the PDF."
• Answer naturally like ChatGPT.

7. If the user asks a follow-up question, use the previous conversation only for continuity.
Never use previous answers as knowledge.
`
    }
  ];

  history.slice(-10).forEach(chat => {

    messages.push({
      role: "user",
      content: chat.question
    });

    messages.push({
      role: "assistant",
      content: chat.answer
    });

  });

  messages.push({
    role: "user",
    content: `
==========================
PDF CONTEXT
==========================

${context}

==========================
QUESTION
==========================

${question}
`
  });

  const response = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    messages
  });

  return response.choices[0].message.content.trim();
}