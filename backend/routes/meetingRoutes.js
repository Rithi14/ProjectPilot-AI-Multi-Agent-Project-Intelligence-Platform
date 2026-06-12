const express = require("express")
const db = require("../config/db")

const {
  coordinatorAgent
} = require("../agents/coordinatorAgent")

const router = express.Router()

/* =========================
   GET ALL MEETINGS
========================= */

router.get("/", (req, res) => {

  db.query(

    `
    SELECT
      m.id,
      m.title,
      m.notes,
      m.created_at,

      mi.summary,
      mi.tasks,
      mi.reminders,
      mi.risks,
      mi.timeline,
      mi.decisions

    FROM meetings m

    LEFT JOIN meeting_insights mi
    ON m.id = mi.meeting_id

    ORDER BY m.id DESC
    `,

    (err, results) => {

      if (err) {

        console.log(err)

        return res.status(500).json({
          success: false
        })

      }

      res.json(results)

    }

  )

})

/* =========================
   CREATE MEETING
========================= */

router.post("/", async (req, res) => {

  try {

    const {
      title,
      notes
    } = req.body

    db.query(

      `
      INSERT INTO meetings
      (
        title,
        notes
      )
      VALUES (?, ?)
      `,

      [
        title,
        notes
      ],

      async (err, result) => {

        if (err) {

          console.log(err)

          return res.status(500).json({
            success: false
          })

        }

        const meetingId =
          result.insertId

        const aiResult =
          await coordinatorAgent(
            notes
          )

        db.query(

          `
          INSERT INTO meeting_insights
          (
            meeting_id,
            summary,
            tasks,
            reminders,
            risks,
            timeline,
            decisions
          )
          VALUES
          (?, ?, ?, ?, ?, ?, ?)
          `,

          [

            meetingId,

            aiResult.summary || "",

            aiResult.tasks || "",

            aiResult.reminders || "",

            aiResult.risks || "",

            aiResult.timeline || "",

            aiResult.decisions || ""

          ],

          (insightErr) => {

            if (insightErr) {

              console.log(
                insightErr
              )

            }

          }

        )

        res.json({

          success: true,

          meetingId,

          insights:
            aiResult

        })

      }

    )

  }

  catch (error) {

    console.log(error)

    res.status(500).json({

      success: false,

      message:
        "Meeting Creation Failed"

    })

  }

})

/* =========================
   GET SINGLE INSIGHT
========================= */

router.get(

  "/insights/:meetingId",

  (req, res) => {

    db.query(

      `
      SELECT *
      FROM meeting_insights
      WHERE meeting_id = ?
      `,

      [
        req.params.meetingId
      ],

      (err, data) => {

        if (err) {

          console.log(err)

          return res.status(500).json({
            success: false
          })

        }

        res.json(data)

      }

    )

  }

)

/* =========================
   DELETE MEETING
========================= */

router.delete("/:id", (req, res) => {

  const meetingId =
    req.params.id

  db.query(

    `
    DELETE FROM meeting_insights
    WHERE meeting_id = ?
    `,

    [meetingId],

    (err) => {

      if (err) {

        console.log(err)

        return res.status(500).json({
          success: false
        })

      }

      db.query(

        `
        DELETE FROM meetings
        WHERE id = ?
        `,

        [meetingId],

        (err2) => {

          if (err2) {

            console.log(err2)

            return res.status(500).json({
              success: false
            })

          }

          res.json({

            success: true,

            message:
              "Meeting Deleted Successfully"

          })

        }

      )

    }

  )

})

module.exports = router