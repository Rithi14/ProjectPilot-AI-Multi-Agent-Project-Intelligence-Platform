const {
  askLLM
} = require("./llmAgent")

async function riskAgent(summary) {

  const prompt = `

You are a Senior Risk Analyst.

Analyze the following project summary.

Identify:

1. Technical Risks
2. Timeline Risks
3. Security Risks

Return as bullet points.

Summary:

${summary}

`

  return await askLLM(prompt)

}

module.exports = {
  riskAgent
}