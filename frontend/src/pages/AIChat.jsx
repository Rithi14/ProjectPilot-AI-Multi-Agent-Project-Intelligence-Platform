import { useState } from "react"
import axios from "axios"
const API_URL = import.meta.env.VITE_API_URL;
function AIChat() {

const [prompt, setPrompt] =
useState("")

const [messages, setMessages] =
useState([])

const [loading, setLoading] =
useState(false)

const [chatMode, setChatMode] =
useState("normal")

const askAI = async () => {


if (!prompt.trim()) {

  alert(
    "Please enter a question"
  )

  return

}

try {

  setLoading(true)

  let answer = ""

  if (
    chatMode === "normal"
  ) {

    const res =
     await axios.post(
  `${API_URL}/ai/chat`,
  { prompt }
)

    answer =
      res.data.response

  }

  else {

    const res =
     await axios.post(
  `${API_URL}/rag/ask`,
  { question: prompt }
)

    answer =
      res.data.answer

  }

  setMessages(prev => [

    ...prev,

    {
      type: "user",
      text: prompt
    },

    {
      type: "ai",
      text: answer
    }

  ])

  setPrompt("")

}

catch (error) {

  console.log(error)

  setMessages(prev => [

    ...prev,

    {
      type: "ai",
      text:
        "❌ Error connecting to AI"
    }

  ])

}

finally {

  setLoading(false)

}


}

return (


<div
  style={{
    width: "100%",
    color: "white"
  }}
>

  <h1
    style={{
      color: "#b86cff",
      fontSize: "32px",
      fontWeight: "bold",
      marginBottom: "20px"
    }}
  >
    🤖 AI Assistant
  </h1>

  <div
    style={{
      display: "flex",
      gap: "10px",
      marginBottom: "20px"
    }}
  >

    <button

      onClick={() =>
        setChatMode(
          "normal"
        )
      }

      style={{
        background:
          chatMode === "normal"
            ? "#2563eb"
            : "#1f2937",

        color: "white",

        border: "none",

        padding:
          "10px 20px",

        borderRadius:
          "10px",

        cursor:
          "pointer"
      }}

    >

      🤖 Normal AI

    </button>

    <button

      onClick={() =>
        setChatMode(
          "rag"
        )
      }

      style={{
        background:
          chatMode === "rag"
            ? "#9333ea"
            : "#1f2937",

        color: "white",

        border: "none",

        padding:
          "10px 20px",

        borderRadius:
          "10px",

        cursor:
          "pointer"
      }}

    >

      📚 RAG Mode

    </button>

  </div>

  <p
    style={{
      color: "#9ca3af",
      marginBottom: "15px"
    }}
  >

    Current Mode :

    {" "}

    <span
      style={{
        color:
          chatMode === "normal"
            ? "#60a5fa"
            : "#c084fc"
      }}
    >

      {
        chatMode === "normal"
          ? "Normal AI"
          : "Knowledge Base (RAG)"
      }

    </span>

  </p>

  <textarea

    rows="6"

    placeholder={
      chatMode === "normal"
        ? "Ask anything..."
        : "Ask from uploaded PDF..."
    }

    value={prompt}

    onChange={(e) =>
      setPrompt(
        e.target.value
      )
    }

    style={{
      width: "100%",
      padding: "18px",
      borderRadius: "12px",
      border:
        "1px solid #b86cff",
      background:
        "#0b1437",
      color: "white",
      fontSize: "16px"
    }}

  />

  <div
    style={{
      marginTop: "20px"
    }}
  >

    <button

      onClick={askAI}

      disabled={loading}

      style={{
        background:
          chatMode === "normal"
            ? "#2563eb"
            : "#9333ea",

        color: "white",

        border: "none",

        padding:
          "14px 28px",

        borderRadius:
          "10px",

        cursor:
          "pointer",

        fontWeight:
          "600"
      }}

    >

      {
        loading
          ? "Thinking..."
          : "Ask AI"
      }

    </button>

  </div>

  <div

    style={{
      marginTop: "30px",
      minHeight: "400px",
      background: "#0b1437",
      padding: "25px",
      borderRadius: "12px",
      border:
        "1px solid #b86cff",
      overflowY:
        "auto"
    }}

  >

    {

      messages.length === 0 &&

      <p>
        Start chatting with AI...
      </p>

    }

    {

      messages.map(

        (msg, index) => (

          <div

            key={index}

            style={{

              background:

                msg.type === "user"
                  ? "#2563eb"
                  : "#1e293b",

              padding: "15px",

              borderRadius: "12px",

              marginBottom: "15px",

              maxWidth: "85%",

              marginLeft:

                msg.type === "user"
                  ? "auto"
                  : "0",

              whiteSpace:
                "pre-wrap",

              overflowWrap:
                "break-word"

            }}

          >

            <strong>

              {

                msg.type === "user"
                  ? "You"
                  : "AI"

              }

              :

            </strong>

            <br />

            {msg.text}

          </div>

        )

      )

    }

  </div>

</div>


)

}

export default AIChat
