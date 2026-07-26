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
You are a Retrieval-Augmented AI Assistant.

Rules:

- Answer ONLY using the provided PDF context.
- Never invent information.
- Never use outside knowledge.
- If the answer is missing, say:
"I couldn't find the answer in the uploaded PDF."

If the answer exists:
- Explain clearly.
- Use headings.
- Use bullet points.
- Use examples from the PDF whenever possible.
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
PDF Context:

${context}

Question:

${question}
`
  });

  const response = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages
  });

  return response.choices[0].message.content;
}

async function suggestQuestions(context, question) {

  const response = await groq.chat.completions.create({

    model: MODEL,

    temperature: 0.4,

    response_format: {
      type: "json_object"
    },

    messages: [
      {
        role: "system",
        content:
          "Generate 6 follow-up questions from the PDF context."
      },
      {
        role: "user",
        content: `
Context:

${context}

Question:

${question}

Return JSON:

{
 "questions":[
   "...",
   "...",
   "...",
   "...",
   "...",
   "..."
 ]
}
`
      }
    ]
  });

  try {

    const json = JSON.parse(
      response.choices[0].message.content
    );

    return json.questions || [];

  } catch {

    return [];

  }

}

module.exports = {
  askLLM,
  suggestQuestions
};