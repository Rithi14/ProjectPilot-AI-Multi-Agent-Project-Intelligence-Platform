const express = require("express");
const { searchChunks } = require("../rag/search");
const {
  askLLM,
  suggestQuestions
} = require("../ai_service/ollamaClient");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("RAG Route Working");
});

router.post("/ask", async (req, res) => {
  try {
    const { question, history } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({
        success: false,
        answer: "Question is required",
        suggestions: []
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
      : [];

    // Retrieve relevant chunks from PDF
    const context = await searchChunks(question);

    if (!context || context.trim().length === 0) {
      return res.json({
        success: true,
        answer: "No relevant information found in the uploaded PDF.",
        suggestions: [],
        history: safeHistory
      });
    }

    // Generate answer
    const finalAnswer = await askLLM(
      question,
      context,
      safeHistory
    );

    // Generate follow-up questions
    const suggestions = await suggestQuestions(
      context,
      question
    );

    // Save conversation
    const updatedHistory = [
      ...safeHistory,
      {
        question,
        answer: finalAnswer
      }
    ];

    res.json({
      success: true,
      answer: finalAnswer,
      suggestions,
      history: updatedHistory
    });

  } catch (error) {

    console.error("RAG Error:", error);

    res.status(500).json({
      success: false,
      answer: "RAG Failed",
      suggestions: []
    });

  }
});

module.exports = router;