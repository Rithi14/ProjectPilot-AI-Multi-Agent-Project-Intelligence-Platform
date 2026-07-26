const axios = require("axios");

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "llama3.2";

async function askLLM(question, context, history = []) {

  const historyText = history
    .slice(-5)
    .map(item => `User: ${item.question}\nAssistant: ${item.answer}`)
    .join("\n\n");

  const prompt = `
You are a Retrieval Augmented Generation (RAG) assistant.

IMPORTANT RULES

1. Answer ONLY using the provided PDF context.
2. NEVER use your own knowledge.
3. NEVER guess.
4. NEVER invent information.
5. If the answer is not completely present inside the context, reply EXACTLY:

I couldn't find the answer in the uploaded PDF.

6. If the context contains the answer, explain it in detail.

Conversation History:
${historyText}

=========================
PDF CONTEXT
=========================
${context}

=========================
USER QUESTION
=========================
${question}

Provide:

- A detailed explanation
- Bullet points where appropriate
- Simple English
- Do not mention outside knowledge
`;

  const response = await axios.post(OLLAMA_URL, {
    model: MODEL,
    prompt,
    stream: false
  });

  return response.data.response.trim();
}

async function suggestQuestions(context, question) {

  const prompt = `
You are reading an uploaded PDF.

Context:
${context}

Current Question:
${question}

Generate 6 follow-up questions.

Rules:

- They MUST come only from the PDF context.
- They must be related to the user's question.
- Do not repeat the current question.
- Do not answer them.
- Return ONLY a JSON array.

Example:

[
"What is Artificial Intelligence?",
"What are the types of AI?",
"How does Machine Learning work?",
"What are AI applications?",
"What are the advantages of AI?",
"What are AI limitations?"
]
`;

  const response = await axios.post(OLLAMA_URL, {
    model: MODEL,
    prompt,
    stream: false
  });

  try {

    const output = response.data.response.trim();

    const match = output.match(/\[[\s\S]*\]/);

    if (!match) return [];

    return JSON.parse(match[0]);

  } catch (err) {

    console.log("Suggestion Error:", err.message);

    return [];

  }

}

module.exports = {
  askLLM,
  suggestQuestions
};