require("dotenv").config();

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODEL = process.env.MODEL || "llama-3.3-70b-versatile";

/* ===================================================
   ASK LLM
=================================================== */

async function askLLM(question, context, history = []) {

  const messages = [
    {
      role: "system",
      content: `
You are an intelligent Retrieval-Augmented AI Assistant.

Rules:

- Answer ONLY using the uploaded PDF.
- Never use outside knowledge.
- Never invent information.
- If the answer is missing reply exactly:

I couldn't find the answer in the uploaded PDF.

If the answer exists:

- Use Markdown
- Use headings
- Use bullet points
- Highlight important words
- Explain clearly
- Give examples only if found in the PDF
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

  const response =
    await groq.chat.completions.create({

      model: MODEL,

      temperature: 0.2,

      messages

    });

  return response.choices[0].message.content.trim();

}

/* ===================================================
   FOLLOW-UP QUESTIONS
=================================================== */

async function suggestQuestions(context, question) {

  try {

    const response =
      await groq.chat.completions.create({

        model: MODEL,

        temperature: 0.4,

        response_format: {
          type: "json_object"
        },

        messages: [

          {
            role: "system",
            content:
              "Generate exactly 6 follow-up questions based ONLY on the PDF."
          },

          {
            role: "user",
            content: `
Context:

${context}

Question:

${question}

Return ONLY JSON.

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

    const json = JSON.parse(
      response.choices[0].message.content
    );

    return json.questions || [];

  }

  catch (err) {

    console.log("Suggestion Error:", err.message);

    return [];

  }

}

/* ===================================================
   EXPORTS
=================================================== */

module.exports = {

  askLLM,

  suggestQuestions

};