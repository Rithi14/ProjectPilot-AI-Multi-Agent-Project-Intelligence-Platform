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

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
      });

    res.json({
      response:
        completion.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      response: "AI Error",
    });
  }
});

module.exports = router;