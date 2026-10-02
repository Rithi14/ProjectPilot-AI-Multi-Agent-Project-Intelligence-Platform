import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { jsPDF } from "jspdf";

const API_URL = import.meta.env.VITE_API_URL;

// ============================================================
// SUGGESTION CLEANING (single source of truth)
// ============================================================

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
  "anything else",
  "svg",
];

const suggestionKey = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const cleanFollowUpSuggestions = (rawSuggestions) => {
  if (!Array.isArray(rawSuggestions)) return [];

  const seen = new Set();

  return rawSuggestions
    .map((item) => {
      if (item === null || item === undefined) return "";

      return String(item)
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .replace(/^#{1,6}\s*/, "")
        .replace(/^\s*[-*•]\s*/, "")
        .replace(/^\s*\d+[).:\-]\s*/, "")
        .replace(/\s+/g, " ")
        .trim();
    })
    .filter((question) => {
      if (!question) return false;
      if (!question.endsWith("?")) return false;
      if (question.length < 10 || question.length > 140) return false;

      // Only one "?" so paragraphs can't pass as a question
      if ((question.match(/\?/g) || []).length !== 1) return false;

      // Markdown / table / HTML remnants
      if (/[|<>#]/.test(question)) return false;

      const lower = question.toLowerCase();

      // Must start like a real question
      if (!QUESTION_STARTERS.some((w) => lower.startsWith(w + " "))) {
        return false;
      }

      return !BLOCKED_PHRASES.some((phrase) => lower.includes(phrase));
    })
    .filter((question) => {
      const key = suggestionKey(question);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
};

const extractTopic = (question) => {
  const topic = String(question || "")
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
};

const getProfessionalFallbackSuggestions = (question) => {
  const topic = extractTopic(question);

  return [
    `Can you explain ${topic} in simple terms?`,
    `Can you provide a practical example of ${topic}?`,
    `How is ${topic} applied in real-world projects?`,
    `What are the main advantages and limitations of ${topic}?`,
    `What are the common challenges when working with ${topic}?`,
    `What should I learn next to understand ${topic} better?`,
  ];
};

// Converts any backend format into an array of strings
// (array, { questions: [] }, JSON string, null ...)
const normalizeSuggestions = (value) => {
  if (typeof value === "string") {
    const cleaned = value
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      return normalizeSuggestions(JSON.parse(cleaned));
    } catch (err) {
      // Plain text: one candidate per line (the cleaner drops non-questions)
      return cleaned.split("\n");
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return item;

      if (item && typeof item === "object") {
        return String(
          item.question || item.prompt || item.text || item.title || ""
        );
      }

      return "";
    });
  }

  if (value && typeof value === "object") {
    for (const key of ["questions", "suggestions", "items", "data"]) {
      if (Array.isArray(value[key])) return normalizeSuggestions(value[key]);
    }
  }

  return [];
};

// Always returns exactly 6 clean questions:
// valid backend questions first, topped up with topic-aware fallbacks.
const ensureSuggestions = (value, question) => {
  const fromBackend = cleanFollowUpSuggestions(normalizeSuggestions(value));
  const fallback = getProfessionalFallbackSuggestions(question);

  const unique = [];
  const seen = new Set();

  for (const item of [...fromBackend, ...fallback]) {
    const key = suggestionKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length === 6) break;
  }

  return unique;
};

// ===================== Design tokens =====================
const colors = {
  sidebarBg: "#0B0F1F",
  panelBg: "#0D1120",
  cardBg: "#111528",
  border: "rgba(148,163,184,0.14)",
  borderStrong: "rgba(148,163,184,0.28)",
  textPrimary: "#E5E7EB",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  accent: "#6366F1",
  accentBg: "rgba(99,102,241,0.14)",
  accentBorder: "rgba(99,102,241,0.45)",
  danger: "#F43F5E",

  suggestBg: "#0F1426",
  suggestCardBg: "#141A30",
  suggestCardHoverBg: "#182040",
  suggestBorder: "rgba(148,163,184,0.16)",
  suggestBorderHover: "rgba(99,102,241,0.5)",
};

// ===================== Icons =====================
const ICON_PATHS = {
  plus: "M12 5v14M5 12h14",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3",
  pin: "M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10zM12 13a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  pencil: "M4 20h4l10.5-10.5a2 2 0 000-2.8l-1.2-1.2a2 2 0 00-2.8 0L4 16v4z",
  trash:
    "M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m2 0v13a2 2 0 01-2 2H9a2 2 0 01-2-2V7h10z",
  upload: "M12 15V4M7 9l5-5 5 5M4 20h16",
  file: "M13 2H6a1 1 0 00-1 1v18a1 1 0 001 1h12a1 1 0 001-1V8l-6-6zM13 2v6h6",
  folder:
    "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  x: "M18 6L6 18M6 6l12 12",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  bulb: "M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z",
  download: "M12 3v12M7 10l5 5 5-5M4 21h16",
  robot:
    "M9 8V6a3 3 0 016 0v2m-9 0h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2zM9 13h.01M15 13h.01",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
};

const Icon = ({ name, size = 16, color, style, filled = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: color || "currentColor", flexShrink: 0, ...style }}
  >
    <path d={ICON_PATHS[name]} />
  </svg>
);

