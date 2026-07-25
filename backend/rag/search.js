const {
  getCollection
} = require("./vectorStore");

const {
  createEmbedding
} = require("./embedder");

function cosineSimilarity(a, b) {

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {

    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];

  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));

}

async function searchChunks(question, topK = 5) {

  const queryEmbedding = await createEmbedding(question);

  const chunks = await getCollection();

  const scoredChunks = chunks.map(chunk => ({

    text: chunk.text,

    score: cosineSimilarity(
      queryEmbedding,
      chunk.embedding
    )

  }));

  scoredChunks.sort((a, b) => b.score - a.score);

  const topChunks = scoredChunks
    .slice(0, topK)
    .map(chunk => chunk.text);

  return topChunks.join("\n\n");

}

module.exports = {
  searchChunks
};