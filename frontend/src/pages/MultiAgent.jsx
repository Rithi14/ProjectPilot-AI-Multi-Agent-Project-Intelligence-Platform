import { useState } from "react"
import axios from "axios"
const API_URL = import.meta.env.VITE_API_URL;

function MultiAgent() {

  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const runAgents = async () => {

    if (!title.trim()) {

      alert("Please enter project title")

      return

    }

    if (!text.trim()) {

      alert("Please enter meeting notes")

      return

    }

    try {

      setLoading(true)

      /* SAVE MEETING */

      const meetingResponse =

       
      await axios.post(
  `${API_URL}/meetings`,
  {
    title,
    notes: text
  }
)

      /* GET AI RESULT */

      setResult(
        meetingResponse.data.insights
      )

      alert(
        "Meeting Saved Successfully"
      )

    }

    catch (error) {

      console.log(error)

      alert(
        "Multi-Agent Collaboration Failed"
      )

    }

    finally {

      setLoading(false)

    }

  }

  // =========================
  // UI-ONLY: result section config (same fields, no logic change)
  // =========================
  const resultSections = [
    { key: "summary", label: "Summary", icon: "📝", accent: "indigo" },
    { key: "tasks", label: "Tasks", icon: "✅", accent: "emerald" },
    { key: "reminders", label: "Reminders", icon: "⏰", accent: "amber" },
    { key: "risks", label: "Risks", icon: "🚨", accent: "rose" },
    { key: "timeline", label: "Timeline", icon: "📅", accent: "sky" },
    { key: "decisions", label: "Decisions", icon: "🎯", accent: "violet" },
  ]

  const accentText = {
    indigo: "text-indigo-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
    sky: "text-sky-400",
    violet: "text-violet-400",
  }

  return (

    <div className="rounded-3xl border border-slate-800 bg-[#0D1120] p-8 text-slate-200">

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-lg ring-1 ring-indigo-500/30">
          🤝
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Multi-agent collaboration
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Paste meeting notes or a project discussion and let multiple AI agents collaborate
          </p>
        </div>
      </div>

      {/* PROJECT TITLE */}

      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Project title
        </label>
        <input

          type="text"

          value={title}

          onChange={(e) =>
            setTitle(
              e.target.value
            )
          }

          placeholder="e.g. Customer Portal Revamp"

          className="w-full rounded-lg border border-slate-700 bg-[#111528] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"

        />
      </div>

      {/* NOTES */}

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Meeting notes
        </label>
        <textarea

          rows="10"

          value={text}

          onChange={(e) =>
            setText(
              e.target.value
            )
          }

          placeholder="Paste meeting notes here…"

          className="w-full resize-none rounded-lg border border-slate-700 bg-[#111528] px-3.5 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"

        />
      </div>

      <button

        onClick={runAgents}

        disabled={loading}

        className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"

      >

        {

          loading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )

        }

        {

          loading

            ? "Running agents…"

            : "🚀 Run agents"

        }

      </button>

      {

        result && (

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">

            {
              resultSections.map((section) => (
                <div
                  key={section.key}
                  className="rounded-xl border border-slate-800 bg-[#111528] p-5"
                >
                  <h2 className={`mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${accentText[section.accent]}`}>
                    <span>{section.icon}</span>
                    <span>{section.label}</span>
                  </h2>

                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                    {result[section.key]}
                  </p>
                </div>
              ))
            }

          </div>

        )

      }

    </div>

  )

}

export default MultiAgent