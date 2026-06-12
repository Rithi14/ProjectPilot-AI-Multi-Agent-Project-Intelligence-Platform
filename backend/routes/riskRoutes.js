const express = require("express");
const Groq = require("groq-sdk");
const db = require("../config/db");

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/* ========================================= */
/* AI RISK ANALYSIS */
/* ========================================= */

router.post("/analyze-risk", async (req, res) => {

  console.log("Risk Route Hit");

  try {

    const {
      title,
      description,
      deadline
    } = req.body;

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        messages: [

          {
            role: "system",
            content:
              "You are an expert software project risk analyst. Always return valid JSON only."
          },

          {
            role: "user",
            content: `
Project Title:
${title}

Project Description:
${description}

Deadline:
${deadline}

Analyze project risk.

Return ONLY valid JSON.

{
  "risk_score": 75,
  "risk_level": "High",
  "analysis": "Project may face deadline risk because of complexity."
}
`
          }

        ],

        temperature: 0.3

      });

    const response =
      completion.choices[0].message.content;

    console.log("AI Response:");
    console.log(response);

    const cleanResponse = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const riskData =
      JSON.parse(cleanResponse);

    res.json(riskData);

  } catch (error) {

    console.log(
      "RISK ANALYSIS ERROR:",
      error
    );

    res.status(500).json({

      risk_score: 0,

      risk_level: "Unknown",

      analysis:
        "Risk analysis failed."

    });

  }

});

/* ========================================= */
/* SAVE RISK TO DATABASE */
/* ========================================= */

router.put("/save-risk/:id", (req, res) => {

  const { id } = req.params;

 const {
  risk_score,
  risk_level,
  analysis
} = req.body;

const finalAnalysis =
  typeof analysis === "object"
    ? JSON.stringify(analysis)
    : analysis;

  const sql = `
    UPDATE projects
    SET
      risk_score = ?,
      risk_level = ?,
      risk_analysis = ?
    WHERE id = ?
  `;

  db.query(

    sql,

    [
      risk_score,
      risk_level,
      finalAnalysis,
      id
    ],

    (err, result) => {

      if (err) {

        console.log(err);

        return res.status(500).json({
          message: "Risk Save Failed"
        });

      }

      res.json({
        success: true,
        message: "Risk Saved Successfully"
      });

    }

  );

});

module.exports = router;