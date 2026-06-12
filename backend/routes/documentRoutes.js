const express = require("express")
const multer = require("multer")
const path = require("path")

const {
extractPDFText
} = require("../rag/pdfProcessor")

const {
chunkText
} = require("../rag/chunker")

const {
createEmbedding
} = require("../rag/embedder")

const {
addChunk
} = require("../rag/vectorStore")

const router = express.Router()

const storage = multer.diskStorage({

destination: function (
req,
file,
cb
) {


cb(
  null,
  "uploads/"
)


},

filename: function (
req,
file,
cb
) {

cb(
  null,
  Date.now() +
  "-" +
  file.originalname
)


}

})

const upload =
multer({ storage })

router.post(

"/upload",

upload.single("pdf"),

async (req, res) => {


try {

  if (!req.file) {

    return res.status(400).json({

      success: false,

      message: "No PDF uploaded"

    })

  }

  console.log("PDF Uploaded:")
  console.log(req.file.filename)

  const pdfPath =
    path.join(
      __dirname,
      "../uploads",
      req.file.filename
    )

  const text =
    await extractPDFText(
      pdfPath
    )

  const cleanedText =
    text
      .replace(/\r\n/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim()

  const chunks =
    chunkText(
      cleanedText
    )

  for (
    let i = 0;
    i < chunks.length;
    i++
  ) {

    const embedding =
      await createEmbedding(
        chunks[i]
      )

    await addChunk(

      `${Date.now()}-${i}`,

      chunks[i],

      embedding

    )

  }

  console.log("Chunks Saved:")
  console.log(chunks.length)

  res.json({

    success: true,

    file:
      req.file.filename,

    chunks:
      chunks.length,

    extractedText:
      cleanedText.substring(
        0,
        500
      ),

    message:
      "PDF Uploaded Successfully"

  })

}

catch (error) {

  console.log(
    "FULL ERROR:"
  )

  console.log(error)

  res.status(500).json({

    success: false,

    message:
      error.message

  })

}


}

)

module.exports = router
