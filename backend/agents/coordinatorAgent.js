const {
  meetingAgent
} = require("./meetingAgent")

const {
  taskAgent
} = require("./taskAgent")

const {
  reminderAgent
} = require("./reminderAgent")

const {
  riskAgent
} = require("./riskAgent")

const {
  timelineAgent
} = require("./timelineAgent")

const {
  decisionAgent
} = require("./decisionAgent")

async function coordinatorAgent(text) {

  const summary =
    await meetingAgent(text)

  const tasks =
    await taskAgent(summary)

  const reminders =
    await reminderAgent(tasks)

  const risks =
    await riskAgent(summary)

  const timeline =
    await timelineAgent(summary)

  const decisions =
    await decisionAgent(summary)

  return {

    summary,

    tasks,

    reminders,

    risks,

    timeline,

    decisions

  }

}

module.exports = {
  coordinatorAgent
}