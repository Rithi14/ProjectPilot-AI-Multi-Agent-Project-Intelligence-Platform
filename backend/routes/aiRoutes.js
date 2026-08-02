const express = require("express");
const chatModel = require("../models/chatModel");

const {
  askNormalAI,
  suggestNormalQuestions
} = require("../ai_service/ollamaClient");

const router = express.Router();


/* ===================================================
   TEST ROUTE
=================================================== */

router.get("/", (req, res) => {

  res.send("✅ AI Chat Route Working");

});


/* ===================================================
   NORMAL AI CHAT
=================================================== */

router.post("/chat", async (req, res) => {

  try {

    const {
  chatId,
  prompt,
  history = []
} = req.body;


    /* -----------------------------------------------
       VALIDATION
    ------------------------------------------------ */

    if (!prompt || prompt.trim() === "") {

      return res.status(400).json({

        success: false,

        response: "Prompt is required.",

        suggestions: [],

        history: []

      });

    }


    /* -----------------------------------------------
       ASK NORMAL AI
    ------------------------------------------------ */
    if (chatId) {
  await chatModel.saveMessage(
    chatId,
    "user",
    prompt
  );
}
    const answer =
      await askNormalAI(
        prompt,
        history
      );
    if (chatId) {
  await chatModel.saveMessage(
    chatId,
    "assistant",
    answer
  );
}


    /* -----------------------------------------------
       GENERATE SUGGESTIONS
    ------------------------------------------------ */

    const suggestions =
      await suggestNormalQuestions(
        prompt,
        answer
      );


    /* -----------------------------------------------
       UPDATE HISTORY
    ------------------------------------------------ */

    const updatedHistory = [

      ...history,

      {

        question: prompt,

        answer

      }

    ];


    /* -----------------------------------------------
       RESPONSE
    ------------------------------------------------ */

    return res.json({

      success: true,

      response: answer,

      suggestions,

      history: updatedHistory

    });

  }


  catch (error) {

    console.error(
      "========== AI CHAT ERROR =========="
    );

    console.error(error);

    console.error(
      "==================================="
    );


    return res.status(500).json({

      success: false,

      response: "AI Error: " + error.message,

      suggestions: [],

      history: []

    });

  }

});


module.exports = router;