const axios = require("axios");

// ------------------------------
// Generate Detailed Answer
// ------------------------------
async function askLLM(question, context) {

  const prompt = `
You are an AI assistant.

You must answer ONLY using the given context.

If the answer is not present in the context, reply:

"I couldn't find the answer in the uploaded PDF."

Context:
${context}

Question:
${question}

Instructions:

1. Give a detailed explanation.
2. Use bullet points whenever appropriate.
3. Explain in simple English.
4. Do NOT use outside knowledge.
`;

  const response = await axios.post(
    "http://localhost:11434/api/generate",
    {
      model: "llama3.2",
      prompt,
      stream: false
    }
  );

  return response.data.response.trim();
}

// ------------------------------
// Generate Suggested Questions
// ------------------------------
async function suggestQuestions(context) {

  const prompt = `
You are reading a PDF.

Context:
${context}

Generate 6 meaningful follow-up questions that are directly related to this content.

Rules:

- Questions must come only from the context.
- Do NOT answer them.
- Return ONLY a JSON array.

Example:

[
  "Question 1",
  "Question 2",
  "Question 3",
  "Question 4",
  "Question 5",
  "Question 6"
]
`;

  const response = await axios.post(
    "http://localhost:11434/api/generate",
    {
      model: "llama3.2",
      prompt,
      stream: false
    }
  );

  try {

    return JSON.parse(response.data.response);

  } catch (err) {

    return [];

  }

}

module.exports = {
  askLLM,
  suggestQuestions
};