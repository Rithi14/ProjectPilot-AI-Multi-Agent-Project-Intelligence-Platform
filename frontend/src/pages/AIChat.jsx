import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const API_URL = import.meta.env.VITE_API_URL;

function AIChat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState("normal"); // "normal" | "rag"
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const askAI = async (customPrompt) => {
  const question = (customPrompt ?? prompt).trim();

  if (!question) {
    alert("Please enter a question");
    return;
  }

  try {
    setLoading(true);

    let answer = "";
    let newSuggestions = [];

    if (chatMode === "normal") {

      const res = await axios.post(`${API_URL}/ai/chat`, {
        prompt: question,
        history: history,
      });

      answer = res.data.response;

      newSuggestions = res.data.suggestions || [];

      setHistory(res.data.history || []);

      setSuggestions(newSuggestions);

    } else {

      const pairHistory = messages
        .filter((m) => m.type === "user" || m.type === "ai")
        .reduce((arr, msg, index) => {

          if (msg.type === "user") {

            arr.push({
              question: msg.text,
              answer: messages[index + 1]?.text || "",
            });

          }

          return arr;

        }, []);


      const res = await axios.post(`${API_URL}/rag/ask`, {

        question,

        history: pairHistory,

      });


      answer = res.data.answer;

      setHistory(res.data.history || []);

      setSuggestions(res.data.suggestions || []);

    }


    // Add user + AI messages
    setMessages((prev) => [

      ...prev,

      {
        type: "user",
        text: question
      },

      {
        type: "ai",
        text: answer
      }

    ]);


    setPrompt("");

  } catch (error) {

    console.log(error);

    setMessages((prev) => [

      ...prev,

      {
        type: "ai",
        text: "❌ Error connecting to AI"
      }

    ]);

  } finally {

    setLoading(false);

  }
};
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  };

  return (
    <div style={{ width: "100%", color: "white" }}>
      <h1
        style={{
          color: "#b86cff",
          fontSize: "32px",
          fontWeight: "bold",
          marginBottom: "20px",
        }}
      >
        🤖 AI Assistant
      </h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setChatMode("normal")}
          style={{
            background: chatMode === "normal" ? "#2563eb" : "#1f2937",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          🤖 Normal AI
        </button>

        <button
          onClick={() => setChatMode("rag")}
          style={{
            background: chatMode === "rag" ? "#9333ea" : "#1f2937",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          📚 RAG Mode
        </button>
      </div>

      <p style={{ color: "#9ca3af", marginBottom: "15px" }}>
        Current Mode:{" "}
        <span
          style={{
            color: chatMode === "normal" ? "#60a5fa" : "#c084fc",
          }}
        >
          {chatMode === "normal" ? "Normal AI" : "Knowledge Base (RAG)"}
        </span>
      </p>

      <textarea
        rows="6"
        placeholder={
          chatMode === "normal" ? "Ask anything..." : "Ask from uploaded PDF..."
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        style={{
          width: "100%",
          padding: "18px",
          borderRadius: "12px",
          border: "1px solid #b86cff",
          background: "#0b1437",
          color: "white",
          fontSize: "16px",
        }}
      />

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => askAI()}
          disabled={loading}
          style={{
            background: chatMode === "normal" ? "#2563eb" : "#9333ea",
            color: "white",
            border: "none",
            padding: "14px 28px",
            borderRadius: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "600",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </div>

      {suggestions.length > 0 && (
  <div
    style={{
      marginTop: "15px",
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    }}
  >

    {suggestions.map((s, i) => (

      <button
        key={i}
        onClick={() => askAI(s)}
        disabled={loading}
        style={{
          background: "#1f2937",
          color:
            chatMode === "normal"
              ? "#60a5fa"
              : "#c084fc",

          border:
            chatMode === "normal"
              ? "1px solid #2563eb"
              : "1px solid #9333ea",

          padding: "8px 14px",

          borderRadius: "20px",

          cursor: loading
            ? "not-allowed"
            : "pointer",

          fontSize: "14px",

          transition: "0.2s",
        }}
      >
        {s}
      </button>

    ))}

  </div>
)}

      <div
        style={{
          marginTop: "30px",
          minHeight: "400px",
          background: "#0b1437",
          padding: "25px",
          borderRadius: "12px",
          border: "1px solid #b86cff",
          overflowY: "auto",
        }}
      >
        {messages.length === 0 && <p>Start chatting with AI...</p>}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              background: msg.type === "user" ? "#2563eb" : "#1e293b",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "15px",
              maxWidth: "85%",
              marginLeft: msg.type === "user" ? "auto" : "0",
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
            }}
          >
            <strong>{msg.type === "user" ? "You" : "AI"}:</strong>
            <br />
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default AIChat;
