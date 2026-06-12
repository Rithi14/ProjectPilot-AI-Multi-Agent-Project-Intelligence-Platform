const express = require("express")

const router = express.Router()

const db = require("../config/db")



/* ========================================= */
/* GET ALL PROJECTS */
/* ========================================= */

router.get("/", (req, res) => {

    const sql = "SELECT * FROM projects"

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err)

            return res
                .status(500)
                .send("Database Error")

        }

        res.json(result)

    })

})



/* ========================================= */
/* ADD PROJECT + AUTO TASK ASSIGN */
/* ========================================= */

router.post("/", (req, res) => {

    const {
        title,
        description,
        deadline,
        status
    } = req.body

    const sql = `

        INSERT INTO projects
        (
            title,
            description,
            deadline,
            status
        )

        VALUES (?, ?, ?, ?)

    `

    db.query(

        sql,

        [
            title,
            description,
            deadline,
            status
        ],

        (err, result) => {

            if (err) {

                console.log(err)

                return res
                    .status(500)
                    .send("Insert Failed")

            }

            // =====================================
            // PROJECT ID
            // =====================================

            const projectId = result.insertId

            // =====================================
            // AGENTS
            // =====================================

          // =====================================
// AGENTS
// =====================================

const agents = [

    "Rithi",
    "Rohit",
    "Prajith",
    "Sanju",
    "Sredivit"

]

// =====================================
// TASK TYPES
// =====================================

const taskTemplates = [

    {
        name: "Planning",
        priority: "High"
    },

    {
        name: "Frontend UI",
        priority: "High"
    },

    {
        name: "Backend API",
        priority: "High"
    },

    {
        name: "Testing",
        priority: "Medium"
    },

    {
        name: "Communication",
        priority: "Low"
    }

]

// =====================================
// SHUFFLE AGENTS
// =====================================

for (

    let i = agents.length - 1;

    i > 0;

    i--

) {

    const j = Math.floor(
        Math.random() * (i + 1)
    )

    ;[
        agents[i],
        agents[j]
    ] = [
        agents[j],
        agents[i]
    ]

}

// =====================================
// AUTO TASKS
// =====================================

const autoTasks = taskTemplates.map(

    (task, index) => [

        projectId,

        title,

        `${title} ${task.name}`,

        agents[index],

        task.priority,

        "Pending"

    ]

)
            // =====================================
            // INSERT TASKS
            // =====================================

            const taskSql = `

                INSERT INTO tasks
                (
                    project_id,
                    project_name,
                    task_name,
                    assigned_to,
                    priority,
                    status
                )

                VALUES ?

            `
       db.query(

    taskSql,

    [autoTasks],

    (taskErr, taskResult) => {

        if (taskErr) {

            console.log(taskErr)

            return res
                .status(500)
                .json({
                    message: "Task Creation Failed"
                })

        }

        res.json({

            message:
                "Project + Auto Tasks Created Successfully",

            projectId: projectId,

            tasksCreated:
                autoTasks.length

        })

    }

)

        }

    )

})



/* ========================================= */
/* UPDATE PROJECT */
/* ========================================= */

router.put("/:id", (req, res) => {

    const { id } = req.params

    const {
        title,
        description,
        deadline,
        status
    } = req.body

    const sql = `

        UPDATE projects

        SET

            title = ?,
            description = ?,
            deadline = ?,
            status = ?

        WHERE id = ?

    `

    db.query(

        sql,

        [
            title,
            description,
            deadline,
            status,
            id
        ],

        (err, result) => {

            if (err) {

                console.log(err)

                return res
                    .status(500)
                    .send("Update Failed")

            }

            res.send(
                "Project Updated Successfully"
            )

        }

    )

})



/* ========================================= */
/* DELETE PROJECT */
/* ========================================= */

router.delete("/:id", (req, res) => {

    const { id } = req.params

    // =====================================
    // DELETE TASKS
    // =====================================

    db.query(

        "DELETE FROM tasks WHERE project_id = ?",

        [id],

        (taskErr, taskResult) => {

            if (taskErr) {

                console.log(taskErr)

                return res
                    .status(500)
                    .send("Task Delete Failed")

            }

            // =====================================
            // DELETE PROJECT
            // =====================================

            db.query(

                "DELETE FROM projects WHERE id = ?",

                [id],

                (err, result) => {

                    if (err) {

                        console.log(err)

                        return res
                            .status(500)
                            .send("Project Delete Failed")

                    }

                    res.send(
                        "Project + Tasks Deleted Successfully"
                    )

                }

            )

        }

    )

})



module.exports = router