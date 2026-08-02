const fs = require("fs");
const path = require("path");

const documentModel = require("../models/documentModel");

/* ===================================
   Get All Documents
=================================== */

exports.getDocuments = async (req, res) => {

  try {

    const documents = await documentModel.getDocuments();

    res.json(documents);

  } catch (err) {

    console.log(err);

    res.status(500).json({

      success: false,

      message: err.message

    });

  }

};

/* ===================================
   Delete Document
=================================== */

exports.deleteDocument = async (req, res) => {

  try {

    const documents = await documentModel.getDocuments();

    const document = documents.find(
      (d) => d.id == req.params.id
    );

    if (!document) {

      return res.status(404).json({

        success: false,

        message: "Document not found"

      });

    }

    // Delete file from uploads folder
    const filePath = path.join(

      __dirname,

      "../uploads",

      document.filename

    );

    if (fs.existsSync(filePath)) {

      fs.unlinkSync(filePath);

    }

    // Delete from database
    await documentModel.deleteDocument(req.params.id);

    res.json({

      success: true,

      message: "Document Deleted"

    });

  } catch (err) {

    console.log(err);

    res.status(500).json({

      success: false,

      message: err.message

    });

  }

};