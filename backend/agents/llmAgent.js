require("dotenv").config();

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = process.env.MODEL || "openai/gpt-oss-120b";

async function askLLM(prompt) {
  try {
    console.log("=================================");
    console.log("🤖 GROQ AI REQUEST");
    console.log("MODEL:", MODEL);
    console.log("=================================");

    const completion = await groq.chat.completions.create({
      model: MODEL,

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.4,

      // IMPORTANT:
      // Prevent unnecessarily large responses
      max_tokens: 1800,
    });

    const answer =
      completion?.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error("Groq returned an empty response");
    }

    console.log("=================================");
    console.log("✅ GROQ RESPONSE RECEIVED");
    console.log("=================================");

    return answer.trim();

  } catch (error) {

    console.error("=================================");
    console.error("❌ GROQ API ERROR");
    console.error("Message:", error?.message);
    console.error("Status:", error?.status);
    console.error("Code:", error?.code);
    console.error("=================================");

    // Handle rate limit separately
    if (error?.status === 429) {
      throw new Error(
        "Groq rate limit reached. Please wait a few seconds and try again."
      );
    }

    throw error;
  }
}

module.exports = {
  askLLM,
};