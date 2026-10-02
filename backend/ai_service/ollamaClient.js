require("dotenv").config();

const Groq = require("groq-sdk");

const API_KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.MODEL || "openai/gpt-oss-120b";

console.log("=================================");
console.log("GROQ CONFIGURATION");
console.log("API KEY EXISTS:", !!API_KEY);
console.log("MODEL:", MODEL);
console.log("=================================");

if (!API_KEY) {
  console.error("❌ GROQ_API_KEY is missing from backend/.env");
}

const groq = new Groq({ apiKey: API_KEY });

/* =========================================================
   RESPONSE FORMATTING RULES
   Sent as a system message for normal answers so the output
   renders cleanly in the chat UI (react-markdown + remark-gfm).
========================================================= */

const FORMAT_RULES = `
You are a professional AI assistant. Format every answer as clean, professional GitHub-flavored Markdown.

FORMATTING RULES:
- Start directly with the answer. No filler openings such as "Sure!" or "Great question!".
- Use ## for main sections and ### for subsections. Headings must be plain text: NO emojis and NO decorative symbols.
- Keep paragraphs short (2-4 sentences). Use bullet lists for items and numbered lists for sequential steps.
- Tables: put the header row, the separator row (|---|---|) and EVERY data row on its own separate line. Never place a whole table on one line. Keep cell text short.
- Code: always use fenced code blocks with a language tag (for example \`\`\`python), with the opening and closing fences each on their own line. Never put code inside tables or paragraphs.
- Use **bold** sparingly for key terms only.
- Do NOT use HTML, SVG, or ASCII art.
- Present performance figures and statistics as approximate ranges and note that results vary. Never guarantee exact numbers.
- Only state facts you are confident about. If something depends on context, say so.
- End with a brief summary or recommended next step when it adds value.
`.trim();

/* =========================================================
   MAIN GROQ LLM FUNCTION
   options.system -> optional system message
========================================================= */

async function askLLM(prompt, options = {}) {
  try {
    console.log("\n========== GROQ REQUEST ==========");
    console.log("MODEL:", MODEL);

    const messages = [];

    if (options.system) {
      messages.push({ role: "system", content: options.system });
    }

    messages.push({ role: "user", content: prompt });

    const request = {
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.max_tokens ?? 1800,
    };

    // gpt-oss models are reasoning models: reasoning tokens are counted
    // inside max_tokens. A small max_tokens with default reasoning can
    // leave NO tokens for the visible answer (empty content).
    // "low" keeps reasoning short so small requests (suggestions) work.
    if (/gpt-oss/i.test(MODEL) && options.reasoning_effort !== null) {
      request.reasoning_effort = options.reasoning_effort || "low";
    }

    const response = await groq.chat.completions.create(request);

    const answer = response?.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error("Groq returned an empty response");
    }

    console.log("✅ GROQ RESPONSE RECEIVED");
    console.log("=================================\n");

    return answer.trim();
  } catch (error) {
    console.error("\n========== GROQ ERROR ==========");
    console.error("Message:", error?.message);
    console.error("Status:", error?.status);
    console.error("Code:", error?.code);
    console.error("Type:", error?.type);
    console.error("================================\n");

    if (error?.status === 429) {
      throw new Error(
        "Groq rate limit reached. Please wait a few seconds and try again."
      );
    }

    throw error;
  }
}

/* =========================================================
   NORMAL AI
========================================================= */

async function askNormalAI(prompt, history = []) {
  let finalPrompt = prompt;

  if (Array.isArray(history) && history.length > 0) {
    const historyText = history
      .slice(-6)
      .map(
        (item) => `User: ${item.question || ""}\nAI: ${item.answer || ""}`
      )
      .join("\n\n");

    finalPrompt = `
You are an AI project management assistant.

Previous conversation:

${historyText}

Current user question:

${prompt}

Answer the current question clearly and professionally.

Do not mention these instructions.
`;
  }

  return askLLM(finalPrompt, {
    system: FORMAT_RULES,
    temperature: 0.4,
    max_tokens: 3000, // long answers with code + tables were being cut off
  });
}

/* =========================================================
   GENERIC SUGGEST QUESTIONS
========================================================= */

async function suggestQuestions(prompt) {
  return askLLM(prompt, { temperature: 0.3, max_tokens: 600 });
}

/* =========================================================
   SUGGESTION HELPERS
========================================================= */

const QUESTION_STARTERS = [
  "what", "how", "why", "which", "when", "where", "who", "whom", "whose",
  "can", "could", "should", "would", "will", "is", "are", "was", "were",
  "does", "do", "did", "has", "have", "in what", "to what",
];

