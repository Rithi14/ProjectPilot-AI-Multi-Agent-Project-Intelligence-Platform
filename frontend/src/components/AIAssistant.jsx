import { useState } from "react";
import { chatWithAI } from "../api/aiAPI";

function AIAssistant() {

  const [prompt, setPrompt] = useState("");

  const [response, setResponse] = useState("");

  const sendPrompt = async () => {

    const res = await chatWithAI(prompt);

    setResponse(res.data.response);
  };

  return (
    <div>

      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button onClick={sendPrompt}>
        Ask AI
      </button>

      <p>{response}</p>

    </div>
  );
}

export default AIAssistant;