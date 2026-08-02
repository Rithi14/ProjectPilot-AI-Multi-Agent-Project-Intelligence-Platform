import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function Documents() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const uploadPDF = async () => {
    if (!selectedFile) {
      alert("Please select a PDF.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("pdf", selectedFile);

      const res = await axios.post(
        `${API_URL}/documents/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log(res.data);

      setUploadResult(res.data);

      alert("Knowledge Base Updated Successfully ✅");
    } catch (err) {
      console.log(err);

      alert("PDF Upload Failed ❌");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <div
        style={{
          background: "#1e293b",
          borderRadius: "18px",
          padding: "30px",
          border: "1px solid #7c3aed",
        }}
      >
        <h1
          style={{
            color: "#c084fc",
            fontSize: "34px",
            fontWeight: "bold",
          }}
        >
          📚 Knowledge Base
        </h1>

        <p
          style={{
            color: "#cbd5e1",
            marginTop: "10px",
          }}
        >
          Upload PDFs to build your AI Knowledge Base.
          Once uploaded, the AI Assistant in RAG Mode can answer questions
          using the uploaded documents.
        </p>

        <div style={{ marginTop: "30px" }}>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
        </div>

        {selectedFile && (
          <div
            style={{
              marginTop: "20px",
              color: "#38bdf8",
            }}
          >
            Selected File:
            <br />
            <strong>{selectedFile.name}</strong>
          </div>
        )}

        <button
          onClick={uploadPDF}
          disabled={uploading}
          style={{
            marginTop: "25px",
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "12px 25px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>

        {uploadResult && (
          <div
            style={{
              marginTop: "30px",
              background: "#0f172a",
              padding: "20px",
              borderRadius: "12px",
              color: "white",
            }}
          >
            <h3 style={{ color: "#22c55e" }}>
              ✅ Knowledge Base Updated
            </h3>

            <p>
              <b>File:</b> {uploadResult.file}
            </p>

            <p>
              <b>Chunks Created:</b> {uploadResult.chunks}
            </p>

            <p>
              <b>Status:</b> {uploadResult.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Documents;