// ===================== Style helpers =====================
const iconButtonStyle = (color = colors.textSecondary) => ({
  background: "transparent",
  border: "none",
  color,
  cursor: "pointer",
  padding: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "6px",
});

const outlinedButtonStyle = (disabled) => ({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  background: "transparent",
  border: `1px solid ${colors.borderStrong}`,
  color: colors.textPrimary,
  padding: "8px 14px",
  borderRadius: "10px",
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: "13px",
  opacity: disabled ? 0.6 : 1,
  whiteSpace: "nowrap",
});

// ===================== Markdown rendering =====================
// Professional styling for headings, tables, code blocks, lists, etc.
const markdownComponents = {
  h1: (p) => (
    <h1 style={{ fontSize: "20px", fontWeight: 600, margin: "18px 0 10px", color: colors.textPrimary }} {...p} />
  ),
  h2: (p) => (
    <h2
      style={{
        fontSize: "17px",
        fontWeight: 600,
        margin: "20px 0 10px",
        paddingBottom: "6px",
        borderBottom: `1px solid ${colors.border}`,
        color: colors.textPrimary,
      }}
      {...p}
    />
  ),
  h3: (p) => (
    <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "16px 0 8px", color: colors.textPrimary }} {...p} />
  ),
  p: (p) => <p style={{ margin: "8px 0", lineHeight: 1.65 }} {...p} />,
  ul: (p) => <ul style={{ margin: "8px 0", paddingLeft: "22px" }} {...p} />,
  ol: (p) => <ol style={{ margin: "8px 0", paddingLeft: "22px" }} {...p} />,
  li: (p) => <li style={{ margin: "4px 0", lineHeight: 1.6 }} {...p} />,
  hr: () => (
    <hr style={{ border: "none", borderTop: `1px solid ${colors.border}`, margin: "16px 0" }} />
  ),
  a: (p) => (
    <a style={{ color: colors.accent }} target="_blank" rel="noreferrer" {...p} />
  ),
  blockquote: (p) => (
    <blockquote
      style={{
        margin: "10px 0",
        padding: "6px 14px",
        borderLeft: `3px solid ${colors.accent}`,
        background: colors.accentBg,
        borderRadius: "0 8px 8px 0",
      }}
      {...p}
    />
  ),
  table: (p) => (
    <div
      style={{
        overflowX: "auto",
        margin: "12px 0",
        border: `1px solid ${colors.borderStrong}`,
        borderRadius: "10px",
      }}
    >
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "13px" }} {...p} />
    </div>
  ),
  thead: (p) => <thead style={{ background: colors.accentBg }} {...p} />,
  th: (p) => (
    <th
      style={{
        padding: "9px 12px",
        textAlign: "left",
        fontWeight: 600,
        borderBottom: `1px solid ${colors.borderStrong}`,
        borderRight: `1px solid ${colors.border}`,
        whiteSpace: "nowrap",
      }}
      {...p}
    />
  ),
  td: (p) => (
    <td
      style={{
        padding: "9px 12px",
        verticalAlign: "top",
        lineHeight: 1.5,
        borderBottom: `1px solid ${colors.border}`,
        borderRight: `1px solid ${colors.border}`,
        minWidth: "140px",
      }}
      {...p}
    />
  ),
  pre: (p) => (
    <pre
      style={{
        background: "#070A14",
        border: `1px solid ${colors.border}`,
        padding: "14px",
        borderRadius: "10px",
        overflowX: "auto",
        margin: "12px 0",
        fontSize: "12.5px",
        lineHeight: 1.55,
        whiteSpace: "pre",
      }}
      {...p}
    />
  ),
  code: ({ inline, className, children, ...rest }) => {
    // Block code has a language class or contains a newline
    const isBlock = className || String(children).includes("\n");

    if (!isBlock) {
      return (
        <code
          style={{
            background: "rgba(148,163,184,0.16)",
            padding: "2px 6px",
            borderRadius: "5px",
            fontSize: "12.5px",
            fontFamily: "ui-monospace, Menlo, Consolas, monospace",
          }}
          {...rest}
        >
          {children}
        </code>
      );
    }

    return (
      <code
        className={className}
        style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", color: "#E2E8F0" }}
        {...rest}
      >
        {children}
      </code>
    );
  },
};

