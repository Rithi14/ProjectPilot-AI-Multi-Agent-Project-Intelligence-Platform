const db = require("../config/db");

/* ===============================
   Save PDF
================================ */

function saveDocument(filename, originalName) {

    return new Promise((resolve, reject) => {

        db.query(

            `INSERT INTO documents
            (filename, original_name)
            VALUES (?, ?)`,
            [filename, originalName],

            (err, result) => {

                if (err) return reject(err);

                resolve(result.insertId);

            }

        );

    });

}

/* ===============================
   Get All PDFs
================================ */

function getDocuments() {

    return new Promise((resolve, reject) => {

        db.query(

            `SELECT *
             FROM documents
             ORDER BY uploaded_at DESC`,

            (err, rows) => {

                if (err) return reject(err);

                resolve(rows);

            }

        );

    });

}

/* ===============================
   Delete PDF
================================ */

function deleteDocument(id) {

    return new Promise((resolve, reject) => {

        db.query(

            "DELETE FROM documents WHERE id=?",

            [id],

            (err) => {

                if (err) return reject(err);

                resolve(true);

            }

        );

    });

}

module.exports = {

    saveDocument,

    getDocuments,

    deleteDocument

};