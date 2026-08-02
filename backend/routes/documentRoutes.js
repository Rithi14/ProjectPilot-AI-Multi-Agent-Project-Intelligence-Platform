const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  extractPDFText,
} = require("../rag/pdfProcessor");

const {
  chunkText,
} = require("../rag/chunker");

const {
  createEmbedding,
} = require("../rag/embedder");

const {
  addChunk,
} = require("../rag/vectorStore");

const documentModel = require("../models/documentModel");
const documentController = require("../controllers/documentController");

const router = express.Router();

/* ==========================================
   Multer Storage
========================================== */

const storage = multer.diskStorage({

  destination(req, file, cb) {

    cb(null, "uploads/");

  },

  filename(req, file, cb) {

    cb(

      null,

      Date.now() + "-" + file.originalname

    );

  }

});

const upload = multer({ storage });

/* ==========================================
   Upload PDF
========================================== */

router.post(

  "/upload",

  upload.single("pdf"),

  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({

          success: false,

          message: "No PDF Uploaded"

        });

      }

      console.log("PDF Uploaded:", req.file.filename);

      // Save document info
      await documentModel.saveDocument(

        req.file.filename,

        req.file.originalname

      );

      const pdfPath = path.join(

        __dirname,

        "../uploads",

        req.file.filename

      );

      const text = await extractPDFText(pdfPath);

      const cleanedText = text

        .replace(/\r\n/g, " ")

        .replace(/\n/g, " ")

        .replace(/\s+/g, " ")

        .trim();

      const chunks = chunkText(cleanedText);

      for (let i = 0; i < chunks.length; i++) {

        const embedding = await createEmbedding(

          chunks[i]

        );

        await addChunk(

          `${req.file.filename}-${i}`,

          chunks[i],

          embedding

        );

      }

      res.json({

        success: true,

        file: req.file.filename,

        originalName: req.file.originalname,

        chunks: chunks.length,

        message: "PDF Uploaded Successfully"

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        message: err.message

      });

    }

  }

);

/* ==========================================
   Get All Documents
========================================== */

router.get(

  "/all",

  documentController.getDocuments

);

/* ==========================================
   Delete Document
========================================== */

router.delete(

  "/:id",

  documentController.deleteDocument

);

module.exports = router;