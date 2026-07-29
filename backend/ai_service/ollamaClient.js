require("dotenv").config();

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODEL = process.env.MODEL || "llama-3.3-70b-versatile";

/* ===================================================
   RAG - ASK LLM
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
- Do NOT ask follow-up questions
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
   RAG - SUGGEST QUESTIONS
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
            content: `
Generate exactly 6 useful questions.

Rules:
- Questions must be based ONLY on the provided PDF.
- Questions should be directly related to the user's current question.
- Do not provide answers.
- Return ONLY valid JSON.
`
          },

          {
            role: "user",
            content: `
Context:

${context}

Current Question:

${question}

Return ONLY JSON:

{
  "questions": [
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

    return Array.isArray(json.questions)
      ? json.questions
      : [];

  }

  catch (err) {

    console.log("RAG Suggestion Error:", err.message);

    return [];

  }

}


/* ===================================================
   NORMAL AI - ASK LLM
=================================================== */

async function askNormalAI(question, history = []) {

  const messages = [

    {
      role: "system",

      content: `
You are an expert AI Assistant for an AI Multi-Agent Project Manager.

Rules:

1. Answer the user's question clearly and accurately.
2. Use Markdown formatting.
3. Use headings and bullet points whenever appropriate.
4. Explain technical concepts in simple, beginner-friendly language.
5. Give a short real-world example when useful.
6. Do not invent information.
7. Do not ask follow-up questions.
8. Do not end your answer with a question.
9. Do not include "Follow-up Question".
10. Give only the answer to the user's question.
`
    }

  ];


  // Add previous conversation
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


  // Current question
  messages.push({

    role: "user",

    content: question

  });


  const response =
    await groq.chat.completions.create({

      model: MODEL,

      temperature: 0.7,

      max_tokens: 1024,

      messages

    });


  return (
    response.choices?.[0]?.message?.content ||
    "Sorry, I couldn't generate a response."
  ).trim();

}


/* ===================================================
   NORMAL AI - SUGGEST QUESTIONS
=================================================== */

async function suggestNormalQuestions(question, answer) {

  try {

    const response =
      await groq.chat.completions.create({

        model: MODEL,

        temperature: 0.5,

        response_format: {
          type: "json_object"
        },

        messages: [

          {
            role: "system",

            content: `
You generate useful suggested questions for an AI Assistant.

Rules:

- Generate exactly 6 questions.
- Questions must be related to the user's current question and answer.
- Questions should help the user learn more about the same topic.
- Questions should be short and clear.
- Do not generate questions like:
  "Anything else?"
  "How can I help?"
  "Do you have any other questions?"
- Do not answer the questions.
- Return ONLY valid JSON.
`
          },

          {

            role: "user",

            content: `
Current User Question:

${question}

AI Answer:

${answer}

Generate 6 related questions.

Return ONLY:

{
  "questions": [
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


    return Array.isArray(json.questions)
      ? json.questions
      : [];

  }

  catch (err) {

    console.log(
      "Normal AI Suggestion Error:",
      err.message
    );

    return [];

  }

}


/* ===================================================
   EXPORTS
=================================================== */

module.exports = {

  askLLM,

  suggestQuestions,

  askNormalAI,

  suggestNormalQuestions

};