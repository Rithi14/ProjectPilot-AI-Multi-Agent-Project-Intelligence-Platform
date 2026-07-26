const express = require("express");
const { searchChunks } = require("../rag/search");
const {
  askLLM,
  suggestQuestions,
} = require("../ai_service/ollamaClient");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("✅ RAG Route Working");
});

router.post("/ask", async (req, res) => {
  try {
    const { question, history = [] } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({
        success: false,
        answer: "Question is required.",
        suggestions: [],
        history: [],
      });
    }

    // Search relevant PDF chunks
    const context = await searchChunks(question);

    if (!context || context.trim() === "") {
      return res.json({
        success: true,
        answer: "I couldn't find the answer in the uploaded PDF.",
        suggestions: [],
        history,
      });
    }

    // Ask LLM
    const answer = await askLLM(question, context, history);

    // Suggested questions
    const suggestions = await suggestQuestions(context, question);

    // Update history
    const updatedHistory = [
      ...history,
      {
        question,
        answer,
      },
    ];

    return res.json({
      success: true,
      answer,
      suggestions,
      history: updatedHistory,
    });

  } catch (error) {

    console.error("========== RAG ERROR ==========");
    console.error(error);
    console.error("===============================");

    return res.status(500).json({
      success: false,
      answer: error.message,
      suggestions: [],
      history: [],
    });

  }
});

module.exports = router;