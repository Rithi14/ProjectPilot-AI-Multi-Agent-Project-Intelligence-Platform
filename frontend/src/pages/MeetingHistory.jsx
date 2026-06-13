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

    <div className="w-full mt-10">

      <div className="bg-slate-900 border border-purple-500 rounded-3xl p-8">

        <h2 className="text-4xl font-bold text-purple-400 mb-8">

          📋 Meeting History

        </h2>

        {

          loading ? (

            <div className="text-white">

              Loading Meetings...

            </div>

          ) : meetings.length === 0 ? (

            <div className="text-gray-400">

              No Meeting Records Found

            </div>

          ) : (

            meetings.map((meeting) => (

              <div

                key={meeting.id}

                className="
                  bg-slate-800
                  border
                  border-slate-700
                  rounded-2xl
                  p-6
                  mb-6
                "

              >

                <div className="flex justify-between items-start">

                  <div>

                    <h3 className="text-2xl font-bold text-purple-300">

                      {meeting.title}

                    </h3>

                    <p className="text-gray-400 text-sm mt-1">

                      {
                        meeting.created_at
                          ? new Date(
                              meeting.created_at
                            ).toLocaleString()
                          : "No Date"
                      }

                    </p>

                  </div>

                  <div className="flex gap-3">

                    <button

                      onClick={() =>
                        downloadPDF(
                          meeting
                        )
                      }

                      className="
                        bg-purple-600
                        hover:bg-purple-700
                        px-4
                        py-2
                        rounded-lg
                        text-white
                      "

                    >

                      📄 PDF

                    </button>

                    <button

                      onClick={() =>
                        setSelectedMeeting(
                          meeting
                        )
                      }

                      className="
                        bg-blue-600
                        hover:bg-blue-700
                        px-4
                        py-2
                        rounded-lg
                        text-white
                      "

                    >

                      🤖 Ask AI

                    </button>

                    <button

                      onClick={() =>
                        deleteMeeting(
                          meeting.id
                        )
                      }

                      className="
                        bg-red-600
                        hover:bg-red-700
                        px-4
                        py-2
                        rounded-lg
                        text-white
                      "

                    >

                      🗑 Delete

                    </button>

                  </div>

                </div>

                <div className="mt-5">

                  <h4 className="text-pink-400 font-bold text-lg mb-2">

                    📄 Summary

                  </h4>

                  <p className="text-gray-300 whitespace-pre-line">

                    {
                      meeting.summary ||
                      "No Summary"
                    }

                  </p>

                </div>

                {

                  meeting.tasks && (

                    <div className="mt-5">

                      <h4 className="text-green-400 font-bold text-lg mb-2">

                        ✅ Tasks

                      </h4>

                      <p className="text-gray-300 whitespace-pre-line">

                        {meeting.tasks}

                      </p>

                    </div>

                  )

                }

                {

                  meeting.reminders && (

                    <div className="mt-5">

                      <h4 className="text-yellow-400 font-bold text-lg mb-2">

                        ⏰ Reminders

                      </h4>

                      <p className="text-gray-300 whitespace-pre-line">

                        {meeting.reminders}

                      </p>

                    </div>

                  )

                }
                {
  meeting.risks && (

    <div className="mt-5">

      <h4 className="text-red-400 font-bold text-lg mb-2">
        🚨 Risks
      </h4>

      <p className="text-gray-300 whitespace-pre-line">
        {meeting.risks}
      </p>

    </div>

  )
}
{
  meeting.timeline && (

    <div className="mt-5">

      <h4 className="text-blue-400 font-bold text-lg mb-2">
        📅 Timeline
      </h4>

      <p className="text-gray-300 whitespace-pre-line">
        {meeting.timeline}
      </p>

    </div>

  )
}
{
  meeting.decisions && (

    <div className="mt-5">

      <h4 className="text-purple-400 font-bold text-lg mb-2">
        🎯 Decisions
      </h4>

      <p className="text-gray-300 whitespace-pre-line">
        {meeting.decisions}
      </p>

    </div>

  )
}

              </div>

            ))

          )

        }

      </div>

      {

        selectedMeeting && (

          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">

            <div className="bg-slate-900 border border-purple-500 w-[800px] rounded-3xl p-8">

              <h2 className="text-3xl font-bold text-purple-400 mb-4">

                🤖 AI Project Assistant

              </h2>

              <h3 className="text-xl text-white mb-4">

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

                placeholder="Ask anything about this project..."

                className="
                  w-full
                  bg-slate-800
                  border
                  border-slate-700
                  rounded-xl
                  p-4
                  text-white
                "

              />

              <div className="flex gap-3 mt-4">

                <button

                  onClick={askProjectAI}

                  className="
                    bg-purple-600
                    hover:bg-purple-700
                    px-5
                    py-3
                    rounded-xl
                    text-white
                  "

                >

                  Ask AI

                </button>

                <button

                  onClick={() => {

                    setSelectedMeeting(null)
                    setQuestion("")
                    setAnswer("")

                  }}

                  className="
                    bg-red-600
                    hover:bg-red-700
                    px-5
                    py-3
                    rounded-xl
                    text-white
                  "

                >

                  Close

                </button>

              </div>

              {

                answer && (

                  <div className="mt-6 bg-slate-800 rounded-xl p-5">

                    <h4 className="text-green-400 font-bold mb-3">

                      AI Response

                    </h4>

                    <p className="text-gray-300 whitespace-pre-line">

                      {answer}

                    </p>

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
