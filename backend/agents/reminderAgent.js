const {
  askLLM
} = require("./llmAgent")

async function reminderAgent(tasks) {

  const prompt = `

Generate reminders for these tasks:

${tasks}

`

  return await askLLM(prompt)

}

module.exports = {
  reminderAgent
}