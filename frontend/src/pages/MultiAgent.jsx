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

  return (

    <div className="bg-[#111827] border border-purple-500 rounded-3xl p-8 text-white">

      <h1 className="text-3xl font-bold text-purple-400 mb-6">

        🤝 Multi-Agent Collaboration

      </h1>

      <p className="text-gray-300 mb-4">

        Paste meeting notes or project discussion and let multiple AI agents collaborate.

      </p>

      {/* PROJECT TITLE */}

      <input

        type="text"

        value={title}

        onChange={(e) =>
          setTitle(
            e.target.value
          )
        }

        placeholder="Project Title"

        className="
          w-full
          bg-[#1F2937]
          border
          border-gray-600
          rounded-xl
          p-4
          text-white
          mb-4
          outline-none
        "

      />

      {/* NOTES */}

      <textarea

        rows="10"

        value={text}

        onChange={(e) =>
          setText(
            e.target.value
          )
        }

        placeholder="Paste meeting notes here..."

        className="
          w-full
          bg-[#1F2937]
          border
          border-gray-600
          rounded-xl
          p-4
          text-white
          outline-none
        "

      />

      <button

        onClick={runAgents}

        disabled={loading}

        className="
          mt-5
          bg-purple-600
          hover:bg-purple-700
          px-6
          py-3
          rounded-xl
          font-semibold
        "

      >

        {

          loading

            ? "Running Agents..."

            : "🚀 Run Agents"

        }

      </button>

      {

        result && (

          <div className="mt-8 space-y-6">

            {/* SUMMARY */}

            <div className="bg-[#1F2937] p-5 rounded-xl">

              <h2 className="text-xl font-bold text-purple-400 mb-2">

                📝 Summary

              </h2>

              <p className="text-gray-200 whitespace-pre-line">

                {result.summary}

              </p>

            </div>

            {/* TASKS */}

            <div className="bg-[#1F2937] p-5 rounded-xl">

              <h2 className="text-xl font-bold text-green-400 mb-2">

                ✅ Tasks

              </h2>

              <p className="text-gray-200 whitespace-pre-line">

                {result.tasks}

              </p>

            </div>

            {/* REMINDERS */}

            <div className="bg-[#1F2937] p-5 rounded-xl">

              <h2 className="text-xl font-bold text-yellow-400 mb-2">

                ⏰ Reminders

              </h2>

              <p className="text-gray-200 whitespace-pre-line">

                {result.reminders}

              </p>

            </div>
            <div className="bg-[#1F2937] p-5 rounded-xl">

  <h2 className="text-xl font-bold text-red-400 mb-2">

    🚨 Risks

  </h2>

  <p>

    {result.risks}

  </p>

</div>

<div className="bg-[#1F2937] p-5 rounded-xl">

  <h2 className="text-xl font-bold text-blue-400 mb-2">

    📅 Timeline

  </h2>

  <p>

    {result.timeline}

  </p>

</div>

<div className="bg-[#1F2937] p-5 rounded-xl">

  <h2 className="text-xl font-bold text-purple-400 mb-2">

    🎯 Decisions

  </h2>

  <p>

    {result.decisions}

  </p>

</div>

          </div>

        )

      }

    </div>

  )

}

export default MultiAgent