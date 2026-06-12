const {
  askLLM
} = require("./llmAgent")

async function taskAgent(summary) {

  const prompt = `

Extract actionable tasks from:

${summary}

Return as numbered list.

`

  return await askLLM(prompt)

}

module.exports = {
  taskAgent
}