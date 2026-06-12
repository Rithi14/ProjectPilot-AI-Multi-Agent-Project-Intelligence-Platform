const {
  askLLM
} = require("./llmAgent")

async function timelineAgent(summary) {

  const prompt = `

You are a Project Scheduling Expert.

Create:

1. Week 1 Tasks
2. Week 2 Tasks
3. Week 3 Tasks
4. Deployment Timeline

Summary:

${summary}

`

  return await askLLM(prompt)

}

module.exports = {
  timelineAgent
}