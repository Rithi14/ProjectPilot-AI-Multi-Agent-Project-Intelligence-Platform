const {
  askLLM
} = require("./llmAgent")

async function meetingAgent(text) {

  const prompt = `

You are a professional Project Manager.

Summarize this meeting:

${text}

`

  return await askLLM(prompt)

}

module.exports = {
  meetingAgent
}