const express = require("express");
const { searchChunks } = require("../rag/search");
const { askLLM, suggestQuestions } = require("../ai_service/ollamaClient");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("RAG Route Working");
});

router.post("/ask", async (req, res) => {
  try {
    const { question, history } = req.body;
    // history: [{ question: "...", answer: "..." }, ...]  — sent back by the client each turn

    if (!question) {
      return res.status(400).json({
        success: false,
        answer: "Question is required"
      });
    }

    const safeHistory = Array.isArray(history) ? history : [];

    const bestChunk = await searchChunks(question);

    if (!bestChunk) {
      return res.json({
        success: true,
        answer: "No relevant information found in the uploaded PDF.",
        suggestions: [],
        history: safeHistory
      });
    }

    const finalAnswer = await askLLM(question, bestChunk, safeHistory);
    const suggestions = await suggestQuestions(bestChunk, question);

    const updatedHistory = [
      ...safeHistory,
      { question, answer: finalAnswer }
    ];

    return res.json({
      success: true,
      answer: finalAnswer,
      suggestions,
      history: updatedHistory
    });

  } catch (error) {
    console.error("RAG Error:", error);
    return res.status(500).json({
      success: false,
      answer: "RAG Failed",
      suggestions: []
    });
  }
});

module.exports = router;