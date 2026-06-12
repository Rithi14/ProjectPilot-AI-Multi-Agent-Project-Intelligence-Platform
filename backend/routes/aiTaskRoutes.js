const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

router.post("/generate-tasks", async (req, res) => {

  try {

    const { title, description } = req.body;

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "system",
            content:
              "You are an expert software project manager."
          },
          {
            role: "user",
            content: `
Project Title:
${title}

Description:
${description}

Generate 8 software development tasks.

Return ONLY JSON.

Example:

[
 {
   "task_name":"Requirement Analysis",
   "priority":"High"
 }
]
`
          }
        ]
      });

    const response =
      completion.choices[0].message.content;

    res.json({
      tasks: response
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message:
        "AI Task Generation Failed"
    });

  }

});

module.exports = router;