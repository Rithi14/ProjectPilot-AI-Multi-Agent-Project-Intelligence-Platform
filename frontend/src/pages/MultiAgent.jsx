import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const RESULT_STORAGE_KEY = "multiAgent:lastResult";

const INSIGHT_KEYS = [
  "summary",
  "tasks",
  "reminders",
  "risks",
  "timeline",
  "decisions",
];

/*
====================================================
NORMALIZE INSIGHTS
====================================================
The backend may return the analysis under different keys, as a JSON
string, or nested. This always gives back a plain object (or null)
so the "AI Project Intelligence" cards can render.
*/
const normalizeInsights = (data) => {
  if (!data) return null;

  const candidates = [
    data.insights,
    data.result,
    data.analysis,
    data.data?.insights,
    data.meeting?.insights,
    data,
  ];

  for (let candidate of candidates) {
    if (!candidate) continue;

    if (typeof candidate === "string") {
      try {
        candidate = JSON.parse(candidate);
      } catch (err) {
        continue;
      }
    }

    if (
      candidate &&
      typeof candidate === "object" &&
      INSIGHT_KEYS.some((key) => candidate[key] !== undefined)
    ) {
      return candidate;
    }
  }

  return null;
};

/*
====================================================
RECOMMENDATION TEXT HELPERS
====================================================
The backend often sends the same sentence in BOTH `title` and
`description`, and the title also contains a long parenthetical
plus "– Role – Day N". These helpers split it into:

  title    -> short headline
  details  -> text from the parentheses (shown once, as description)
  dueDay   -> "Day 3" (shown as a small chip)

and make sure the same wording is never displayed twice.
(Owner/role is intentionally not displayed.)
*/

const normalizeText = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const capitalizeFirst = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

const parseRecommendation = (rec) => {
  const rawTitle = String(rec?.title || "").trim();
  const rawDescription = String(rec?.description || "").trim();

  // 1. Split "Task – Role – Day 3." on dashes
  const parts = rawTitle
    .split(/\s+[–—-]\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  let mainPart = parts[0] || rawTitle;
  let dueDay = "";

  for (const part of parts.slice(1)) {
    const dayMatch = part.match(/day\s*\d+/i);
    if (dayMatch) {
      dueDay = capitalizeFirst(dayMatch[0].replace(/\s+/, " "));
    }
  }

  // 2. Pull parenthetical text out of the headline
  const detailChunks = [];

  mainPart = mainPart
    .replace(/\(([^)]*)\)/g, (_, inner) => {
      if (inner.trim()) detailChunks.push(inner.trim());
      return " ";
    })
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/[.\s]+$/, "")
    .trim();

  const details = detailChunks.length
    ? capitalizeFirst(detailChunks.join("; "))
    : "";

  const title = mainPart || rawTitle.replace(/[.\s]+$/, "");

  // 3. Decide what to show as description (never a repeat of the title)
  const titleKey = normalizeText(rawTitle);
  const descKey = normalizeText(rawDescription);

  const descriptionRepeatsTitle =
    !descKey ||
    descKey === titleKey ||
    titleKey.includes(descKey) ||
    descKey.includes(titleKey) ||
    descKey === normalizeText(title);

  let description = "";

  if (!descriptionRepeatsTitle) {
    description = rawDescription;
  } else if (details) {
    description = details;
  }

  // Avoid details repeating the description when both exist
  if (
    description &&
    details &&
    normalizeText(description) !== normalizeText(details) &&
    normalizeText(description).includes(normalizeText(details))
  ) {
    description = rawDescription;
  }

  return { title, description, dueDay };
};

