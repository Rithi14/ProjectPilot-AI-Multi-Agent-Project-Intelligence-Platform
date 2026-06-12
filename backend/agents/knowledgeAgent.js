const { askLLM } =
require("../ai_service/ollamaClient")

async function knowledgeAgent(question, context) {

  return await askLLM(
    question,
    context
  )

}

module.exports = {
  knowledgeAgent
}