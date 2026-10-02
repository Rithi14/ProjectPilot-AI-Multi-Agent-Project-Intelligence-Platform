import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";

const API_URL = import.meta.env.VITE_API_URL;

const SECTIONS = [
  { key: "summary", label: "Summary", icon: "📄", color: "text-pink-400" },
  { key: "tasks", label: "Tasks", icon: "✅", color: "text-emerald-400" },
  { key: "reminders", label: "Reminders", icon: "⏰", color: "text-amber-400" },
  { key: "risks", label: "Risks", icon: "🚨", color: "text-rose-400" },
  { key: "timeline", label: "Timeline", icon: "📅", color: "text-sky-400" },
  { key: "decisions", label: "Decisions", icon: "🎯", color: "text-violet-400" },
];

const STATUS_STYLES = {
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  approved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  rejected: "border-rose-500/20 bg-rose-500/10 text-rose-400",
};

const PRIORITY_STYLES = {
  Critical: "text-rose-400",
  High: "text-rose-400",
  Medium: "text-amber-400",
  Low: "text-emerald-400",
};

// ============================================================
// SAFE TEXT CONVERTER
// ============================================================
const safeText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;

  if (typeof value === "string") {
    // Stored JSON arrays may arrive as strings
    const trimmed = value.trim();

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return safeText(JSON.parse(trimmed), fallback);
      } catch (err) {
        return value;
      }
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;

        if (typeof item === "object" && item !== null) {
          return (
            item.title ||
            item.task ||
            item.name ||
            item.description ||
            Object.values(item)
              .filter((v) => typeof v === "string" || typeof v === "number")
              .join(" – ")
          );
        }

        return String(item);
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "object") {
    return (
      value.text ||
      value.content ||
      value.summary ||
      value.description ||
      Object.entries(value)
        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
        .join("\n")
    );
  }

  return String(value);
};

const toLines = (value) =>
  safeText(value)
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*[-*•]\s*/, "")
        .replace(/^\s*\d+[.)]\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .trim()
    )
    .filter(Boolean);

// ============================================================
// GET INSIGHT FIELD
// ============================================================
const getMeetingField = (meeting, field) => {
  if (!meeting) return "";

  if (meeting[field] !== undefined && meeting[field] !== null) {
    return meeting[field];
  }

  if (
    meeting.insights &&
    typeof meeting.insights === "object" &&
    meeting.insights[field] !== undefined
  ) {
    return meeting.insights[field];
  }

  return "";
};

const hasInsights = (meeting) =>
  SECTIONS.some((s) => toLines(getMeetingField(meeting, s.key)).length > 0);

// ============================================================
// FORMAT DATE
// ============================================================
const formatMeetingDate = (meeting) => {
  const dateValue =
    meeting?.created_at ||
    meeting?.createdAt ||
    meeting?.date ||
    meeting?.meeting_date;

  if (!dateValue) return "No date";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "No date";

  return date.toLocaleString();
};

