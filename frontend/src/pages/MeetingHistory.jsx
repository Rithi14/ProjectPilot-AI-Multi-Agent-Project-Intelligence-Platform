import { useEffect, useState } from "react"
import axios from "axios"
import jsPDF from "jspdf"
const API_URL = import.meta.env.VITE_API_URL;

function MeetingHistory() {

  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedMeeting, setSelectedMeeting] =
    useState(null)

  const [question, setQuestion] =
    useState("")

  const [answer, setAnswer] =
    useState("")

  // =========================
  // UI-ONLY: tracks which meeting rows are expanded (View Details)
  // =========================
  const [expandedIds, setExpandedIds] = useState({})

  const toggleDetails = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  useEffect(() => {

    fetchMeetings()

  }, [])

  const fetchMeetings = async () => {

    try {

      const res =
       await axios.get(
  `${API_URL}/meetings`
)

      setMeetings(res.data)

    }

    catch (error) {

      console.log(error)

    }

    finally {

      setLoading(false)

    }

  }

  const askProjectAI = async () => {

    if (!question.trim()) {

      alert("Please enter a question")

      return

    }

    try {

     const res =
  await axios.post(
    `${API_URL}/project-ai`,
    {
      meetingId: selectedMeeting.id,
      question
    }
  )

      setAnswer(
        res.data.answer
      )

    }

    catch (error) {

      console.log(error)

    }

  }

  const deleteMeeting = async (id) => {

    const confirmDelete =
      window.confirm(
        "Delete this meeting?"
      )

    if (!confirmDelete)
      return

    try {

      await axios.delete(
  `${API_URL}/meetings/${id}`
)

      fetchMeetings()

    }

    catch (error) {

      console.log(error)

    }

  }

  const downloadPDF = (meeting) => {

    const doc = new jsPDF()

    doc.setFontSize(20)

    doc.text(
      "AI Multi-Agent Project Report",
      20,
      20
    )

    doc.setFontSize(14)

    doc.text(
      `Project: ${meeting.title}`,
      20,
      40
    )

    doc.text(
      `Date: ${
        meeting.created_at
          ? new Date(
              meeting.created_at
            ).toLocaleString()
          : "N/A"
      }`,
      20,
      55
    )

    doc.setFontSize(12)

    doc.text(
      "Summary",
      20,
      75
    )

    doc.text(
      meeting.summary ||
      "No Summary",

      20,
      85,

      {
        maxWidth: 170
      }

    )

    doc.text(
      "Tasks",
      20,
      130
    )

    doc.text(
      meeting.tasks ||
      "No Tasks",

      20,
      140,

      {
        maxWidth: 170
      }

    )

    doc.text(
      "Reminders",
      20,
      190
    )

    doc.text(
      meeting.reminders ||
      "No Reminders",

      20,
      200,

      {
        maxWidth: 170
      }

    )

    doc.save(
      `${meeting.title}.pdf`
    )

  }

  return (

    <div className="mt-10 w-full">

      <div className="rounded-3xl border border-slate-800 bg-[#0D1120] p-8">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Meeting history
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? "Loading meetings…" : `${meetings.length} recorded meeting${meetings.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-lg ring-1 ring-indigo-500/30">
            📋
          </span>
        </div>

        {

          loading ? (

            <div className="rounded-xl border border-slate-800 bg-[#111528] px-5 py-8 text-center text-sm text-slate-400">

              Loading meetings…

            </div>

          ) : meetings.length === 0 ? (

            <div className="rounded-xl border border-dashed border-slate-800 px-5 py-10 text-center text-sm text-slate-500">

              No meeting records found

            </div>

          ) : (

            meetings.map((meeting) => {

              const isExpanded = !!expandedIds[meeting.id]

              return (

              <div

                key={meeting.id}

                className="mb-4 rounded-2xl border border-slate-800 bg-[#111528] p-6 transition hover:border-slate-700"

              >

                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div className="flex items-center gap-3">

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-medium text-slate-400">
                      🗓️
                    </span>

                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {
                          meeting.created_at
                            ? new Date(
                                meeting.created_at
                              ).toLocaleString()
                            : "No date"
                        }
                      </p>
                      <p className="text-xs text-slate-500">
                        {isExpanded ? meeting.title : "Meeting record"}
                      </p>
                    </div>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    <button

                      onClick={() =>
                        toggleDetails(
                          meeting.id
                        )
                      }

                      className="rounded-lg border border-indigo-500/40 px-3.5 py-2 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/10"

                    >

                      {isExpanded ? "Hide details" : "View details"}

                    </button>

                    <button

                      onClick={() =>
                        downloadPDF(
                          meeting
                        )
                      }

                      className="rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"

                    >

                      📄 PDF

                    </button>

                    <button

                      onClick={() =>
                        setSelectedMeeting(
                          meeting
                        )
                      }

                      className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"

                    >

                      🤖 Ask AI

                    </button>

                    <button

                      onClick={() =>
                        deleteMeeting(
                          meeting.id
                        )
                      }

                      className="rounded-lg border border-rose-500/30 px-3.5 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"

                    >

                      🗑 Delete

                    </button>

                  </div>

                </div>

                {

                  isExpanded && (

                    <div className="mt-6 border-t border-slate-800 pt-6">

                      <h3 className="text-lg font-semibold tracking-tight text-white">

                        {meeting.title}

                      </h3>

                      <div className="mt-5">

                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-pink-400">

                          📄 Summary

                        </h4>

                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">

                          {
                            meeting.summary ||
                            "No summary"
                          }

                        </p>

                      </div>

                      {

                        meeting.tasks && (

                          <div className="mt-5">

                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">

                              ✅ Tasks

                            </h4>

                            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">

                              {meeting.tasks}

                            </p>

                          </div>

                        )

                      }

                      {

                        meeting.reminders && (

                          <div className="mt-5">

                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">

                              ⏰ Reminders

                            </h4>

                            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">

                              {meeting.reminders}

                            </p>

                          </div>

                        )

                      }
                      {
  meeting.risks && (

    <div className="mt-5">

      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-400">
        🚨 Risks
      </h4>

      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
        {meeting.risks}
      </p>

    </div>

  )
}
{
  meeting.timeline && (

    <div className="mt-5">

      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-400">
        📅 Timeline
      </h4>

      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
        {meeting.timeline}
      </p>

    </div>

  )
}
{
  meeting.decisions && (

    <div className="mt-5">

      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-400">
        🎯 Decisions
      </h4>

      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
        {meeting.decisions}
      </p>

    </div>

  )
}

                    </div>

                  )

                }

              </div>

              )

            })

          )

        }

      </div>

      {

        selectedMeeting && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-[#0D1120] p-7 shadow-2xl shadow-black/40">

              <div className="mb-1 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-sm ring-1 ring-indigo-500/30">🤖</span>
                <h2 className="text-lg font-semibold tracking-tight text-white">

                  AI project assistant

                </h2>
              </div>

              <h3 className="mb-4 text-sm text-slate-500">

                {selectedMeeting.title}

              </h3>

              <textarea

                rows="4"

                value={question}

                onChange={(e) =>
                  setQuestion(
                    e.target.value
                  )
                }

                placeholder="Ask anything about this project…"

                className="w-full shrink-0 resize-none rounded-lg border border-slate-700 bg-[#111528] p-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"

              />

              <div className="mt-4 flex shrink-0 gap-3">

                <button

                  onClick={askProjectAI}

                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"

                >

                  Ask AI

                </button>

                <button

                  onClick={() => {

                    setSelectedMeeting(null)
                    setQuestion("")
                    setAnswer("")

                  }}

                  className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"

                >

                  Close

                </button>

              </div>

              {

                answer && (

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

                )

              }

            </div>

          </div>

        )

      }

    </div>

  )

}

export default MeetingHistory