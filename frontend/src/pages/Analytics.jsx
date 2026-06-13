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
      color: "#A855F7"
    },

    {
      name: "Tasks",
      value: stats.tasks,
      color: "#4ADE80"
    },

    {
      name: "Meetings",
      value: stats.meetings,
      color: "#FACC15"
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

  return (

    <div className="w-full mt-10">

     <div className="flex justify-between items-center mb-8">

  <div>

    <h1 className="text-5xl font-bold text-purple-400">
      📊 AI Project Performance Dashboard
    </h1>

    <p className="text-gray-400 mt-2">
      Real-Time Insights for Projects, Tasks and Meetings
    </p>

  </div>

  <div className="flex gap-3">

    <button

      onClick={downloadReport}

      className="
        bg-purple-600
        hover:bg-purple-700
        px-6
        py-3
        rounded-xl
        font-semibold
        text-white
      "

    >

      📄 Download Report

    </button>

    <button

      onClick={generateExecutiveReport}

      className="
        bg-green-600
        hover:bg-green-700
        px-6
        py-3
        rounded-xl
        font-semibold
        text-white
      "

    >

      📑 Executive Report

    </button>

  </div>

</div>
      <div className="grid grid-cols-4 gap-6">

        <div className="bg-slate-800 rounded-3xl p-8">

          <h3 className="text-gray-400">
            📁 Projects
          </h3>

          <p className="text-5xl font-bold text-purple-400 mt-4">

            {stats.projects}

          </p>

        </div>

        <div className="bg-slate-800 rounded-3xl p-8">

          <h3 className="text-gray-400">
            ✅ Tasks
          </h3>

          <p className="text-5xl font-bold text-green-400 mt-4">

            {stats.tasks}

          </p>

        </div>

        <div className="bg-slate-800 rounded-3xl p-8">

          <h3 className="text-gray-400">
            🗓️ Meetings
          </h3>

          <p className="text-5xl font-bold text-yellow-400 mt-4">

            {stats.meetings}

          </p>

        </div>

        <div className="bg-slate-800 rounded-3xl p-8">

          <h3 className="text-gray-400">
            🎯 Completion
          </h3>

          <p className="text-5xl font-bold text-cyan-400 mt-4">

            {completionRate}%

          </p>

        </div>

      </div>

      {/* CHARTS */}

      <div className="grid grid-cols-2 gap-8 mt-10">

        <div className="bg-slate-800 rounded-3xl p-6">

          <h2 className="text-2xl font-bold mb-6">

            📈 Project Overview

          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <BarChart data={barData}>

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="value"
                fill="#A855F7"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        <div className="bg-slate-800 rounded-3xl p-6">

          <h2 className="text-2xl font-bold mb-6">

            🥧 Distribution

          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
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

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* PROGRESS */}

      <div className="bg-slate-800 rounded-3xl p-8 mt-10">

        <h2 className="text-3xl font-bold mb-6">

          🎯 Project Completion Progress

        </h2>

        <div className="w-full bg-slate-700 rounded-full h-6">

          <div

            className="
              bg-purple-500
              h-6
              rounded-full
              text-center
              text-sm
            "

            style={{
              width: `${completionRate}%`
            }}

          >

            {completionRate}%

          </div>

        </div>

      </div>
      <div className="bg-slate-800 rounded-3xl p-8 mt-10">

  <h2 className="text-3xl font-bold text-green-400 mb-6">

    ❤️ AI Project Health Score

  </h2>

  <div className="w-full bg-slate-700 rounded-full h-8">

    <div

      className="
        bg-green-500
        h-8
        rounded-full
        text-center
        text-white
        font-bold
      "

      style={{
        width:
        `${healthScore}%`
      }}

    >

      {healthScore}%

    </div>

  </div>

  <p className="text-gray-300 mt-4">

    Status :

    {

      healthScore > 80

      ? " 🟢 Healthy"

      : healthScore > 50

      ? " 🟡 Moderate"

      : " 🔴 Critical"

    }

  </p>

</div>




<div className="bg-slate-800 rounded-3xl p-8 mt-10">

  <h2 className="text-3xl font-bold text-cyan-400 mb-6">

    🤖 AI Weekly Summary

  </h2>

  <pre className="text-gray-300 whitespace-pre-wrap">

    {weeklySummary}

  </pre>

</div>

      {/* RECENT ACTIVITY */}

      <div className="bg-slate-800 rounded-3xl p-8 mt-10">

        <h2 className="text-3xl font-bold mb-6">

          ⚡ Recent Activity

        </h2>

        <div className="space-y-4">

          <div className="bg-slate-700 p-4 rounded-xl">
            🟢 New Meeting Added
          </div>

          <div className="bg-slate-700 p-4 rounded-xl">
            🟢 AI Summary Generated
          </div>

          <div className="bg-slate-700 p-4 rounded-xl">
            🟡 Reminder Created
          </div>

          <div className="bg-slate-700 p-4 rounded-xl">
            🔴 Risk Detected
          </div>

        </div>

      </div>

    </div>

  )

}

export default Analytics