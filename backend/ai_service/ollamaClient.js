const axios = require("axios");

async function askLLM(question, context, history = []) {

  const historyText = history
    .slice(-3) // keep last 3 turns for context, avoid prompt bloat
    .map(h => `Q: ${h.question}\nA: ${h.answer}`)
    .join("\n\n");

  const prompt = `
You are an AI assistant answering questions about an uploaded PDF.

You must answer ONLY using the given context. Do NOT use outside knowledge.

If the answer is not present in the context, reply:
"I couldn't find the answer in the uploaded PDF."

${historyText ? `Previous conversation (for continuity only, don't repeat it):\n${historyText}\n` : ""}

Context:
${context}

Question:
${question}

Instructions:
1. Give a detailed explanation.
2. Use bullet points whenever appropriate.
3. Explain in simple English.
4. If this question follows up on the previous conversation, keep your answer consistent with it.
`;

  const response = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3.2",
    prompt,
    stream: false
  });

  return response.data.response.trim();
}

async function suggestQuestions(context, question) {

  const prompt = `
You are reading a PDF.

Context:
${context}

The user just asked: "${question}"

Generate 6 meaningful follow-up questions that dig deeper into this same topic, based only on the context above.

Rules:
- Questions must come only from the context.
- Do NOT repeat the question the user just asked.
- Do NOT answer them.
- Return ONLY a JSON array of 6 strings, nothing else.

Example:
["Question 1","Question 2","Question 3","Question 4","Question 5","Question 6"]
`;

  const response = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3.2",
    prompt,
    stream: false
  });

  try {
    const match = response.data.response.match(/\[[\s\S]*\]/); // guard against stray text
    return match ? JSON.parse(match[0]) : [];
  } catch (err) {
    return [];
  }
}

module.exports = {
  askLLM,
  suggestQuestions
};