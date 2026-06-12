const express = require("express")

const router = express.Router()

const db = require("../config/db")



// LOGIN

router.post("/login", (req, res) => {

  const { email, password } = req.body

  db.query(

    "SELECT * FROM users WHERE email = ? AND password = ?",

    [email, password],

    (err, result) => {

      if (err) {

        console.log(err)

        return res.status(500).send("Database Error")

      }

      if (result.length === 0) {

        return res.status(401).send("Invalid Credentials")

      }

      res.json(result[0])

    }

  )

})

module.exports = router