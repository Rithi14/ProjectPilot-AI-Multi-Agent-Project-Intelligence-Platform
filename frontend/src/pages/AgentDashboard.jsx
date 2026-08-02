import { useEffect, useState } from "react"
import axios from "axios"
const API_URL = import.meta.env.VITE_API_URL;
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

   axios.get(`${API_URL}/tasks`)

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
  `${API_URL}/tasks/${id}`,
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

  // =========================
  // UI-ONLY: display helpers (no logic change)
  // =========================

  const statusBadge = {
    Pending: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
    "In Progress": "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30",
    Completed: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30",
  }

  const priorityBadge = {
    Low: "bg-slate-500/10 text-slate-300 ring-1 ring-slate-500/30",
    Medium: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
    High: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30",
  }

  const statusActions = [
    { key: "Pending", label: "Pending" },
    { key: "In Progress", label: "In progress" },
    { key: "Completed", label: "Complete" },
  ]

  return (

    <div className="min-h-screen bg-[#0A0E1A] p-8 text-slate-200">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div className="mb-10 flex items-center justify-between border-b border-slate-800 pb-8">

        <div className="flex items-center gap-4">

          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-lg font-semibold text-cyan-400 ring-1 ring-cyan-500/30">
            {loggedInUser ? loggedInUser.charAt(0).toUpperCase() : "A"}
          </span>

          <div>

            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Agent dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Welcome back, {user?.name}
              <span className="mx-2 text-slate-700">·</span>
              <span className="text-slate-500">{user?.role_type}</span>
            </p>

          </div>

        </div>

        <button
          onClick={logout}
          className="rounded-lg border border-rose-500/30 px-5 py-2.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
        >
          Log out
        </button>

      </div>

      {/* ========================= */}
      {/* STATS */}
      {/* ========================= */}

      <div className="mb-10 grid grid-cols-2 gap-5 lg:grid-cols-4">

        <div className="rounded-2xl border border-slate-800 bg-[#111528] p-6">

          <h2 className="text-3xl font-semibold text-cyan-400">
            {myTasks.length}
          </h2>

          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            My tasks
          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111528] p-6">

          <h2 className="text-3xl font-semibold text-amber-400">

            {
              myTasks.filter(
                (task) =>
                  task.status === "Pending"
              ).length
            }

          </h2>

          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Pending
          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111528] p-6">

          <h2 className="text-3xl font-semibold text-indigo-400">

            {
              myTasks.filter(
                (task) =>
                  task.status === "In Progress"
              ).length
            }

          </h2>

          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            In progress
          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111528] p-6">

          <h2 className="text-3xl font-semibold text-emerald-400">

            {
              myTasks.filter(
                (task) =>
                  task.status === "Completed"
              ).length
            }

          </h2>

          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Completed
          </p>

        </div>

      </div>

      {/* ========================= */}
      {/* PROJECT CARDS */}
      {/* ========================= */}

      <div>

        <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Project workspace
        </h2>

        {
          loading && (
            <p className="mb-6 text-sm text-cyan-400">
              Loading projects…
            </p>
          )
        }

        {
          !loading && uniqueProjects.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-800 px-6 py-10 text-center text-sm text-slate-500">
              No projects assigned to you yet
            </div>
          )
        }

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {

            uniqueProjects.map((project, index) => (

              <div
                key={index}
                className="rounded-2xl border border-slate-800 bg-[#111528] p-7 transition hover:border-cyan-500/40"
              >

                <h2 className="text-xl font-semibold tracking-tight text-white">
                  {project}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  View team progress and manage your tasks
                </p>

                <button
                  onClick={() =>
                    setSelectedProject(project)
                  }
                  className="mt-6 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-500"
                >
                  View details
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

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-6 backdrop-blur-sm">
          <div className="mx-auto my-10 w-full max-w-6xl rounded-3xl border border-slate-800 bg-[#0D1120] p-9 shadow-2xl shadow-black/40">

              <div className="flex items-start justify-between border-b border-slate-800 pb-6">

                <div>

                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-cyan-400">
                    Project
                  </p>

                  <h1 className="text-3xl font-semibold tracking-tight text-white">
                    {selectedProject}
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Team progress and task ownership
                  </p>

                </div>

                <button
                  onClick={() =>
                    setSelectedProject(null)
                  }
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  Close
                </button>

              </div>

              {/* ========================= */}
              {/* PROJECT STATS */}
              {/* ========================= */}

              <div className="mt-7 grid grid-cols-2 gap-5 lg:grid-cols-4">

                <div className="rounded-xl border border-slate-800 bg-[#111528] p-6">

                  <h2 className="text-2xl font-semibold text-cyan-400">

                    {projectTasks.length}

                  </h2>

                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Total tasks
                  </p>

                </div>

                <div className="rounded-xl border border-slate-800 bg-[#111528] p-6">

                  <h2 className="text-2xl font-semibold text-amber-400">

                    {
                      projectTasks.filter(
                        (task) =>
                          task.status === "Pending"
                      ).length
                    }

                  </h2>

                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Pending
                  </p>

                </div>

                <div className="rounded-xl border border-slate-800 bg-[#111528] p-6">

                  <h2 className="text-2xl font-semibold text-indigo-400">

                    {
                      projectTasks.filter(
                        (task) =>
                          task.status === "In Progress"
                      ).length
                    }

                  </h2>

                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    In progress
                  </p>

                </div>

                <div className="rounded-xl border border-slate-800 bg-[#111528] p-6">

                  <h2 className="text-2xl font-semibold text-emerald-400">

                    {
                      projectTasks.filter(
                        (task) =>
                          task.status === "Completed"
                      ).length
                    }

                  </h2>

                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Completed
                  </p>

                </div>

              </div>

              {/* ========================= */}
              {/* ALL AGENT TASKS */}
              {/* ========================= */}

              <div className="mt-8 space-y-4">

                {

                  projectTasks.map((task) => (

                    <div
                      key={task.id}
                      className="rounded-2xl border border-slate-800 bg-[#111528] p-7"
                    >

                      <div className="flex flex-wrap items-start justify-between gap-6">

                        <div className="min-w-[240px] flex-1">

                          <h2 className="text-lg font-semibold tracking-tight text-white">
                            {task.task_name}
                          </h2>

                          <div className="mt-5 flex flex-wrap gap-8">

                            <div>

                              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Assigned to
                              </span>

                              <p className="mt-1.5 text-sm font-medium text-slate-200">
                                {task.assigned_to}
                              </p>

                            </div>

                            <div>

                              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Priority
                              </span>

                              <p className="mt-1.5">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityBadge[task.priority] || priorityBadge.Medium}`}>
                                  {task.priority}
                                </span>
                              </p>

                            </div>

                            <div>

                              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Status
                              </span>

                              <p className="mt-1.5">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge[task.status] || statusBadge.Pending}`}>
                                  {task.status}
                                </span>
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* ========================= */}
                        {/* ONLY OWN TASK EDITABLE */}
                        {/* ========================= */}

                        {

                          task.assigned_to === loggedInUser ? (

                            <div className="flex gap-2">

                              {
                                statusActions.map((action) => (
                                  <button
                                    key={action.key}
                                    onClick={() =>
                                      updateTaskStatus(
                                        task.id,
                                        action.key
                                      )
                                    }
                                    className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                                      task.status === action.key
                                        ? statusBadge[action.key] || statusBadge.Pending
                                        : "border border-slate-700 text-slate-400 hover:bg-slate-800"
                                    }`}
                                  >
                                    {action.label}
                                  </button>
                                ))
                              }

                            </div>

                          ) : (

                            <div className="rounded-lg border border-slate-800 bg-[#0D1120] px-4 py-2.5">

                              <p className="text-xs font-medium text-slate-500">
                                View only
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