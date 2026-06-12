const express = require("express")

const {
  searchChunks
} = require("../rag/search")
const {
  askLLM
} = require("../ai_service/ollamaClient")
const router = express.Router()

router.get("/", (req, res) => {

  res.send(
    "RAG Route Working"
  )

})

router.post(

  "/ask",

  async (req, res) => {

    try {

      const { question } = req.body

      if (!question) {

        return res.status(400).json({

          success: false,

          answer: "Question is required"

        })

      }

      const bestChunk =
        await searchChunks(
          question
        )

      if (!bestChunk) {

        return res.json({

          success: true,

          answer:
            "No relevant information found in PDF"

        })

      }

     const finalAnswer =
  await askLLM(
    question,
    bestChunk
  )

res.json({

  success: true,

  answer: finalAnswer

})

    }

    catch (error) {

      console.log(error)

      res.status(500).json({

        success: false,

        answer: "RAG Failed"

      })

    }

  }

)

module.exports = router