function MultiAgent() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Read More modal
  const [selectedSection, setSelectedSection] = useState(null);

  // AI Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] =
    useState(false);

  // Processing approve/reject
  const [processingId, setProcessingId] = useState(null);

  // Recommendations are shown ONLY for the meeting analyzed in this session
  const [currentMeetingId, setCurrentMeetingId] = useState(null);

  // Message shown when the server returned no insights
  const [notice, setNotice] = useState("");

  // Used to scroll to the results after analysis
  const resultRef = useRef(null);

  /*
  ====================================================
  RUN MULTI-AGENT ANALYSIS
  ====================================================
  */
  const runAgents = async () => {
    if (!title.trim()) {
      alert("Please enter project title");
      return;
    }

    if (!text.trim()) {
      alert("Please enter meeting notes");
      return;
    }

    try {
      setLoading(true);

      const meetingResponse = await axios.post(`${API_URL}/meetings`, {
        title: title.trim(),
        notes: text.trim(),
      });

      console.log("MEETING RESPONSE:", meetingResponse.data);

      const insights = normalizeInsights(meetingResponse.data);

      if (insights) {
        setResult(insights);
        setNotice("");

        // Ready for the NEXT meeting: clear the form after a successful run
        setTitle("");
        setText("");
      } else {
        setResult(null);
        setNotice(
          "Meeting saved, but the server did not return AI insights. Check the /meetings response in the browser console."
        );
      }

      // Show recommendations for THIS meeting only
      const newMeetingId = meetingResponse.data?.meeting_id ?? null;

      setCurrentMeetingId(newMeetingId);
      await fetchRecommendations(newMeetingId);

      alert("Meeting Saved Successfully");
    } catch (error) {
      console.error("MULTI-AGENT ERROR:", error);

      alert(
        error?.response?.data?.message ||
          "Multi-Agent Collaboration Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  ====================================================
  START A NEW MEETING (clears results and form)
  ====================================================
  */
  const startNewMeeting = () => {
    setResult(null);
    setNotice("");
    setSelectedSection(null);
    setTitle("");
    setText("");
    setCurrentMeetingId(null);
    setRecommendations([]);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /*
  ====================================================
  FETCH PENDING AI RECOMMENDATIONS
  ====================================================
  */
  const fetchRecommendations = async (meetingId = currentMeetingId) => {
    // Nothing analyzed in this session yet -> nothing to show
    if (meetingId === null || meetingId === undefined) {
      setRecommendations([]);
      return;
    }

    try {
      setRecommendationsLoading(true);

      const response = await axios.get(`${API_URL}/ai/recommendations`);

      if (response.data.success) {
        const all = response.data.recommendations || [];

        setRecommendations(
          all.filter(
            (item) => String(item.meeting_id) === String(meetingId)
          )
        );
      }
    } catch (error) {
      console.error("FETCH RECOMMENDATIONS ERROR:", error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  /*
  ====================================================
  APPROVE AI RECOMMENDATION
  ====================================================
  */
  const approveRecommendation = async (id) => {
    try {
      setProcessingId(id);

      const response = await axios.patch(
        `${API_URL}/ai/recommendations/${id}/approve`
      );

      if (response.data.success) {
        setRecommendations((prev) =>
          prev.filter((item) => item.id !== id)
        );

        alert("Recommendation approved successfully");
      }
    } catch (error) {
      console.error("APPROVE RECOMMENDATION ERROR:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to approve recommendation"
      );
    } finally {
      setProcessingId(null);
    }
  };

  /*
  ====================================================
  REJECT AI RECOMMENDATION
  ====================================================
  */
  const rejectRecommendation = async (id) => {
    const reason = window.prompt(
      "Why are you rejecting this recommendation?",
      "Not required for the project"
    );

    // User clicked Cancel
    if (reason === null) {
      return;
    }

    try {
      setProcessingId(id);

      const response = await axios.patch(
        `${API_URL}/ai/recommendations/${id}/reject`,
        {
          rejection_reason: reason.trim() || "Rejected by student",
        }
      );

      if (response.data.success) {
        setRecommendations((prev) =>
          prev.filter((item) => item.id !== id)
        );

        alert("Recommendation rejected");
      }
    } catch (error) {
      console.error("REJECT RECOMMENDATION ERROR:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to reject recommendation"
      );
    } finally {
      setProcessingId(null);
    }
  };

  /*
  ====================================================
  LOAD RECOMMENDATIONS WHEN PAGE OPENS
  ====================================================
  */
  useEffect(() => {
    // A refresh starts clean: no results and no recommendations are loaded.
    // Recommendations appear only after you analyze a meeting.

    // A refresh starts clean. Remove any result saved by an older version
    // of this page so old analysis never reappears.
    try {
      localStorage.removeItem(RESULT_STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
  }, []);

  /*
  ====================================================
  SCROLL TO RESULTS WHEN ANALYSIS FINISHES
  ====================================================
  */
  useEffect(() => {
    if (result && !loading) {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [result, loading]);

  /*
  ====================================================
  RESULT SECTIONS
  ====================================================
  */
  const resultSections = [
    {
      key: "summary",
      label: "Summary",
      icon: "📝",
      accent: "indigo",
      description: "AI-generated overview of the project discussion",
    },
    {
      key: "tasks",
      label: "Tasks",
      icon: "✅",
      accent: "emerald",
      description: "Action items identified by the AI agents",
    },
    {
      key: "reminders",
      label: "Reminders",
      icon: "⏰",
      accent: "amber",
      description: "Important follow-ups and scheduled actions",
    },
    {
      key: "risks",
      label: "Risks",
      icon: "🚨",
      accent: "rose",
      description: "Potential technical, timeline and security risks",
    },
    {
      key: "timeline",
      label: "Timeline",
      icon: "📅",
      accent: "sky",
      description: "Project milestones and delivery schedule",
    },
    {
      key: "decisions",
      label: "Decisions",
      icon: "🎯",
      accent: "violet",
      description:
        "Important and actionable decisions extracted from the meeting",
    },
  ];

  /*
  ====================================================
  ACCENT STYLES
  ====================================================
  */
  const accentStyles = {
    indigo: {
      icon: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
      title: "text-indigo-300",
      button:
        "border-indigo-500/20 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20",
      glow: "hover:border-indigo-500/40",
    },
    emerald: {
      icon: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
      title: "text-emerald-300",
      button:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
      glow: "hover:border-emerald-500/40",
    },
    amber: {
      icon: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
      title: "text-amber-300",
      button:
        "border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
      glow: "hover:border-amber-500/40",
    },
    rose: {
      icon: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
      title: "text-rose-300",
      button:
        "border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
      glow: "hover:border-rose-500/40",
    },
    sky: {
      icon: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
      title: "text-sky-300",
      button:
        "border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20",
      glow: "hover:border-sky-500/40",
    },
    violet: {
      icon: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
      title: "text-violet-300",
      button:
        "border-violet-500/20 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20",
      glow: "hover:border-violet-500/40",
    },
  };

  /*
  ====================================================
  PREVIEW TEXT
  ====================================================
  */
  const getPreview = (content) => {
    if (!content) {
      return "No information generated.";
    }

    const cleanText = String(content)
      .replace(/\*\*/g, "")
      .replace(/#{1,6}\s?/g, "")
      .replace(/\|/g, " ")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanText.length <= 180) {
      return cleanText;
    }

    return cleanText.substring(0, 180) + "...";
  };

  /*
  ====================================================
  ITEM COUNT
  ====================================================
  */
  const getCount = (content) => {
    if (!content) return 0;

    const lines = String(content)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const itemLines = lines.filter((line) =>
      /^(\d+[.)]\s+|[-*•]\s+)/.test(line)
    );

    return itemLines.length > 0 ? itemLines.length : 1;
  };

  /*
  ====================================================
  FORMAT AI CONTENT
  ====================================================
  */
  const formatContent = (content) => {
    if (!content) {
      return (
        <p className="text-sm text-slate-500">
          No information available.
        </p>
      );
    }

    const lines = String(content)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return (
      <div className="space-y-3">
        {lines.map((line, index) => {
          // Markdown heading
          if (line.startsWith("#")) {
            const heading = line
              .replace(/^#+\s*/, "")
              .replace(/\*\*/g, "");

            return (
              <h3
                key={index}
                className="pt-3 text-base font-semibold text-white"
              >
                {heading}
              </h3>
            );
          }

          // Separator
          if (line === "---" || line === "***" || line === "___") {
            return (
              <div
                key={index}
                className="my-4 border-t border-slate-800"
              />
            );
          }

          // Markdown table
          if (line.startsWith("|")) {
            const cells = line
              .split("|")
              .map((cell) => cell.trim())
              .filter(Boolean);

            if (
              cells.length > 0 &&
              cells.every((cell) => /^[-:]+$/.test(cell))
            ) {
              return null;
            }

            return (
              <div
                key={index}
                className="grid gap-3 rounded-lg border border-slate-800 bg-[#0D1120] p-3 text-sm text-slate-300"
              >
                {cells.map((cell, cellIndex) => (
                  <div key={cellIndex}>
                    {cell.replace(/\*\*/g, "").replace(/`/g, "")}
                  </div>
                ))}
              </div>
            );
          }

          // Numbered item
          const numberedMatch = line.match(/^(\d+)[.)]\s+(.*)$/);

          if (numberedMatch) {
            return (
              <div
                key={index}
                className="flex gap-3 rounded-xl border border-slate-800 bg-[#111528] p-4"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
                  {numberedMatch[1]}
                </div>

                <p className="text-sm leading-6 text-slate-300">
                  {numberedMatch[2].replace(/\*\*/g, "").replace(/`/g, "")}
                </p>
              </div>
            );
          }

          // Bullet
          const bulletMatch = line.match(/^[-*•]\s+(.*)$/);

          if (bulletMatch) {
            return (
              <div
                key={index}
                className="flex gap-3 rounded-lg border border-slate-800/80 bg-[#111528] p-3"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />

                <p className="text-sm leading-6 text-slate-300">
                  {bulletMatch[1].replace(/\*\*/g, "").replace(/`/g, "")}
                </p>
              </div>
            );
          }

          // Normal paragraph
          return (
            <p
              key={index}
              className="text-sm leading-7 text-slate-300"
            >
              {line.replace(/\*\*/g, "").replace(/`/g, "")}
            </p>
          );
        })}
      </div>
    );
  };

  /*
  ====================================================
  RENDER
  ====================================================
  */
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0D1120] p-5 text-slate-200 sm:p-8">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-xl ring-1 ring-indigo-500/30">
            🤝
          </span>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Multi-Agent Collaboration
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Let multiple AI agents analyze your project meeting and
              generate actionable project intelligence.
            </p>
          </div>
        </div>

        {result && (
          <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            AI Analysis Complete
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* INPUT SECTION */}
      {/* ================================================= */}

      <div className="rounded-2xl border border-slate-800 bg-[#111528] p-4 sm:p-6">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-white">
            Meeting Intelligence
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Enter your project details and meeting discussion.
          </p>
        </div>

        {/* PROJECT TITLE */}

        <div className="mb-5">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Project Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Customer Portal Revamp"
            className="w-full rounded-xl border border-slate-700 bg-[#0D1120] px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
          />
        </div>

        {/* MEETING NOTES */}

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Meeting Notes
          </label>

          <textarea
            rows="10"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste meeting notes here..."
            className="w-full resize-none rounded-xl border border-slate-700 bg-[#0D1120] px-4 py-3 text-sm leading-6 text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
          />
        </div>

        {/* RUN BUTTON */}

        <button
          onClick={runAgents}
          disabled={loading}
          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/10 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}

          {loading ? "Running AI agents..." : "🚀 Run Multi-Agent Analysis"}
        </button>
      </div>

      {/* ================================================= */}
      {/* AI PROJECT INTELLIGENCE */}
      {/* ================================================= */}

      {notice && (
        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-5 text-amber-300">
          {notice}
        </div>
      )}

      {result && (
        <div ref={resultRef} className="mt-10 scroll-mt-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />

                <h2 className="text-lg font-semibold text-white">
                  AI Project Intelligence
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Insights generated from your project meeting.
              </p>
            </div>

            <button
              onClick={startNewMeeting}
              className="w-fit rounded-lg border border-indigo-500/40 px-3.5 py-2 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/10"
            >
              + New meeting
            </button>
          </div>

          {/* CARD GRID */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resultSections.map((section) => {
              const content = result?.[section.key];
              const style = accentStyles[section.accent];
              const count = getCount(content);

              return (
                <div
                  key={section.key}
                  className={`group flex min-h-[250px] flex-col rounded-2xl border border-slate-800 bg-[#111528] p-5 transition duration-200 hover:-translate-y-0.5 hover:bg-[#13182d] ${style.glow}`}
                >
                  {/* CARD HEADER */}

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ring-1 ${style.icon}`}
                      >
                        {section.icon}
                      </span>

                      <div>
                        <h3
                          className={`text-sm font-semibold ${style.title}`}
                        >
                          {section.label}
                        </h3>

                        <p className="mt-0.5 text-[11px] text-slate-600">
                          {section.description}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full border border-slate-700 bg-[#0D1120] px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      {count}
                    </span>
                  </div>

                  {/* PREVIEW */}

                  <div className="mt-5 flex-1">
                    <p className="line-clamp-5 text-sm leading-6 text-slate-400">
                      {getPreview(content)}
                    </p>
                  </div>

                  {/* FOOTER */}

                  <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                    <span className="text-[11px] text-slate-600">
                      AI Generated
                    </span>

                    <button
                      onClick={() => setSelectedSection(section)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${style.button}`}
                    >
                      Read More →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* AI RECOMMENDATIONS */}
      {/* ================================================= */}

      <div className="mt-10">
        {/* SECTION HEADER */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-sm ring-1 ring-indigo-500/20">
                🤖
              </span>

              <h2 className="text-lg font-semibold text-white">
                AI Recommendations
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Review AI-generated actions before they are added to your
              project.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs font-medium text-amber-400">
              {recommendations.length} Pending
            </span>

            <button
              onClick={() => fetchRecommendations(currentMeetingId)}
              disabled={recommendationsLoading || !currentMeetingId}
              className="rounded-lg border border-slate-700 bg-[#111528] px-3 py-1.5 text-xs text-slate-400 transition hover:border-indigo-500/40 hover:text-white disabled:opacity-50"
            >
              {recommendationsLoading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* LOADING */}

        {recommendationsLoading && (
          <div className="rounded-2xl border border-slate-800 bg-[#111528] p-8 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />

            <p className="text-sm text-slate-500">
              Loading AI recommendations...
            </p>
          </div>
        )}

        {/* EMPTY */}

        {!recommendationsLoading && recommendations.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-[#111528] p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/50 text-xl">
              ✓
            </div>

            <h3 className="mt-4 text-sm font-semibold text-white">
              {currentMeetingId
                ? "No Pending Recommendations"
                : "No analysis yet"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
              {currentMeetingId
                ? "All recommendations for this meeting have been reviewed."
                : "Run a multi-agent analysis to see AI recommendations for your meeting."}
            </p>
          </div>
        )}

        {/* RECOMMENDATION GRID */}

        {!recommendationsLoading && recommendations.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {recommendations.map((recommendation) => {
              const isProcessing = processingId === recommendation.id;

              // Clean title + non-duplicated description + due day
              const parsed = parseRecommendation(recommendation);

              const priorityColor =
                recommendation.priority === "High"
                  ? "text-rose-400"
                  : recommendation.priority === "Medium"
                  ? "text-amber-400"
                  : "text-emerald-400";

              return (
                <div
                  key={recommendation.id}
                  className="group flex flex-col rounded-2xl border border-slate-800 bg-[#111528] p-5 transition duration-200 hover:border-indigo-500/30 hover:bg-[#13182d]"
                >
                  {/* CARD HEADER */}

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-lg ring-1 ring-indigo-500/20">
                      {recommendation.type === "task" ? "✓" : "🤖"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold leading-5 text-white">
                        {parsed.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-400">
                          Pending
                        </span>

                        <span className="text-xs capitalize text-slate-600">
                          AI {recommendation.type || "recommendation"}
                        </span>

                        {parsed.dueDay && (
                          <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-400">
                            📅 {parsed.dueDay}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DESCRIPTION (only when it adds new information) */}

                  {parsed.description && (
                    <p className="mt-4 text-sm leading-6 text-slate-400">
                      {parsed.description}
                    </p>
                  )}

                  {/* PRIORITY */}

                  <div className="mt-4">
                    <div className="w-fit rounded-xl border border-slate-800 bg-[#0D1120] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-600">
                        Priority
                      </p>

                      <p className={`mt-0.5 text-xs font-medium ${priorityColor}`}>
                        {recommendation.priority || "Not specified"}
                      </p>
                    </div>
                  </div>

                  {/* AI REASON */}

                  {recommendation.ai_reason && (
                    <div className="mt-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">✨</span>

                        <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
                          AI Reason
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {recommendation.ai_reason}
                      </p>
                    </div>
                  )}

                  {/* ACTION AREA (pinned to the bottom so buttons line up) */}

                  <div className="mt-auto pt-5">
                    <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[10px] text-slate-600">
                        Requires human approval
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            rejectRecommendation(recommendation.id)
                          }
                          disabled={isProcessing}
                          className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs font-medium text-rose-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing ? "Processing..." : "✕ Reject"}
                        </button>

                        <button
                          onClick={() =>
                            approveRecommendation(recommendation.id)
                          }
                          disabled={isProcessing}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        >
                          {isProcessing ? "Processing..." : "✓ Approve"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* READ MORE MODAL */}
      {/* ================================================= */}

      {selectedSection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedSection(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0D1120] shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ring-1 ${
                    accentStyles[selectedSection.accent].icon
                  }`}
                >
                  {selectedSection.icon}
                </span>

                <div>
                  <h2 className="text-base font-semibold text-white sm:text-lg">
                    {selectedSection.label}
                  </h2>

                  <p className="text-xs text-slate-500">
                    AI-generated project intelligence
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSection(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div className="overflow-y-auto px-5 py-6 sm:px-7">
              {formatContent(result?.[selectedSection.key])}
            </div>

            {/* MODAL FOOTER */}

            <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4 sm:px-6">
              <span className="text-xs text-slate-600">
                Generated by Multi-Agent AI
              </span>

              <button
                onClick={() => setSelectedSection(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiAgent;