const express = require("express")

const router = express.Router()

const db = require("../config/db")



// =========================
// GET ALL TASKS
// =========================

router.get("/", (req, res) => {

    db.query(

        "SELECT * FROM tasks",

        (err, result) => {

            if (err) {

                console.log(err)

                return res.status(500).send("Database Error")

            }

            res.json(result)

        }

    )

})



// =========================
// CREATE TASK
// =========================

router.post("/", (req, res) => {

    const {

        project_name,
        task_name,
        assigned_to,
        role,
        priority,
        status

    } = req.body

    const sql = `

        INSERT INTO tasks

        (
            project_name,
            task_name,
            assigned_to,
            role,
            priority,
            status
        )

        VALUES (?, ?, ?, ?, ?, ?)

    `

    db.query(

        sql,

        [
            project_name,
            task_name,
            assigned_to,
            role,
            priority,
            status
        ],

        (err, result) => {

            if (err) {

                console.log(err)

                return res.status(500).send("Database Error")

            }

            res.send("Task Added Successfully")

        }

    )

})



// =========================
// UPDATE TASK STATUS
// =========================

router.put("/:id", (req, res) => {

    const { id } = req.params

    const { status } = req.body

    const sql = `

        UPDATE tasks

        SET status = ?

        WHERE id = ?

    `

    db.query(

        sql,

        [status, id],

        (err, result) => {

            if (err) {

                console.log(err)

                return res.status(500).send("Update Failed")

            }

            res.send("Task Updated Successfully")

        }

    )

})



// =========================
// DELETE TASK
// =========================

router.delete("/:id", (req, res) => {

    const { id } = req.params

    const sql = "DELETE FROM tasks WHERE id = ?"

    db.query(

        sql,

        [id],

        (err, result) => {

            if (err) {

                console.log(err)

                return res.status(500).send("Delete Failed")

            }

            res.send("Task Deleted Successfully")

        }

    )

})



module.exports = router