// ===================== Chat title helpers =====================
const TITLE_ACRONYMS = [
  "ai", "ui", "ux", "api", "ml", "aws", "sql", "html", "css", "js", "pdf",
  "rag", "llm", "gpt", "ceo", "cfo", "hr", "it", "url", "json", "xml", "cpu",
  "gpu", "roi", "kpi", "faq", "id", "os", "ip", "usa", "uk", "eu", "diy",
  "atm", "pin", "vip", "asap", "fyi", "tv", "pc", "usb", "wifi", "vpn", "seo",
  "crm", "erp", "saas", "b2b", "b2c", "nasa", "fbi", "cia", "eda",
];

const SMALL_WORDS = ["a", "an", "the", "of", "in", "on", "for", "and", "or", "to", "vs", "with"];

const TITLE_PATTERNS = [
  { regex: /^what\s+is\s+(?:a\s+|an\s+|the\s+)?(.+?)[?.!]*$/i, suffix: "Overview" },
  { regex: /^what\s+are\s+(?:the\s+)?(.+?)[?.!]*$/i, suffix: "Overview" },
  { regex: /^who\s+is\s+(.+?)[?.!]*$/i, suffix: "Profile" },
  { regex: /^how\s+(?:to|do\s+i|does|can\s+i|can\s+you)\s+(.+?)[?.!]*$/i, suffix: "Guide" },
  { regex: /^why\s+(?:is|are|does|do)\s+(.+?)[?.!]*$/i, suffix: "Explained" },
  { regex: /^(?:define|explain|describe)\s+(.+?)[?.!]*$/i, suffix: "Explained" },
];

const applyAcronyms = (str) =>
  str
    .split(" ")
    .map((word) => {
      const clean = word.replace(/[^a-zA-Z]/g, "").toLowerCase();

      if (clean && TITLE_ACRONYMS.includes(clean)) {
        return word.replace(new RegExp(clean, "i"), clean.toUpperCase());
      }

      return word;
    })
    .join(" ");

