import { useEffect, useState } from "react"
import axios from "axios"
import jsPDF from "jspdf"
const API_URL = import.meta.env.VITE_API_URL;
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

function Analytics() {

  const [stats, setStats] = useState({

    projects: 0,
    tasks: 0,
    meetings: 0

  })
  const [healthScore, setHealthScore] =
  useState(0)

const [weeklySummary, setWeeklySummary] =
  useState("")

  useEffect(() => {

    fetchAnalytics()

  }, [])

  const fetchAnalytics = async () => {

    try {

      const projects =
  await axios.get(
    `${API_URL}/projects`
  )

const tasks =
  await axios.get(
    `${API_URL}/tasks`
  )

const meetings =
  await axios.get(
    `${API_URL}/meetings`
  )
      setStats({

        projects:
          projects.data.length,

        tasks:
          tasks.data.length,

        meetings:
          meetings.data.length

      })
      const score = Math.min(

  100,

  Math.round(

    (
      (
        projects.data.length +
        tasks.data.length +
        meetings.data.length
      ) / 20
    ) * 100

  )

)

setHealthScore(score)

setWeeklySummary(

`
Projects Active : ${projects.data.length}

Tasks Created : ${tasks.data.length}

Meetings Conducted : ${meetings.data.length}

Overall Progress : ${score}%
`

)

    }

    catch (error) {

      console.log(error)

    }

  }

  const completionRate =

    stats.tasks > 0

      ? Math.round(
          (stats.projects / stats.tasks) * 100
        )

      : 0

  const barData = [

    {
      name: "Projects",
      value: stats.projects
    },

    {
      name: "Tasks",
      value: stats.tasks
    },

    {
      name: "Meetings",
      value: stats.meetings
    }

  ]

  const pieData = [

    {
      name: "Projects",
      value: stats.projects,
      color: "#6366F1"
    },

    {
      name: "Tasks",
      value: stats.tasks,
      color: "#34D399"
    },

    {
      name: "Meetings",
      value: stats.meetings,
      color: "#FBBF24"
    }

  ]

  const downloadReport = () => {

    const doc = new jsPDF()

    doc.setFontSize(20)

    doc.text(
      "AI Multi-Agent Project Analytics Report",
      20,
      20
    )

    doc.setFontSize(12)

    doc.text(
      `Projects : ${stats.projects}`,
      20,
      50
    )

    doc.text(
      `Tasks : ${stats.tasks}`,
      20,
      65
    )

    doc.text(
      `Meetings : ${stats.meetings}`,
      20,
      80
    )

    doc.text(
      `Completion Rate : ${completionRate}%`,
      20,
      95
    )

    doc.text(
      `Generated On : ${new Date().toLocaleString()}`,
      20,
      120
    )

    doc.save(
      "AI_Project_Report.pdf"
    )

  }
  const generateExecutiveReport = () => {

  const doc = new jsPDF()

  doc.setFontSize(22)

  doc.text(
    "Executive Project Report",
    20,
    20
  )

  doc.setFontSize(14)

  doc.text(
    `Projects : ${stats.projects}`,
    20,
    50
  )

  doc.text(
    `Tasks : ${stats.tasks}`,
    20,
    65
  )

  doc.text(
    `Meetings : ${stats.meetings}`,
    20,
    80
  )

  doc.text(
    `Health Score : ${healthScore}%`,
    20,
    95
  )

  doc.text(
    "Weekly Summary",
    20,
    120
  )

  doc.text(
    weeklySummary,
    20,
    135
  )

  doc.save(
    "Executive_Report.pdf"
  )

}

  // =========================
  // UI-ONLY: summary cards + activity feed config (display only)
  // =========================
  const summaryCards = [
    { label: "Projects", icon: "📁", value: stats.projects, accent: "text-indigo-400" },
    { label: "Tasks", icon: "✅", value: stats.tasks, accent: "text-emerald-400" },
    { label: "Meetings", icon: "🗓️", value: stats.meetings, accent: "text-amber-400" },
    { label: "Completion", icon: "🎯", value: `${completionRate}%`, accent: "text-cyan-400" },
  ]

  const activityFeed = [
    { label: "New meeting added", dot: "bg-emerald-500" },
    { label: "AI summary generated", dot: "bg-emerald-500" },
    { label: "Reminder created", dot: "bg-amber-500" },
    { label: "Risk detected", dot: "bg-rose-500" },
  ]

  const healthStatus =
    healthScore > 80
      ? { label: "Healthy", dot: "bg-emerald-500", text: "text-emerald-400" }
      : healthScore > 50
      ? { label: "Moderate", dot: "bg-amber-500", text: "text-amber-400" }
      : { label: "Critical", dot: "bg-rose-500", text: "text-rose-400" }

  return (

    <div className="mt-10 w-full text-slate-200">

     <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

  <div>

    <h1 className="text-2xl font-semibold tracking-tight text-white">
      AI project performance
    </h1>

    <p className="mt-1 text-sm text-slate-500">
      Real-time insights for projects, tasks and meetings
    </p>

  </div>

  <div className="flex gap-3">

    <button

      onClick={downloadReport}

      className="rounded-xl border border-slate-700 bg-[#111528] px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"

    >

      📄 Download report

    </button>

    <button

      onClick={generateExecutiveReport}

      className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"

    >

      📑 Executive report

    </button>

  </div>

</div>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">

        {
          summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-800 bg-[#111528] p-6">

              <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <span>{card.icon}</span>
                <span>{card.label}</span>
              </h3>

              <p className={`mt-4 text-3xl font-semibold ${card.accent}`}>

                {card.value}

              </p>

            </div>
          ))
        }

      </div>

      {/* CHARTS */}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="rounded-2xl border border-slate-800 bg-[#111528] p-6">

          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-400">

            📈 Project overview

          </h2>

          <ResponsiveContainer
            width="100%"
            height={280}
          >

            <BarChart data={barData}>

              <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={{ stroke: "#1E293B" }} />

              <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={{ stroke: "#1E293B" }} />

              <Tooltip
                contentStyle={{
                  background: "#0D1120",
                  border: "1px solid #1E293B",
                  borderRadius: "8px",
                  color: "#E2E8F0"
                }}
              />

              <Bar
                dataKey="value"
                fill="#6366F1"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111528] p-6">

          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-400">

            🥧 Distribution

          </h2>

          <ResponsiveContainer
            width="100%"
            height={280}
          >

            <PieChart>

              <Pie
                data={pieData}
                dataKey="value"
                label
              >

                {

                  pieData.map(

                    (entry, index) => (

                      <Cell
                        key={index}
                        fill={entry.color}
                      />

                    )

                  )

                }

              </Pie>

              <Tooltip
                contentStyle={{
                  background: "#0D1120",
                  border: "1px solid #1E293B",
                  borderRadius: "8px",
                  color: "#E2E8F0"
                }}
              />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* PROGRESS */}

      <div className="mt-8 rounded-2xl border border-slate-800 bg-[#111528] p-7">

        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-400">

          🎯 Project completion progress

        </h2>

        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">

          <div

            className="flex h-3 items-center justify-end rounded-full bg-indigo-500 transition-all"

            style={{
              width: `${completionRate}%`
            }}

          />

        </div>

        <p className="mt-3 text-right text-sm font-medium text-indigo-400">
          {completionRate}%
        </p>

      </div>
      <div className="mt-8 rounded-2xl border border-slate-800 bg-[#111528] p-7">

  <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-400">

    ❤️ AI project health score

  </h2>

  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">

    <div

      className="h-3 rounded-full bg-emerald-500 transition-all"

      style={{
        width:
        `${healthScore}%`
      }}

    />

  </div>

  <div className="mt-4 flex items-center justify-between">

    <p className="text-sm text-slate-400">

      Status

    </p>

    <span className={`flex items-center gap-1.5 text-sm font-medium ${healthStatus.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${healthStatus.dot}`} />
      {healthStatus.label} · {healthScore}%
    </span>

  </div>

</div>




<div className="mt-8 rounded-2xl border border-slate-800 bg-[#111528] p-7">

  <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-400">

    🤖 AI weekly summary

  </h2>

  <pre className="whitespace-pre-wrap rounded-lg bg-[#0D1120] p-5 text-sm leading-relaxed text-slate-300">

    {weeklySummary}

  </pre>

</div>

      {/* RECENT ACTIVITY */}

      <div className="mt-8 rounded-2xl border border-slate-800 bg-[#111528] p-7">

        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-400">

          ⚡ Recent activity

        </h2>

        <div className="space-y-2.5">

          {
            activityFeed.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-xl bg-[#0D1120] px-4 py-3 text-sm text-slate-300">
                <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
                {item.label}
              </div>
            ))
          }

        </div>

      </div>

    </div>

  )

}

export default Analytics