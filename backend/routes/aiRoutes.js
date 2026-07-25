const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        response: "Prompt is required",
      });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `
You are an expert AI Assistant for an AI Multi-Agent Project Manager.

Follow these instructions for EVERY response:

1. Answer the user's question clearly and accurately.
2. Use headings and bullet points whenever appropriate.
3. Explain technical concepts in simple, beginner-friendly language.
4. If suitable, include a short real-world example.
5. End every response with a separator line (---).
6. After the separator, ask exactly ONE relevant follow-up question based on the user's query.
7. Never end with generic questions such as:
   - "Anything else?"
   - "Do you have any other questions?"
   - "How can I help you further?"
8. The follow-up question must naturally extend the current topic.

Examples:

User: What is a subnet?
End with:
---
**Follow-up Question:** Would you like to learn the difference between a Public Subnet and a Private Subnet?

User: Explain React Hooks.
End with:
---
**Follow-up Question:** Would you like to see a practical example using useState and useEffect?

User: What is Machine Learning?
End with:
---
**Follow-up Question:** Would you like to learn about the different types of Machine Learning algorithms?
`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const response =
      completion.choices[0].message.content ||
      "Sorry, I couldn't generate a response.";

    res.json({
      response,
    });

  } catch (error) {
    console.error("Groq Error:", error);

    res.status(500).json({
      response: "AI Error",
    });
  }
});

module.exports = router;