function MeetingHistory() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [askingAI, setAskingAI] = useState(false);

  // Tracks expanded meeting cards
  const [expandedIds, setExpandedIds] = useState({});

  // Tracks meetings whose insights are being loaded
  const [detailsLoadingIds, setDetailsLoadingIds] = useState({});

  // ============================================================
  // Load meetings when page opens
  // ============================================================
  useEffect(() => {
    fetchMeetings();
  }, []);

  // ============================================================
  // FETCH MEETING HISTORY
  // ============================================================
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await axios.get(`${API_URL}/meetings`);

      console.log("MEETING HISTORY API RESPONSE:", res.data);

      let meetingData = [];

      if (Array.isArray(res.data)) {
        meetingData = res.data;
      } else if (Array.isArray(res.data?.meetings)) {
        meetingData = res.data.meetings;
      } else if (Array.isArray(res.data?.data)) {
        meetingData = res.data.data;
      } else if (Array.isArray(res.data?.results)) {
        meetingData = res.data.results;
      }

      setMeetings(meetingData);
    } catch (error) {
      console.error("FETCH MEETINGS ERROR:", error);

      setMeetings([]);

      setErrorMessage(
        error?.response?.data?.message || "Failed to load meeting history."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD INSIGHTS FOR ONE MEETING (fallback when the list
  // endpoint did not include them)
  // ============================================================
  const loadInsights = async (meetingId) => {
    try {
      setDetailsLoadingIds((prev) => ({ ...prev, [meetingId]: true }));

      const res = await axios.get(`${API_URL}/meetings/insights/${meetingId}`);

      const insights = res.data?.insights;

      if (insights) {
        setMeetings((prev) =>
          prev.map((m) => (m.id === meetingId ? { ...m, insights } : m))
        );
      }
    } catch (error) {
      // 404 simply means no insights were saved for this meeting
      console.log("LOAD INSIGHTS:", error?.response?.status || error.message);
    } finally {
      setDetailsLoadingIds((prev) => {
        const updated = { ...prev };
        delete updated[meetingId];
        return updated;
      });
    }
  };

  // ============================================================
  // Toggle meeting details
  // ============================================================
  const toggleDetails = (meeting) => {
    const id = meeting.id;
    const willExpand = !expandedIds[id];

    setExpandedIds((prev) => ({ ...prev, [id]: willExpand }));

    if (willExpand && !hasInsights(meeting)) {
      loadInsights(id);
    }
  };

  // ============================================================
  // ASK PROJECT AI
  // ============================================================
  const askProjectAI = async () => {
    if (!question.trim()) {
      alert("Please enter a question");
      return;
    }

    if (!selectedMeeting?.id) {
      alert("No meeting selected");
      return;
    }

    try {
      setAskingAI(true);
      setAnswer("");

      const res = await axios.post(`${API_URL}/project-ai`, {
        meetingId: selectedMeeting.id,
        question: question.trim(),
      });

      setAnswer(
        res.data?.answer || res.data?.response || "No answer was returned by AI."
      );
    } catch (error) {
      console.error("PROJECT AI ERROR:", error);

      setAnswer(
        error?.response?.data?.message || "Failed to get an AI response."
      );
    } finally {
      setAskingAI(false);
    }
  };

  // ============================================================
  // DELETE MEETING
  // ============================================================
  const deleteMeeting = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this meeting and its AI insights?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/meetings/${id}`);

      setMeetings((prev) =>
        Array.isArray(prev) ? prev.filter((meeting) => meeting.id !== id) : []
      );

      setExpandedIds((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      await fetchMeetings();
    } catch (error) {
      console.error("DELETE MEETING ERROR:", error);

      alert(error?.response?.data?.message || "Failed to delete meeting.");
    }
  };

  // ============================================================
  // DOWNLOAD PDF
  // ============================================================
  const downloadPDF = (meeting) => {
    try {
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const margin = 20;
      const maxWidth = pageWidth - margin * 2;

      let y = 20;

      const title = meeting?.title || "Meeting Report";

      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.text("AI Multi-Agent Project Report", margin, y);

      y += 15;

      doc.setFontSize(14);
      doc.setFont(undefined, "normal");
      doc.text(`Project: ${title}`, margin, y);

      y += 10;

      doc.setFontSize(10);
      doc.text(`Date: ${formatMeetingDate(meeting)}`, margin, y);

      y += 15;

      const addSection = (heading, text) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(13);
        doc.setFont(undefined, "bold");
        doc.text(heading, margin, y);

        y += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, "normal");

        const lines = doc.splitTextToSize(
          text || "No information available.",
          maxWidth
        );

        lines.forEach((line) => {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }

          doc.text(line, margin, y);
          y += 5;
        });

        y += 8;
      };

      SECTIONS.forEach((section) => {
        const lines = toLines(getMeetingField(meeting, section.key));

        addSection(
          section.label,
          section.key === "summary"
            ? lines.join("\n")
            : lines.map((l) => `- ${l}`).join("\n")
        );
      });

      const recs = Array.isArray(meeting?.recommendations)
        ? meeting.recommendations
        : [];

      addSection(
        "AI Recommendations",
        recs.length
          ? recs
              .map(
                (r) =>
                  `- ${r.title} [${r.priority || "Medium"} | ${r.status}]` +
                  (r.ai_reason ? `\n  Reason: ${r.ai_reason}` : "") +
                  (r.status === "rejected" && r.rejection_reason
                    ? `\n  Rejected: ${r.rejection_reason}`
                    : "")
              )
              .join("\n")
          : "No recommendations."
      );

      doc.save(`${title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
    } catch (error) {
      console.error("PDF EXPORT ERROR:", error);
      alert("Failed to create PDF.");
    }
  };

  // ============================================================
  // CLOSE AI MODAL
  // ============================================================
  const closeAIModal = () => {
    setSelectedMeeting(null);
    setQuestion("");
    setAnswer("");
    setAskingAI(false);
  };

  // ============================================================
  // SECTION BODY RENDERER
  // ============================================================
  const renderSectionBody = (key, value) => {
    const lines = toLines(value);

    if (lines.length === 0) return null;

    // Summary reads best as paragraphs
    if (key === "summary" || lines.length === 1) {
      return (
        <div className="space-y-2">
          {lines.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-300">
              {line}
            </p>
          ))}
        </div>
      );
    }

    return (
      <ul className="space-y-2">
        {lines.map((line, i) => (
          <li
            key={i}
            className="flex gap-3 text-sm leading-relaxed text-slate-300"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="mt-10 w-full">
      <div className="rounded-3xl border border-slate-800 bg-[#0D1120] p-8">
        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Meeting history
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading meetings…"
                : `${meetings.length} recorded meeting${
                    meetings.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-lg ring-1 ring-indigo-500/30">
            📋
          </span>
        </div>

        {/* ERROR */}
        {errorMessage && !loading && (
          <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
            <p className="font-medium">Unable to load meeting history</p>

            <p className="mt-1 text-rose-400/80">{errorMessage}</p>

            <button
              onClick={fetchMeetings}
              className="mt-3 rounded-lg border border-rose-500/40 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING / EMPTY / LIST */}
        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-[#111528] px-5 py-8 text-center text-sm text-slate-400">
            Loading meetings…
          </div>
        ) : meetings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 px-5 py-10 text-center">
            <div className="text-3xl">📋</div>

            <p className="mt-3 text-sm font-medium text-slate-300">
              No meeting records found
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Run an AI meeting analysis to create a meeting record.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => {
              const isExpanded = !!expandedIds[meeting.id];
              const isLoadingDetails = !!detailsLoadingIds[meeting.id];

              const recommendations = Array.isArray(meeting.recommendations)
                ? meeting.recommendations
                : [];

              const pendingCount = recommendations.filter(
                (r) => r.status === "pending"
              ).length;

              const visibleSections = SECTIONS.filter(
                (s) => toLines(getMeetingField(meeting, s.key)).length > 0
              );

              return (
                <div
                  key={meeting.id}
                  className="rounded-2xl border border-slate-800 bg-[#111528] p-6 transition hover:border-slate-700"
                >
                  {/* MEETING HEADER */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-medium text-slate-400">
                        🗓️
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {meeting.title || "Untitled meeting"}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500">
                            {formatMeetingDate(meeting)}
                          </span>

                          {recommendations.length > 0 && (
                            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                              {recommendations.length} recommendation
                              {recommendations.length === 1 ? "" : "s"}
                              {pendingCount > 0 && ` · ${pendingCount} pending`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleDetails(meeting)}
                        className="rounded-lg border border-indigo-500/40 px-3.5 py-2 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/10"
                      >
                        {isExpanded ? "Hide details" : "View details"}
                      </button>

                      <button
                        onClick={() => downloadPDF(meeting)}
                        className="rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
                      >
                        📄 PDF
                      </button>

                      <button
                        onClick={() => setSelectedMeeting(meeting)}
                        className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
                      >
                        🤖 Ask AI
                      </button>

                      <button
                        onClick={() => deleteMeeting(meeting.id)}
                        className="rounded-lg border border-rose-500/30 px-3.5 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>

                  {/* DETAILS */}
                  {isExpanded && (
                    <div className="mt-6 border-t border-slate-800 pt-6">
                      {isLoadingDetails && (
                        <p className="text-sm text-slate-500">
                          Loading AI insights…
                        </p>
                      )}

                      {!isLoadingDetails &&
                        visibleSections.length === 0 &&
                        recommendations.length === 0 && (
                          <div className="rounded-xl border border-dashed border-slate-800 px-5 py-6 text-center text-sm text-slate-500">
                            No AI insights were saved for this meeting.
                          </div>
                        )}

                      {/* INSIGHT SECTIONS */}
                      <div className="space-y-6">
                        {visibleSections.map((section) => (
                          <div key={section.key}>
                            <h4
                              className={`mb-3 text-xs font-semibold uppercase tracking-wide ${section.color}`}
                            >
                              {section.icon} {section.label}
                            </h4>

                            {renderSectionBody(
                              section.key,
                              getMeetingField(meeting, section.key)
                            )}
                          </div>
                        ))}

                        {/* AI RECOMMENDATIONS */}
                        {recommendations.length > 0 && (
                          <div>
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-400">
                              🤖 AI Recommendations
                            </h4>

                            <div className="space-y-3">
                              {recommendations.map((rec) => (
                                <div
                                  key={rec.id}
                                  className="rounded-xl border border-slate-800 bg-[#0D1120] p-4"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <p className="min-w-0 flex-1 text-sm font-medium leading-5 text-slate-200">
                                      {rec.title}
                                    </p>

                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-xs font-medium ${
                                          PRIORITY_STYLES[rec.priority] ||
                                          "text-slate-400"
                                        }`}
                                      >
                                        {rec.priority || "Medium"}
                                      </span>

                                      <span
                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${
                                          STATUS_STYLES[rec.status] ||
                                          STATUS_STYLES.pending
                                        }`}
                                      >
                                        {rec.status || "pending"}
                                      </span>
                                    </div>
                                  </div>

                                  {rec.ai_reason && (
                                    <p className="mt-3 text-xs leading-5 text-slate-400">
                                      <span className="font-semibold text-indigo-400">
                                        ✨ Reason:{" "}
                                      </span>
                                      {rec.ai_reason}
                                    </p>
                                  )}

                                  {rec.status === "rejected" &&
                                    rec.rejection_reason && (
                                      <p className="mt-2 text-xs leading-5 text-rose-400/90">
                                        Rejected: {rec.rejection_reason}
                                      </p>
                                    )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ASK AI MODAL */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-[#0D1120] p-7 shadow-2xl shadow-black/40">
            <div className="mb-1 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-sm ring-1 ring-indigo-500/30">
                🤖
              </span>

              <h2 className="text-lg font-semibold tracking-tight text-white">
                AI project assistant
              </h2>
            </div>

            <h3 className="mb-4 truncate text-sm text-slate-500">
              {selectedMeeting.title || "Meeting"}
            </h3>

            <textarea
              rows="4"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about this project…"
              disabled={askingAI}
              className="w-full shrink-0 resize-none rounded-lg border border-slate-700 bg-[#111528] p-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />

            <div className="mt-4 flex shrink-0 gap-3">
              <button
                onClick={askProjectAI}
                disabled={askingAI}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {askingAI ? "Thinking…" : "Ask AI"}
              </button>

              <button
                onClick={closeAIModal}
                className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            {answer && (
              <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-xl border border-slate-800 bg-[#111528] p-5">
                <h4 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                  AI response
                </h4>

                <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                    {answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingHistory;