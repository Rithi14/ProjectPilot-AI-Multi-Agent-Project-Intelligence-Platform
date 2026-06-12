const {
  askLLM
} = require("./llmAgent")

async function decisionAgent(summary) {

  const prompt = `

You are a Project Decision Analyst.

Extract:

1. Important Decisions
2. Recommended Decisions
3. Actionable Decisions

Summary:

${summary}

`

  return await askLLM(prompt)

}

module.exports = {
  decisionAgent
}