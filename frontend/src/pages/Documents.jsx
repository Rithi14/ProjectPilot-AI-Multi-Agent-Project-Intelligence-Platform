import { useState } from "react"
import axios from "axios"
const API_URL = import.meta.env.VITE_API_URL;
function Documents() {

  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState("")

  const uploadPDF = async () => {

    console.log("UPLOAD CLICKED")

    if (!selectedFile) {

      alert("Please Select PDF")

      return

    }

    try {

      const formData = new FormData()

      formData.append(
        "pdf",
        selectedFile
      )

     const res = await axios.post(
  `${API_URL}/documents/upload`,
  formData,
  {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }
)

      console.log(res.data)

      setUploadStatus(
        "✅ PDF Uploaded Successfully"
      )

      alert(
        "PDF Uploaded Successfully"
      )

    }

    catch (err) {

      console.log(err)

      setUploadStatus(
        "❌ PDF Upload Failed"
      )

      alert(
        "PDF Upload Failed"
      )

    }

  }

  return (

    <div className="p-8">

      <div className="bg-[#111827] border border-purple-500 rounded-3xl p-8">

        <h1 className="text-4xl font-bold text-purple-400">
          Knowledge Base
        </h1>

        <p className="text-gray-400 mt-3">
          Upload PDFs and create your AI Knowledge Base.
        </p>

        <h2 className="text-red-500 mt-4">
          TESTING DOCUMENT PAGE
        </h2>

        <div className="mt-8 flex flex-col gap-4">

          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setSelectedFile(
                e.target.files[0]
              )
            }
          />

          <button
            onClick={uploadPDF}
            className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-xl w-fit"
          >
            Upload PDF
          </button>

          {
            uploadStatus && (
              <div className="text-green-400 font-semibold">
                {uploadStatus}
              </div>
            )
          }

        </div>

      </div>

    </div>

  )

}

export default Documents