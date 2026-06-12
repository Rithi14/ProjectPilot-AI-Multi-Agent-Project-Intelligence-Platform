const {
  getCollection
} = require("./vectorStore")

const {
  createEmbedding
} = require("./embedder")

function cosineSimilarity(a, b) {

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {

    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]

  }

  return dot /
    (
      Math.sqrt(normA) *
      Math.sqrt(normB)
    )

}

async function searchChunks(question) {

  const queryEmbedding =
    await createEmbedding(question)

  const chunks =
    await getCollection()

  let bestChunk = null
  let bestScore = -1

  for (const chunk of chunks) {

    const score =
      cosineSimilarity(
        queryEmbedding,
        chunk.embedding
      )

    if (score > bestScore) {

      bestScore = score
      bestChunk = chunk.text

    }

  }

  return bestChunk

}

module.exports = {
  searchChunks
}