const capitalizeWords = (str) =>
  str
    .split(" ")
    .filter(Boolean)
    .map((word, i) => {
      if (i !== 0 && SMALL_WORDS.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

const truncateTitle = (title) => {
  const MAX_LENGTH = 40;

  if (title.length <= MAX_LENGTH) return title;

  const truncated = title.slice(0, MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");

  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "…";
};

const generateChatTitle = (question) => {
  const raw = (question || "").trim().replace(/\s+/g, " ");

  if (!raw) return "New Chat";

  for (const { regex, suffix } of TITLE_PATTERNS) {
    const match = raw.match(regex);

    if (match && match[1] && match[1].trim()) {
      const topic = applyAcronyms(capitalizeWords(match[1].trim()));
      return truncateTitle(`${topic} ${suffix}`);
    }
  }

  const title = applyAcronyms(raw.charAt(0).toUpperCase() + raw.slice(1));

  return truncateTitle(title);
};

// ===================== Document date helpers =====================
const getDocDate = (doc) =>
  doc.created_at ||
  doc.uploaded_at ||
  doc.createdAt ||
  doc.uploadedAt ||
  doc.date ||
  null;

const formatDateLabel = (dateStr) => {
  if (!dateStr) return "Earlier";

  const date = new Date(dateStr);
  if (isNaN(date)) return "Earlier";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ===================== Component =====================
function AIChat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState("normal");
  const [history, setHistory] = useState([]);

  // Always keep this as an ARRAY of clean question strings.
  const [suggestions, setSuggestions] = useState([]);

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [search, setSearch] = useState("");
  const [hoveredChat, setHoveredChat] = useState(null);
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);

  // PDF upload / RAG
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);

  const bottomRef = useRef(null);
  const currentChatIdRef = useRef(null);
  const isAskingRef = useRef(false);

  const updateCurrentChatId = (id) => {
    currentChatIdRef.current = id;
    setCurrentChatId(id);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, suggestions]);

  useEffect(() => {
    loadChats();
    loadDocuments();
  }, []);

  // ---------------- Chats ----------------

  const loadChat = async (chatId) => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/${chatId}`);
      const data = Array.isArray(res.data) ? res.data : [];

      setMessages(
        data.map((m) => ({
          type: m.role === "user" ? "user" : "ai",
          text: m.message,
        }))
      );

      const chatHistory = [];

      for (let i = 0; i < data.length; i += 2) {
        if (data[i] && data[i + 1]) {
          chatHistory.push({
            question: data[i].message,
            answer: data[i + 1].message,
          });
        }
      }

      setHistory(chatHistory);
      setSuggestions([]);
      updateCurrentChatId(chatId);
    } catch (err) {
      console.log("LOAD CHAT ERROR:", err);
    }
  };

  const loadChats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat`);
      const chatData = Array.isArray(res.data) ? res.data : [];

      const sortedChats = [...chatData].sort((a, b) => {
        if (a.pinned === b.pinned) {
          return new Date(b.updated_at) - new Date(a.updated_at);
        }
        return b.pinned - a.pinned;
      });

      setChats(sortedChats);
    } catch (err) {
      console.log("LOAD CHATS ERROR:", err);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await axios.delete(`${API_URL}/api/chat/${chatId}`);

      if (currentChatIdRef.current === chatId) {
        updateCurrentChatId(null);
        setMessages([]);
        setHistory([]);
        setSuggestions([]);
        setPrompt("");
      }

      await loadChats();
    } catch (err) {
      console.log("DELETE CHAT ERROR:", err);
    }
  };

  // ---------------- Documents ----------------

  const loadDocuments = async () => {
    try {
      const res = await axios.get(`${API_URL}/documents/all`);
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("LOAD DOCUMENTS ERROR:", err);
    }
  };

  const deleteDocument = async (docId) => {
    if (
      !window.confirm(
        "Delete this PDF? This also removes it from the knowledge base."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/documents/${docId}`);

      if (activeDocument === docId) setActiveDocument(null);

      await loadDocuments();
    } catch (err) {
      console.log(err);
      alert("Failed to delete PDF");
    }
  };

  const selectDocument = (doc) => {
    setActiveDocument(doc.id);
    setChatMode("rag");
  };

  const clearActiveDocument = () => setActiveDocument(null);

  const groupedDocuments = (() => {
    const sorted = [...documents].sort(
      (a, b) =>
        new Date(getDocDate(b) || 0) - new Date(getDocDate(a) || 0)
    );

    const groups = [];
    const indexByLabel = {};

    sorted.forEach((doc) => {
      const label = formatDateLabel(getDocDate(doc));

      if (indexByLabel[label] === undefined) {
        indexByLabel[label] = groups.length;
        groups.push({ label, docs: [doc] });
      } else {
        groups[indexByLabel[label]].docs.push(doc);
      }
    });

    return groups;
  })();

  const uploadPDF = async () => {
    if (!selectedFile) {
      alert("Please select a PDF");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("pdf", selectedFile);

      const res = await axios.post(`${API_URL}/documents/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Knowledge base updated");
      console.log(res.data);

      setSelectedFile(null);
      await loadDocuments();
    } catch (err) {
      console.log(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ---------------- Ask AI ----------------

  const askAI = async (customPrompt) => {
    if (isAskingRef.current) return;

    const question = (customPrompt ?? prompt).trim();

    if (!question) {
      alert("Please enter a question");
      return;
    }

    isAskingRef.current = true;

    try {
      setLoading(true);
      setPrompt("");

      let answer = "";
      let chatId = currentChatIdRef.current;

      // Create a chat if this is the first message (both modes)
      if (!chatId) {
        const newChat = await axios.post(`${API_URL}/api/chat/create`, {
          title: generateChatTitle(question),
        });

        chatId = newChat.data.chatId;
        updateCurrentChatId(chatId);

        await loadChats();
      }

      let rawSuggestions = null;
      let newHistory = [];

      if (chatMode === "normal") {
        const res = await axios.post(`${API_URL}/ai/chat`, {
          chatId,
          prompt: question,
          history,
        });

        answer = res.data?.response || "No response received.";
        rawSuggestions = res.data?.suggestions;
        newHistory = Array.isArray(res.data?.history) ? res.data.history : [];
      } else {
        const pairHistory = [];

        for (let i = 0; i < messages.length; i++) {
          if (messages[i].type === "user") {
            pairHistory.push({
              question: messages[i].text,
              answer: messages[i + 1]?.text || "",
            });
          }
        }

        const res = await axios.post(`${API_URL}/rag/ask`, {
          question,
          history: pairHistory,
          documentId: activeDocument,
          chatId,
        });

        answer = res.data?.answer || "No answer received.";
        rawSuggestions = res.data?.suggestions;
        newHistory = Array.isArray(res.data?.history) ? res.data.history : [];
      }

      // One cleaning path for BOTH modes: only real questions survive,
      // and the list is topped up to 6 with topic-aware fallbacks.
      setSuggestions(ensureSuggestions(rawSuggestions, question));
      setHistory(newHistory);

      setMessages((prev) => [
        ...prev,
        { type: "user", text: question },
        { type: "ai", text: answer },
      ]);

      // Save RAG chat history
      if (chatMode !== "normal") {
        try {
          await axios.post(`${API_URL}/api/chat/message`, {
            chatId,
            role: "user",
            message: question,
          });

          await axios.post(`${API_URL}/api/chat/message`, {
            chatId,
            role: "assistant",
            message: answer,
          });
        } catch (saveErr) {
          console.log("Failed to save RAG chat history:", saveErr);
        }
      }

      await loadChats();
    } catch (error) {
      console.log("AI REQUEST ERROR:", error);

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: error?.response?.data?.message || "Error connecting to AI",
        },
      ]);

      setSuggestions([]);
    } finally {
      setLoading(false);
      isAskingRef.current = false;
    }
  };

  // ---------------- Export ----------------

  const exportTXT = () => {
    if (messages.length === 0) {
      alert("No conversation to export.");
      return;
    }

    let text = "";

    messages.forEach((msg) => {
      text += `${msg.type === "user" ? "You" : "AI"}:\n`;
      text += `${msg.text}\n\n`;
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "AI_Conversation.txt";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (messages.length === 0) {
      alert("No conversation to export.");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxLineWidth = pageWidth - margin * 2;
    const lineHeight = 16;

    let y = margin;

    doc.setFontSize(16);
    doc.text("AI Conversation", margin, y);
    y += lineHeight * 2;

    doc.setFontSize(11);

    messages.forEach((msg) => {
      const label = msg.type === "user" ? "You:" : "AI:";

      doc.setFont(undefined, "bold");

      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.text(label, margin, y);
      y += lineHeight;

      doc.setFont(undefined, "normal");

      const lines = doc.splitTextToSize(msg.text || "", maxLineWidth);

      lines.forEach((line) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        doc.text(line, margin, y);
        y += lineHeight;
      });

      y += lineHeight;
    });

    doc.save("AI_Conversation.pdf");
  };

  // ---------------- Keyboard / filters ----------------

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (loading) return;
      askAI();
    }
  };

  const filteredChats = chats.filter((chat) =>
    (chat.title || "").toLowerCase().includes(search.toLowerCase())
  );

  // Final safety net before rendering
  const safeSuggestions = cleanFollowUpSuggestions(suggestions);

  // ---------------- UI ----------------

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        width: "100%",
        height: "90vh",
        color: colors.textPrimary,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ================= SIDEBAR ================= */}
      <div
        style={{
          width: "260px",
          background: colors.sidebarBg,
          border: `1px solid ${colors.border}`,
          padding: "14px",
          borderRadius: "16px",
          height: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          onClick={() => {
            setMessages([]);
            setHistory([]);
            setSuggestions([]);
            setPrompt("");
            updateCurrentChatId(null);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            padding: "10px",
            background: colors.accent,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            marginBottom: "14px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <Icon name="plus" size={16} />
          New chat
        </button>

        <div style={{ position: "relative", marginBottom: "14px" }}>
          <span
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.textMuted,
              display: "flex",
            }}
          >
            <Icon name="search" size={14} />
          </span>

          <input
            type="text"
            placeholder="Search chats"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 10px 9px 32px",
              borderRadius: "10px",
              border: `1px solid ${colors.border}`,
              outline: "none",
              background: colors.cardBg,
              color: colors.textPrimary,
              fontSize: "13px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {filteredChats.map((chat) => {
            const isActive = currentChatId === chat.id;

            return (
              <div
                key={chat.id}
                onMouseEnter={() => setHoveredChat(chat.id)}
                onMouseLeave={() => setHoveredChat(null)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 10px",
                  background: isActive ? colors.accentBg : "transparent",
                  borderLeft: isActive
                    ? `2px solid ${colors.accent}`
                    : "2px solid transparent",
                  borderRadius: "8px",
                }}
              >
                <div
                  onClick={() => loadChat(chat.id)}
                  style={{
                    flex: 1,
                    cursor: "pointer",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    color: isActive
                      ? colors.textPrimary
                      : colors.textSecondary,
                  }}
                >
                  {chat.pinned ? (
                    <Icon name="pin" size={12} color={colors.accent} filled />
                  ) : null}

                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chat.title}
                  </span>
                </div>

                <div
                  style={{
                    display: hoveredChat === chat.id ? "flex" : "none",
                    alignItems: "center",
                    gap: "4px",
                    marginLeft: "8px",
                  }}
                >
                  {/* PIN */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();

                      try {
                        await axios.put(`${API_URL}/api/chat/${chat.id}/pin`, {
                          pinned: !chat.pinned,
                        });
                        await loadChats();
                      } catch (err) {
                        console.log(err);
                      }
                    }}
                    style={iconButtonStyle(
                      chat.pinned ? colors.accent : colors.textSecondary
                    )}
                    title={chat.pinned ? "Unpin chat" : "Pin chat"}
                  >
                    <Icon name="pin" size={14} filled={!!chat.pinned} />
                  </button>

                  {/* RENAME */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();

                      const title = window.prompt("Rename chat", chat.title);
                      if (!title) return;

                      try {
                        await axios.put(`${API_URL}/api/chat/${chat.id}`, {
                          title,
                        });
                        await loadChats();
                      } catch (err) {
                        console.log(err);
                      }
                    }}
                    style={iconButtonStyle()}
                    title="Rename chat"
                  >
                    <Icon name="pencil" size={14} />
                  </button>

                  {/* DELETE */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    style={iconButtonStyle(colors.danger)}
                    title="Delete chat"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MAIN CHAT ================= */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "90vh",
          minHeight: 0,
        }}
      >
        {/* HEADER */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: colors.accentBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="robot" size={18} color={colors.accent} />
              </div>

              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: 500,
                  margin: 0,
                  color: colors.textPrimary,
                  letterSpacing: "0.2px",
                }}
              >
                AI assistant
              </h1>
            </div>

            {/* MODE TOGGLE */}
            <div
              style={{
                display: "flex",
                gap: "3px",
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                padding: "3px",
                borderRadius: "11px",
              }}
            >
              {[
                { id: "normal", label: "Normal AI" },
                { id: "rag", label: "Knowledge base" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setChatMode(mode.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background:
                      chatMode === mode.id ? colors.accent : "transparent",
                    color:
                      chatMode === mode.id ? "#fff" : colors.textSecondary,
                    border: "none",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* KNOWLEDGE BASE */}
          {chatMode === "rag" && (
            <div
              style={{
                marginBottom: "16px",
                padding: "14px 16px",
                background: colors.cardBg,
                borderRadius: "14px",
                border: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 500 }}>
                  Knowledge base
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      color: colors.textSecondary,
                      maxWidth: "160px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedFile ? selectedFile.name : "No file chosen"}
                  </span>

                  <label style={outlinedButtonStyle(false)}>
                    <Icon name="file" size={14} />
                    Choose file
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      style={{ display: "none" }}
                    />
                  </label>

                  <button
                    onClick={uploadPDF}
                    disabled={uploading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      background: colors.accent,
                      color: "#fff",
                      border: "none",
                      cursor: uploading ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: 500,
                      opacity: uploading ? 0.7 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Icon name="upload" size={14} />
                    {uploading ? "Uploading…" : "Upload"}
                  </button>
                </div>
              </div>

              {/* DOCUMENT LIST */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {documents.length === 0 ? (
                  <p style={{ color: colors.textMuted, fontSize: "13px", margin: 0 }}>
                    No PDFs uploaded yet.
                  </p>
                ) : (
                  groupedDocuments.map((group) => (
                    <div key={group.label}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: colors.textMuted,
                          fontSize: "12px",
                          fontWeight: 500,
                          marginBottom: "6px",
                        }}
                      >
                        <Icon name="folder" size={13} />
                        {group.label}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {group.docs.map((doc) => {
                          const isActive = activeDocument === doc.id;

                          return (
                            <div
                              key={doc.id}
                              onClick={() => selectDocument(doc)}
                              title="Ask questions about this PDF"
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: isActive
                                  ? colors.accentBg
                                  : "transparent",
                                border: `1px solid ${
                                  isActive ? colors.accentBorder : colors.border
                                }`,
                                padding: "9px 10px",
                                borderRadius: "10px",
                                cursor: "pointer",
                              }}
                            >
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  overflow: "hidden",
                                  whiteSpace: "nowrap",
                                  textOverflow: "ellipsis",
                                  fontSize: "13px",
                                  color: isActive
                                    ? colors.textPrimary
                                    : colors.textSecondary,
                                }}
                              >
                                <Icon
                                  name="file"
                                  size={14}
                                  color={
                                    isActive ? colors.accent : colors.textMuted
                                  }
                                />
                                {doc.original_name}
                              </span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDocument(doc.id);
                                }}
                                style={iconButtonStyle(colors.danger)}
                                title="Delete PDF"
                              >
                                <Icon name="trash" size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ACTIVE DOCUMENT */}
              {activeDocument && (
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: colors.accentBg,
                    border: `1px solid ${colors.accentBorder}`,
                    padding: "8px 10px",
                    borderRadius: "10px",
                  }}
                >
                  <span
                    style={{
                      color: colors.textPrimary,
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Asking from{" "}
                    <span style={{ color: colors.accent }}>
                      {documents.find((d) => d.id === activeDocument)
                        ?.original_name || "selected file"}
                    </span>
                  </span>

                  <button
                    onClick={clearActiveDocument}
                    style={{
                      ...iconButtonStyle(colors.textSecondary),
                      gap: "4px",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                    }}
                    title="Ask across all PDFs"
                  >
                    <Icon name="x" size={13} />
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MESSAGES */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            background: colors.panelBg,
            padding: "20px",
            borderRadius: "16px",
            border: `1px solid ${colors.border}`,
            overflowY: "auto",
          }}
        >
          {messages.length === 0 && (
            <p style={{ color: colors.textMuted, fontSize: "14px" }}>
              Start chatting with AI…
            </p>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  background: msg.type === "user" ? colors.accent : colors.cardBg,
                  color: msg.type === "user" ? "#fff" : colors.textPrimary,
                  padding: "10px 14px",
                  borderRadius:
                    msg.type === "user"
                      ? "12px 12px 2px 12px"
                      : "12px 12px 12px 2px",
                  maxWidth: msg.type === "user" ? "78%" : "92%",
                  minWidth: 0,
                  overflowWrap: "break-word",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {/* SUGGESTED QUESTIONS */}
          {safeSuggestions.length > 0 && (
            <div
              style={{
                marginTop: "24px",
                background: colors.suggestBg,
                border: `1px solid ${colors.suggestBorder}`,
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: colors.textSecondary,
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                  }}
                >
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "6px",
                      background: colors.accentBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="bulb" size={12} color={colors.accent} />
                  </div>
                  Suggested follow-ups
                </div>

                <span
                  style={{
                    fontSize: "11px",
                    color: colors.textMuted,
                    fontWeight: 500,
                  }}
                >
                  {safeSuggestions.length}{" "}
                  {safeSuggestions.length === 1 ? "prompt" : "prompts"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "10px",
                }}
              >
                {safeSuggestions.map((s, i) => {
                  const isHovered = hoveredSuggestion === i;

                  return (
                    <button
                      key={`${s}-${i}`}
                      onClick={() => askAI(s)}
                      disabled={loading}
                      onMouseEnter={() => setHoveredSuggestion(i)}
                      onMouseLeave={() => setHoveredSuggestion(null)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        textAlign: "left",
                        background: isHovered
                          ? colors.suggestCardHoverBg
                          : colors.suggestCardBg,
                        color: colors.textPrimary,
                        border: `1px solid ${
                          isHovered
                            ? colors.suggestBorderHover
                            : colors.suggestBorder
                        }`,
                        padding: "12px 14px",
                        borderRadius: "10px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        lineHeight: 1.4,
                        opacity: loading ? 0.55 : 1,
                        transition:
                          "background 0.15s ease, border-color 0.15s ease",
                      }}
                    >
                      <span>{s}</span>

                      <Icon
                        name="arrowRight"
                        size={14}
                        color={isHovered ? colors.accent : colors.textMuted}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div
          style={{
            flexShrink: 0,
            marginTop: "12px",
            display: "flex",
            gap: "8px",
            alignItems: "flex-end",
            background: colors.panelBg,
            border: `1px solid ${colors.border}`,
            borderRadius: "16px",
            padding: "8px",
          }}
        >
          <textarea
            rows="1"
            placeholder={
              chatMode === "normal" ? "Ask anything…" : "Ask from uploaded PDF…"
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            style={{
              flex: 1,
              resize: "none",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "none",
              outline: "none",
              background: "transparent",
              color: colors.textPrimary,
              fontSize: "14px",
              maxHeight: "160px",
            }}
          />

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={exportTXT}
              title="Export as TXT"
              style={outlinedButtonStyle(false)}
            >
              <Icon name="download" size={14} />
              TXT
            </button>

            <button
              onClick={exportPDF}
              title="Export as PDF"
              style={outlinedButtonStyle(false)}
            >
              <Icon name="download" size={14} />
              PDF
            </button>

            <button
              onClick={() => askAI()}
              disabled={loading}
              title="Ask AI"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: colors.accent,
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: "10px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 500,
                fontSize: "13px",
                opacity: loading ? 0.7 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {loading ? (
                "Thinking…"
              ) : (
                <>
                  <Icon name="send" size={14} />
                  Ask
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChat;