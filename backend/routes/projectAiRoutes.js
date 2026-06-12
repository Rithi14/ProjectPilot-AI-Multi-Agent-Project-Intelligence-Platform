const express = require("express")
const router = express.Router()

const db =
require("../config/db")

const {
  askLLM
} = require("../agents/llmAgent")

router.post("/", (req, res) => {

  const {
    meetingId,
    question
  } = req.body

  db.query(

    `
    SELECT *
    FROM meetings
    WHERE id = ?
    `,

    [meetingId],

    async (err, results) => {

      if (err)
        return res.status(500)

      if (
        results.length === 0
      ) {

        return res.json({

          answer:
            "Project not found"

        })

      }

      const meeting =
        results[0]

      const prompt = `

Project:

${meeting.title}

Notes:

${meeting.notes}

Question:

${question}

Answer professionally.

`

      const answer =
        await askLLM(prompt)

      res.json({
        answer
      })

    }

  )

})

module.exports = router