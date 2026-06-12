import { useEffect, useState } from "react"
import axios from "axios"

function AgentDashboard() {

  // =========================
  // USER
  // =========================

  const user = JSON.parse(
    localStorage.getItem("user")
  )

  const loggedInUser = user?.name

  // =========================
  // STATES
  // =========================

  const [tasks, setTasks] = useState([])

  const [loading, setLoading] = useState(true)

  const [selectedProject, setSelectedProject] =
    useState(null)

  // =========================
  // FETCH TASKS
  // =========================

  useEffect(() => {

    axios
      .get("http://localhost:5000/tasks")

      .then((res) => {

        setTasks(res.data)

        setLoading(false)

      })

      .catch((err) => {

        console.log(err)

        setLoading(false)

      })

  }, [])

  // =========================
  // UPDATE TASK STATUS
  // =========================

  const updateTaskStatus = async (
    id,
    status
  ) => {

    try {

      await axios.put(
        `http://localhost:5000/tasks/${id}`,
        { status }
      )

      const updatedTasks = tasks.map((task) =>

        task.id === id
          ? { ...task, status }
          : task

      )

      setTasks(updatedTasks)

    }

    catch (err) {

      console.log(err)

      alert("Failed To Update")

    }

  }

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {

    localStorage.removeItem("user")

    localStorage.removeItem("loginType")

    window.location.href = "/"

  }

  // =========================
  // ONLY MY TASKS
  // =========================

  const myTasks = tasks.filter(
    (task) =>
      task.assigned_to === loggedInUser
  )

  // =========================
  // UNIQUE PROJECTS
  // =========================

  const uniqueProjects = [
    ...new Set(
      myTasks.map(
        (task) => task.project_name
      )
    )
  ]

  // =========================
  // PROJECT TASKS
  // SHOW ALL AGENTS
  // =========================

  const projectTasks = tasks.filter(
    (task) =>
      task.project_name === selectedProject
  )

  return (

    <div className="min-h-screen bg-[#050816] text-white p-8">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div className="flex justify-between items-center mb-10">

        <div>

          <h1 className="text-5xl font-bold text-cyan-400">
            Agent Dashboard
          </h1>

          <p className="text-gray-400 mt-3 text-lg">
            Welcome {user?.name}
          </p>

          <p className="text-gray-500 mt-1">
            Role : {user?.role_type}
          </p>

        </div>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-xl"
        >
          Logout
        </button>

      </div>

      {/* ========================= */}
      {/* STATS */}
      {/* ========================= */}

      <div className="grid grid-cols-4 gap-6 mb-10">

        <div className="bg-[#111827] p-6 rounded-2xl">

          <h2 className="text-5xl font-bold text-cyan-400">
            {myTasks.length}
          </h2>

          <p className="text-gray-400 mt-3">
            My Tasks
          </p>

        </div>

        <div className="bg-[#111827] p-6 rounded-2xl">

          <h2 className="text-5xl font-bold text-yellow-400">

            {
              myTasks.filter(
                (task) =>
                  task.status === "Pending"
              ).length
            }

          </h2>

          <p className="text-gray-400 mt-3">
            Pending
          </p>

        </div>

        <div className="bg-[#111827] p-6 rounded-2xl">

          <h2 className="text-5xl font-bold text-cyan-400">

            {
              myTasks.filter(
                (task) =>
                  task.status === "In Progress"
              ).length
            }

          </h2>

          <p className="text-gray-400 mt-3">
            In Progress
          </p>

        </div>

        <div className="bg-[#111827] p-6 rounded-2xl">

          <h2 className="text-5xl font-bold text-green-400">

            {
              myTasks.filter(
                (task) =>
                  task.status === "Completed"
              ).length
            }

          </h2>

          <p className="text-gray-400 mt-3">
            Completed
          </p>

        </div>

      </div>

      {/* ========================= */}
      {/* PROJECT CARDS */}
      {/* ========================= */}

      <div>

        <h2 className="text-4xl font-bold mb-10">
          Project Workspace
        </h2>

        {
          loading && (
            <p className="text-cyan-400">
              Loading Projects...
            </p>
          )
        }

        <div className="grid grid-cols-2 gap-8">

          {

            uniqueProjects.map((project, index) => (

              <div
                key={index}
                className="bg-[#111827] border border-cyan-500 rounded-3xl p-10"
              >

                <h2 className="text-5xl font-bold text-cyan-400">
                  {project}
                </h2>

                <p className="text-gray-400 mt-6 text-2xl">
                  View All Agent Progress & Tasks
                </p>

                <button
                  onClick={() =>
                    setSelectedProject(project)
                  }
                  className="mt-10 bg-cyan-500 hover:bg-cyan-600 px-10 py-4 rounded-2xl text-2xl font-semibold"
                >
                  View Details
                </button>

              </div>

            ))

          }

        </div>

      </div>

      {/* ========================= */}
      {/* PROJECT DETAILS POPUP */}
      {/* ========================= */}

      {

        selectedProject && (

        <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto p-6">
          <div className="bg-[#0F172A] border border-cyan-500 rounded-3xl p-10 w-full max-w-7xl mx-auto my-10">

              <div className="flex justify-between items-start">

                <div>

                  <h1 className="text-6xl font-bold text-cyan-400">
                    {selectedProject}
                  </h1>

                  <p className="text-gray-400 mt-4 text-2xl">
                    Team Progress & Tasks
                  </p>

                </div>

                <button
                  onClick={() =>
                    setSelectedProject(null)
                  }
                  className="bg-red-500 hover:bg-red-600 px-8 py-4 rounded-2xl text-xl"
                >
                  Close
                </button>

              </div>

              {/* ========================= */}
              {/* PROJECT STATS */}
              {/* ========================= */}

              <div className="grid grid-cols-4 gap-6 mt-10">

                <div className="bg-[#1E293B] p-8 rounded-2xl">

                  <h2 className="text-5xl font-bold text-cyan-400">

                    {projectTasks.length}

                  </h2>

                  <p className="text-gray-400 mt-4 text-xl">
                    Total Tasks
                  </p>

                </div>

                <div className="bg-[#1E293B] p-8 rounded-2xl">

                  <h2 className="text-5xl font-bold text-yellow-400">

                    {
                      projectTasks.filter(
                        (task) =>
                          task.status === "Pending"
                      ).length
                    }

                  </h2>

                  <p className="text-gray-400 mt-4 text-xl">
                    Pending
                  </p>

                </div>

                <div className="bg-[#1E293B] p-8 rounded-2xl">

                  <h2 className="text-5xl font-bold text-cyan-400">

                    {
                      projectTasks.filter(
                        (task) =>
                          task.status === "In Progress"
                      ).length
                    }

                  </h2>

                  <p className="text-gray-400 mt-4 text-xl">
                    In Progress
                  </p>

                </div>

                <div className="bg-[#1E293B] p-8 rounded-2xl">

                  <h2 className="text-5xl font-bold text-green-400">

                    {
                      projectTasks.filter(
                        (task) =>
                          task.status === "Completed"
                      ).length
                    }

                  </h2>

                  <p className="text-gray-400 mt-4 text-xl">
                    Completed
                  </p>

                </div>

              </div>

              {/* ========================= */}
              {/* ALL AGENT TASKS */}
              {/* ========================= */}

              <div className="mt-10 space-y-6">

                {

                  projectTasks.map((task) => (

                    <div
                      key={task.id}
                      className="bg-[#1E293B] border border-cyan-500 p-8 rounded-3xl"
                    >

                      <div className="flex justify-between items-start">

                        <div>

                          <h2 className="text-4xl font-bold text-cyan-400">
                            {task.task_name}
                          </h2>

                          <div className="flex gap-16 mt-8">

                            <div>

                              <span className="text-gray-500 text-lg">
                                Assigned To
                              </span>

                              <p className="text-white text-2xl mt-2">
                                {task.assigned_to}
                              </p>

                            </div>

                            <div>

                              <span className="text-gray-500 text-lg">
                                Priority
                              </span>

                              <p className="text-yellow-400 text-2xl mt-2">
                                {task.priority}
                              </p>

                            </div>

                            <div>

                              <span className="text-gray-500 text-lg">
                                Status
                              </span>

                              <p className="text-green-400 text-2xl mt-2">
                                {task.status}
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* ========================= */}
                        {/* ONLY OWN TASK EDITABLE */}
                        {/* ========================= */}

                        {

                          task.assigned_to === loggedInUser ? (

                            <div className="flex flex-col gap-4">

                              <button
                                onClick={() =>
                                  updateTaskStatus(
                                    task.id,
                                    "Pending"
                                  )
                                }
                                className="bg-yellow-400 hover:bg-yellow-500 px-8 py-4 rounded-2xl text-xl font-semibold"
                              >
                                Pending
                              </button>

                              <button
                                onClick={() =>
                                  updateTaskStatus(
                                    task.id,
                                    "In Progress"
                                  )
                                }
                                className="bg-cyan-500 hover:bg-cyan-600 px-8 py-4 rounded-2xl text-xl font-semibold"
                              >
                                In Progress
                              </button>

                              <button
                                onClick={() =>
                                  updateTaskStatus(
                                    task.id,
                                    "Completed"
                                  )
                                }
                                className="bg-green-500 hover:bg-green-600 px-8 py-4 rounded-2xl text-xl font-semibold"
                              >
                                Complete
                              </button>

                            </div>

                          ) : (

                            <div className="bg-[#0F172A] px-8 py-6 rounded-2xl border border-gray-700">

                              <p className="text-gray-400 text-xl">
                                View Only
                              </p>

                            </div>

                          )

                        }

                      </div>

                    </div>

                  ))

                }

              </div>

            </div>

          </div>

        )

      }

    </div>

  )

}

export default AgentDashboard