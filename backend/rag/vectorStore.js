const chunks = []

async function addChunk(
  id,
  text,
  embedding
) {

  chunks.push({
    id,
    text,
    embedding
  })

}

async function getCollection() {

  return chunks

}

module.exports = {

  addChunk,

  getCollection

}