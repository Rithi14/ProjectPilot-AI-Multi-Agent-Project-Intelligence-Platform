const express = require("express");

const {
  searchChunks
} = require("../rag/search");

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

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        answer: "Question is required"
      });
    }

    // Search relevant chunk from PDF
    const bestChunk = await searchChunks(question);

    if (!bestChunk) {
      return res.json({
        success: true,
        answer: "No relevant information found in the uploaded PDF.",
        suggestions: []
      });
    }

    // Generate detailed answer
    const finalAnswer = await askLLM(
      question,
      bestChunk
    );

    // Generate suggested questions
    const suggestions = await suggestQuestions(
      bestChunk
    );

    // Send response
    return res.json({
      success: true,
      answer: finalAnswer,
      suggestions: suggestions
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