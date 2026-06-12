const express = require("express")

const {
  coordinatorAgent
} = require("../agents/coordinatorAgent")

const router =
  express.Router()

router.post(

  "/collaborate",

  async (req, res) => {

    try {

      const { text } =
        req.body

      const result =
        await coordinatorAgent(
          text
        )

      res.json(result)

    }

    catch (error) {

      console.log(error)

      res.status(500).json({

        success: false,

        message:
          "Multi Agent Failed"

      })

    }

  }

)

module.exports = router