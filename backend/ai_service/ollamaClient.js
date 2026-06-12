const axios = require("axios")

async function askLLM(question, context) {

  const prompt = `
Context:
${context}

Question:
${question}

Answer only using the context.
Keep the response short and precise.
`

  const response = await axios.post(
    "http://localhost:11434/api/generate",
    {
      model: "llama3.2",
      prompt,
      stream: false
    }
  )

  return response.data.response
}

module.exports = {
  askLLM
}