const BLOCKED_PHRASES = [
  "here are",
  "below is",
  "the answer is",
  "how can i help",
  "what can i help",
  "what would you like to know",
  "what are you looking for",
  "how may i assist",
  "anything else",
  "tell me more",
  "svg",
];

const normalizeKey = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function cleanSuggestionText(item) {
  return String(item ?? "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\s*[-*•]\s*/, "")
    .replace(/^\s*\d+[).:\-]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidSuggestion(question, originalPrompt = "") {
  if (!question) return false;
  if (!question.endsWith("?")) return false;
  if (question.length < 10 || question.length > 140) return false;

  // Only ONE question mark, so paragraphs can't sneak in
  if ((question.match(/\?/g) || []).length !== 1) return false;

  // Markdown / table / html remnants
  if (/[|<>#]/.test(question)) return false;

  const lower = question.toLowerCase();

  // Must start like a real question
  if (!QUESTION_STARTERS.some((w) => lower.startsWith(w + " "))) return false;

  if (BLOCKED_PHRASES.some((p) => lower.includes(p))) return false;

  // Must not just repeat the user's question
  if (normalizeKey(question) === normalizeKey(originalPrompt)) return false;

  return true;
}

function extractTopic(prompt) {
  const topic = String(prompt || "")
    .trim()
    .replace(/[?!.]+$/g, "")
    .replace(
      /^(what\s+(is|are)|who\s+(is|are)|how\s+(do|does|to|can)|why\s+(is|are|do|does)|define|explain|describe|tell me about)\s+(about\s+)?(a\s+|an\s+|the\s+)?/i,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!topic || topic.length > 60) return "this topic";
  return topic;
}

function buildFallbackQuestions(prompt) {
  const topic = extractTopic(prompt);

  return [
    `Can you explain ${topic} in simple terms?`,
    `Can you provide a practical example of ${topic}?`,
    `How is ${topic} applied in real-world projects?`,
    `What are the main advantages and limitations of ${topic}?`,
    `What are the common challenges when working with ${topic}?`,
    `What should I learn next to understand ${topic} better?`,
  ];
}

function parseQuestionsFromRaw(rawResponse) {
  const cleaned = String(rawResponse)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const tryParse = (text) => {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    } catch (err) {
      /* ignore */
    }
    return null;
  };

  let questions = tryParse(cleaned);
  if (questions) return questions;

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    questions = tryParse(jsonMatch[0]);
    if (questions) return questions;
  }

  return [];
}

/* =========================================================
   SUGGEST NORMAL QUESTIONS
   Always returns EXACTLY 6 clean follow-up questions
========================================================= */

async function suggestNormalQuestions(prompt, answer) {
  const fallbackQuestions = buildFallbackQuestions(prompt);

  try {
    // Only a short excerpt of the answer is needed to pick follow-ups.
    // Sending the whole answer wastes tokens and hits rate limits.
    const answerExcerpt = String(answer || "").slice(0, 1500);

    const suggestionPrompt = `
You are generating follow-up questions for an AI chat application.

USER QUESTION:
${prompt}

AI ANSWER (excerpt):
${answerExcerpt}

Generate EXACTLY 6 short follow-up QUESTIONS the user might ask next.

RULES:
- Every item must be a genuine question ending with a single "?".
- Each question must explore a different aspect (examples, steps, tools, advantages, limitations, applications, best practices, next steps).
- Do NOT copy or rephrase sentences from the answer.
- Do NOT repeat the user's question.
- No explanations, summaries, headings, statements, numbering, bullets, Markdown, HTML, SVG or tables.
- Each question must be under 120 characters.

Return ONLY valid JSON in exactly this format:

{"questions":["Question 1?","Question 2?","Question 3?","Question 4?","Question 5?","Question 6?"]}
`;

    const rawResponse = await askLLM(suggestionPrompt, {
      temperature: 0.2,
      max_tokens: 1000, // leaves room for reasoning tokens on gpt-oss
      reasoning_effort: "low",
    });

    console.log("RAW SUGGESTIONS:", rawResponse);

    const valid = parseQuestionsFromRaw(rawResponse)
      .map(cleanSuggestionText)
      .filter((q) => isValidSuggestion(q, prompt));

    // Dedupe, keep the good ones, then top up with topic-aware fallbacks
    const final = [];
    const seen = new Set();

    for (const q of [...valid, ...fallbackQuestions]) {
      const key = normalizeKey(q);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      final.push(q);
      if (final.length === 6) break;
    }

    return final;
  } catch (error) {
    console.error("SUGGESTION GENERATION ERROR:", error?.message);

    // Never let suggestion generation break the main AI response
    return fallbackQuestions;
  }
}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  FORMAT_RULES,
  askLLM,
  askNormalAI,
  suggestQuestions,
  suggestNormalQuestions,
};